<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Process;
use Carbon\Carbon;
use App\Models\Domain;
use App\Models\Campaign;

class PowerMTAService
{
    private $accountingPath;
    private $fblPath;
    private $diagPath;
    private $configPath;

    public function __construct()
    {
        $this->accountingPath = config('powermta.accounting_path', '/var/log/pmta/acct-*.csv');
        $this->fblPath = config('powermta.fbl_path', '/var/log/pmta/fbl-*.csv');
        $this->diagPath = config('powermta.diag_path', '/var/log/pmta/diag-*.csv');
        $this->configPath = config('powermta.config_path', '/etc/pmta/config');
    }

    /**
     * Parse PowerMTA accounting files for domain metrics
     */
    public function parseAccountingFiles($domain = null, $hours = 24)
    {
        $metrics = [
            'total_sent' => 0,
            'delivered' => 0,
            'bounced' => 0,
            'complaints' => 0,
            'delivery_rate' => 0,
            'bounce_rate' => 0,
            'complaint_rate' => 0,
        ];

        try {
            $files = glob($this->accountingPath);
            $cutoffTime = Carbon::now()->subHours($hours);

            foreach ($files as $file) {
                $handle = fopen($file, 'r');
                if (!$handle) continue;

                while (($line = fgets($handle)) !== false) {
                    $data = str_getcsv($line);
                    
                    if (count($data) < 8) continue;

                    // PowerMTA accounting format: type, timeLogged, orig, rcpt, vmta, jobId, dsnStatus, dsnMta, bodySize
                    $type = $data[0];
                    $timeLogged = $data[1];
                    $orig = $data[2];
                    $rcpt = $data[3];
                    $vmta = $data[4];
                    $jobId = $data[5];
                    $dsnStatus = $data[6];

                    // Skip if not within time range
                    if (Carbon::parse($timeLogged)->lt($cutoffTime)) {
                        continue;
                    }

                    // Extract domain from orig email
                    $emailDomain = substr(strrchr($orig, '@'), 1);
                    
                    // If filtering by domain, skip if not matching
                    if ($domain && $emailDomain !== $domain) {
                        continue;
                    }

                    switch ($type) {
                        case 'd': // Delivered
                            $metrics['delivered']++;
                            break;
                        case 'b': // Bounced
                            $metrics['bounced']++;
                            break;
                        case 'f': // Feedback loop (complaint)
                            $metrics['complaints']++;
                            break;
                        case 'r': // Relay (sent)
                            $metrics['total_sent']++;
                            break;
                    }
                }
                fclose($handle);
            }

            // Calculate rates
            if ($metrics['total_sent'] > 0) {
                $metrics['delivery_rate'] = ($metrics['delivered'] / $metrics['total_sent']) * 100;
                $metrics['bounce_rate'] = ($metrics['bounced'] / $metrics['total_sent']) * 100;
                $metrics['complaint_rate'] = ($metrics['complaints'] / $metrics['total_sent']) * 100;
            }

            Log::info('PowerMTA metrics parsed', [
                'domain' => $domain,
                'metrics' => $metrics
            ]);

            return $metrics;

        } catch (\Exception $e) {
            Log::error('Failed to parse PowerMTA accounting files', [
                'error' => $e->getMessage(),
                'domain' => $domain
            ]);
            return $metrics;
        }
    }

    /**
     * Update PowerMTA configuration for domain
     */
    public function updateDomainConfig($domain, $maxMsgRate)
    {
        try {
            $configContent = file_get_contents($this->configPath);
            
            // Find and update domain configuration
            $pattern = "/<domain {$domain}>(.*?)<\/domain>/s";
            
            if (preg_match($pattern, $configContent)) {
                // Update existing domain config
                $newConfig = preg_replace(
                    "/(max-msg-rate\s+)(\d+)/",
                    "max-msg-rate {$maxMsgRate}",
                    $configContent
                );
            } else {
                // Add new domain config
                $domainConfig = "\n<domain {$domain}>\n";
                $domainConfig .= "    max-msg-rate {$maxMsgRate}\n";
                $domainConfig .= "</domain>\n";
                
                $newConfig = $configContent . $domainConfig;
            }

            // Write updated config
            file_put_contents($this->configPath, $newConfig);

            // Reload PowerMTA configuration
            $this->reloadConfig();

            Log::info('PowerMTA domain config updated', [
                'domain' => $domain,
                'max_msg_rate' => $maxMsgRate
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to update PowerMTA domain config', [
                'error' => $e->getMessage(),
                'domain' => $domain,
                'max_msg_rate' => $maxMsgRate
            ]);
            return false;
        }
    }

    /**
     * Reload PowerMTA configuration
     */
    public function reloadConfig()
    {
        try {
            $result = Process::run('pmta reload');
            
            if ($result->successful()) {
                Log::info('PowerMTA configuration reloaded successfully');
                return true;
            } else {
                Log::error('Failed to reload PowerMTA configuration', [
                    'error' => $result->errorOutput()
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Failed to reload PowerMTA configuration', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Parse PowerMTA FBL (Feedback Loop) files
     */
    public function parseFBLFiles($domain = null, $hours = 24)
    {
        $fblData = [];

        try {
            $files = glob($this->fblPath);
            $cutoffTime = Carbon::now()->subHours($hours);

            foreach ($files as $file) {
                $handle = fopen($file, 'r');
                if (!$handle) continue;

                while (($line = fgets($handle)) !== false) {
                    $data = str_getcsv($line);
                    
                    if (count($data) < 4) continue;

                    // FBL format: timestamp, orig, rcpt, feedback_type
                    $timestamp = $data[0];
                    $orig = $data[1];
                    $rcpt = $data[2];
                    $feedbackType = $data[3];

                    // Skip if not within time range
                    if (Carbon::parse($timestamp)->lt($cutoffTime)) {
                        continue;
                    }

                    // Extract domain from orig email
                    $emailDomain = substr(strrchr($orig, '@'), 1);
                    
                    // If filtering by domain, skip if not matching
                    if ($domain && $emailDomain !== $domain) {
                        continue;
                    }

                    $fblData[] = [
                        'timestamp' => $timestamp,
                        'orig' => $orig,
                        'rcpt' => $rcpt,
                        'feedback_type' => $feedbackType,
                        'domain' => $emailDomain
                    ];
                }
                fclose($handle);
            }

            Log::info('PowerMTA FBL files parsed', [
                'domain' => $domain,
                'fbl_count' => count($fblData)
            ]);

            return $fblData;

        } catch (\Exception $e) {
            Log::error('Failed to parse PowerMTA FBL files', [
                'error' => $e->getMessage(),
                'domain' => $domain
            ]);
            return [];
        }
    }

    /**
     * Parse PowerMTA diagnostic files
     */
    public function parseDiagFiles($domain = null, $hours = 24)
    {
        $diagData = [];

        try {
            $files = glob($this->diagPath);
            $cutoffTime = Carbon::now()->subHours($hours);

            foreach ($files as $file) {
                $handle = fopen($file, 'r');
                if (!$handle) continue;

                while (($line = fgets($handle)) !== false) {
                    $data = str_getcsv($line);
                    
                    if (count($data) < 6) continue;

                    // Diagnostic format: timestamp, orig, rcpt, vmta, diag_code, diag_text
                    $timestamp = $data[0];
                    $orig = $data[1];
                    $rcpt = $data[2];
                    $vmta = $data[3];
                    $diagCode = $data[4];
                    $diagText = $data[5];

                    // Skip if not within time range
                    if (Carbon::parse($timestamp)->lt($cutoffTime)) {
                        continue;
                    }

                    // Extract domain from orig email
                    $emailDomain = substr(strrchr($orig, '@'), 1);
                    
                    // If filtering by domain, skip if not matching
                    if ($domain && $emailDomain !== $domain) {
                        continue;
                    }

                    $diagData[] = [
                        'timestamp' => $timestamp,
                        'orig' => $orig,
                        'rcpt' => $rcpt,
                        'vmta' => $vmta,
                        'diag_code' => $diagCode,
                        'diag_text' => $diagText,
                        'domain' => $emailDomain
                    ];
                }
                fclose($handle);
            }

            Log::info('PowerMTA diagnostic files parsed', [
                'domain' => $domain,
                'diag_count' => count($diagData)
            ]);

            return $diagData;

        } catch (\Exception $e) {
            Log::error('Failed to parse PowerMTA diagnostic files', [
                'error' => $e->getMessage(),
                'domain' => $domain
            ]);
            return [];
        }
    }

    /**
     * Training configuration for domains
     */
    public function getTrainingConfig()
    {
        return [
            'initial_rate' => 100,
            'increase_factor' => 2,
            'max_bounce_rate' => 5.0,
            'max_complaint_rate' => 0.1,
            'early_stage' => 5000,
            'mid_stage' => 20000,
            'provider_limits' => [
                'gmail' => 2000,
                'yahoo' => 1000,
                'microsoft' => 500,
                'outlook' => 500,
                'other' => 1000
            ]
        ];
    }

    /**
     * Apply training configuration to domain
     */
    public function applyTrainingConfig($domainId)
    {
        try {
            $domain = Domain::findOrFail($domainId);
            $config = $this->getTrainingConfig();
            $metrics = $this->parseAccountingFiles($domain->domain);

            $totalSent = $metrics['total_sent'];
            $deliveryRate = $metrics['delivery_rate'];
            $bounceRate = $metrics['bounce_rate'];
            $complaintRate = $metrics['complaint_rate'];

            $newRate = $config['initial_rate'];
            $provider = $domain->provider ?? 'other';
            $maxProviderRate = $config['provider_limits'][$provider] ?? $config['provider_limits']['other'];

            // Apply training logic
            if ($totalSent < $config['early_stage']) {
                // Early stage - keep initial rate
                $newRate = $config['initial_rate'];
            } elseif ($totalSent < $config['mid_stage']) {
                // Mid stage - increase if metrics are good
                if ($deliveryRate > 95 && $bounceRate < $config['max_bounce_rate'] && $complaintRate < $config['max_complaint_rate']) {
                    $newRate = min($domain->max_msg_rate * $config['increase_factor'], $maxProviderRate);
                } else {
                    // Reduce rate if metrics are poor
                    $newRate = max($domain->max_msg_rate * 0.5, $config['initial_rate']);
                }
            } else {
                // Mature stage - set to provider limit if metrics are good
                if ($deliveryRate > 95 && $bounceRate < $config['max_bounce_rate'] && $complaintRate < $config['max_complaint_rate']) {
                    $newRate = $maxProviderRate;
                } else {
                    // Reduce rate if metrics are poor
                    $newRate = max($domain->max_msg_rate * 0.5, $config['initial_rate']);
                }
            }

            // Update domain configuration
            $domain->update([
                'max_msg_rate' => $newRate,
                'total_sent' => $totalSent,
                'delivery_rate' => $deliveryRate,
                'bounce_rate' => $bounceRate,
                'complaint_rate' => $complaintRate,
                'last_training_check' => now(),
            ]);

            // Update PowerMTA config
            $this->updateDomainConfig($domain->domain, $newRate);

            Log::info('Training configuration applied', [
                'domain' => $domain->domain,
                'total_sent' => $totalSent,
                'delivery_rate' => $deliveryRate,
                'bounce_rate' => $bounceRate,
                'complaint_rate' => $complaintRate,
                'new_rate' => $newRate,
                'provider' => $provider,
                'max_provider_rate' => $maxProviderRate
            ]);

            return [
                'success' => true,
                'new_rate' => $newRate,
                'metrics' => $metrics,
                'total_sent' => $totalSent
            ];

        } catch (\Exception $e) {
            Log::error('Failed to apply training configuration', [
                'error' => $e->getMessage(),
                'domain_id' => $domainId
            ]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get domain status for monitoring
     */
    public function getDomainStatus($domainId)
    {
        try {
            $domain = Domain::findOrFail($domainId);
            $metrics = $this->parseAccountingFiles($domain->domain);

            return [
                'domain' => $domain->domain,
                'max_msg_rate' => $domain->max_msg_rate,
                'total_sent' => $metrics['total_sent'],
                'delivery_rate' => $metrics['delivery_rate'],
                'bounce_rate' => $metrics['bounce_rate'],
                'complaint_rate' => $metrics['complaint_rate'],
                'last_training_check' => $domain->last_training_check,
                'provider' => $domain->provider,
                'status' => $this->getDomainHealthStatus($metrics)
            ];

        } catch (\Exception $e) {
            Log::error('Failed to get domain status', [
                'error' => $e->getMessage(),
                'domain_id' => $domainId
            ]);
            return null;
        }
    }

    /**
     * Get domain health status based on metrics
     */
    private function getDomainHealthStatus($metrics)
    {
        $config = $this->getTrainingConfig();
        
        if ($metrics['bounce_rate'] > $config['max_bounce_rate'] || 
            $metrics['complaint_rate'] > $config['max_complaint_rate']) {
            return 'poor';
        }
        
        if ($metrics['delivery_rate'] > 95) {
            return 'excellent';
        }
        
        if ($metrics['delivery_rate'] > 90) {
            return 'good';
        }
        
        return 'fair';
    }

    /**
     * Get comprehensive domain analytics from all CSV files
     */
    public function getComprehensiveDomainAnalytics($domain, $hours = 24)
    {
        $acctMetrics = $this->parseAccountingFiles($domain, $hours);
        $fblData = $this->parseFBLFiles($domain, $hours);
        $diagData = $this->parseDiagFiles($domain, $hours);

        // Analyze diagnostic data for common issues
        $diagAnalysis = $this->analyzeDiagnosticData($diagData);

        return [
            'domain' => $domain,
            'time_period' => $hours,
            'accounting_metrics' => $acctMetrics,
            'fbl_data' => [
                'total_complaints' => count($fblData),
                'complaint_types' => array_count_values(array_column($fblData, 'feedback_type')),
                'complaints' => $fblData
            ],
            'diagnostic_data' => [
                'total_diagnostics' => count($diagData),
                'analysis' => $diagAnalysis,
                'diagnostics' => $diagData
            ],
            'overall_health' => $this->calculateOverallHealth($acctMetrics, $fblData, $diagData)
        ];
    }

    /**
     * Analyze diagnostic data for patterns and issues
     */
    private function analyzeDiagnosticData($diagData)
    {
        $analysis = [
            'error_codes' => [],
            'common_issues' => [],
            'vmta_performance' => []
        ];

        foreach ($diagData as $diag) {
            // Count error codes
            if (!isset($analysis['error_codes'][$diag['diag_code']])) {
                $analysis['error_codes'][$diag['diag_code']] = 0;
            }
            $analysis['error_codes'][$diag['diag_code']]++;

            // Count VMTA performance
            if (!isset($analysis['vmta_performance'][$diag['vmta']])) {
                $analysis['vmta_performance'][$diag['vmta']] = 0;
            }
            $analysis['vmta_performance'][$diag['vmta']]++;

            // Identify common issues
            $diagText = strtolower($diag['diag_text']);
            if (strpos($diagText, 'spam') !== false) {
                $analysis['common_issues']['spam']++;
            } elseif (strpos($diagText, 'reputation') !== false) {
                $analysis['common_issues']['reputation']++;
            } elseif (strpos($diagText, 'rate') !== false) {
                $analysis['common_issues']['rate_limiting']++;
            } elseif (strpos($diagText, 'blocked') !== false) {
                $analysis['common_issues']['blocked']++;
            }
        }

        return $analysis;
    }

    /**
     * Calculate overall domain health based on all metrics
     */
    private function calculateOverallHealth($acctMetrics, $fblData, $diagData)
    {
        $score = 100;
        $issues = [];

        // Deduct points for poor delivery rate
        if ($acctMetrics['delivery_rate'] < 95) {
            $score -= (95 - $acctMetrics['delivery_rate']) * 2;
            $issues[] = 'Low delivery rate';
        }

        // Deduct points for high bounce rate
        if ($acctMetrics['bounce_rate'] > 5) {
            $score -= ($acctMetrics['bounce_rate'] - 5) * 3;
            $issues[] = 'High bounce rate';
        }

        // Deduct points for complaints
        if ($acctMetrics['complaint_rate'] > 0.1) {
            $score -= ($acctMetrics['complaint_rate'] - 0.1) * 10;
            $issues[] = 'High complaint rate';
        }

        // Deduct points for excessive FBL complaints
        if (count($fblData) > 10) {
            $score -= (count($fblData) - 10) * 2;
            $issues[] = 'Excessive FBL complaints';
        }

        // Deduct points for diagnostic issues
        if (count($diagData) > 50) {
            $score -= (count($diagData) - 50) * 0.5;
            $issues[] = 'Multiple diagnostic issues';
        }

        $score = max(0, min(100, $score));

        $healthStatus = 'excellent';
        if ($score < 50) {
            $healthStatus = 'poor';
        } elseif ($score < 70) {
            $healthStatus = 'fair';
        } elseif ($score < 85) {
            $healthStatus = 'good';
        }

        return [
            'score' => round($score, 2),
            'status' => $healthStatus,
            'issues' => $issues
        ];
    }

    /**
     * Export domain analytics to CSV
     */
    public function exportDomainAnalytics($domain, $hours = 24)
    {
        $analytics = $this->getComprehensiveDomainAnalytics($domain, $hours);
        
        $csvData = [];
        $csvData[] = ['Domain', 'Time Period (hours)', 'Total Sent', 'Delivered', 'Bounced', 'Complaints', 'Delivery Rate', 'Bounce Rate', 'Complaint Rate', 'Health Score', 'Health Status'];
        
        $csvData[] = [
            $analytics['domain'],
            $analytics['time_period'],
            $analytics['accounting_metrics']['total_sent'],
            $analytics['accounting_metrics']['delivered'],
            $analytics['accounting_metrics']['bounced'],
            $analytics['accounting_metrics']['complaints'],
            $analytics['accounting_metrics']['delivery_rate'] . '%',
            $analytics['accounting_metrics']['bounce_rate'] . '%',
            $analytics['accounting_metrics']['complaint_rate'] . '%',
            $analytics['overall_health']['score'],
            $analytics['overall_health']['status']
        ];

        return $csvData;
    }
}
