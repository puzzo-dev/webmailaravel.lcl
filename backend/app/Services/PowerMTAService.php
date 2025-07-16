<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Traits\SuppressionListTrait;
use App\Traits\LoggingTrait;
use App\Traits\FileProcessingTrait;
use Carbon\Carbon;
use Exception;

class PowerMTAService
{
    use SuppressionListTrait, LoggingTrait, FileProcessingTrait;

    protected $baseUrl;
    protected $apiKey;
    protected $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.powermta.base_url', 'http://localhost:8080');
        $this->apiKey = config('services.powermta.api_key');
        $this->timeout = config('services.powermta.timeout', 30);
    }

    /**
     * Get PowerMTA status and health
     */
    public function getStatus(): array
    {
        try {
            $headers = $this->withAuth($this->apiKey);
            $result = $this->get($this->baseUrl . '/api/status', $headers, $this->timeout);
            if ($result['success']) {
                return [
                    'status' => 'online',
                    'data' => $result['data'],
                    'timestamp' => now()->toISOString()
                ];
            }
            return [
                'status' => 'offline',
                'error' => $result['error'] ?? 'PowerMTA service unavailable',
                'timestamp' => now()->toISOString()
            ];
        } catch (\Exception $e) {
            $this->logError('PowerMTA status check failed', ['error' => $e->getMessage()]);
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ];
        }
    }

    /**
     * Get FBL (Feedback Loop) account data
     */
    public function getFBLAccounts(): array
    {
        try {
            $headers = $this->withAuth($this->apiKey);
            $result = $this->get($this->baseUrl . '/api/fbl/accounts', $headers, $this->timeout);
            if ($result['success']) {
                return [
                    'success' => true,
                    'data' => $result['data'],
                    'timestamp' => now()->toISOString()
                ];
            }
            return [
                'success' => false,
                'error' => 'Failed to fetch FBL accounts',
                'timestamp' => now()->toISOString()
            ];
        } catch (\Exception $e) {
            $this->logError('PowerMTA FBL accounts fetch failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ];
        }
    }

    /**
     * Get diagnostic CSV files from PowerMTA
     */
    public function getDiagnosticFiles(string $date = null): array
    {
        try {
            $date = $date ?? now()->format('Y-m-d');
            
            $headers = $this->withAuth($this->apiKey);
            $result = $this->get($this->baseUrl . '/api/diagnostics/files', $headers, $this->timeout, ['date' => $date]);

            if ($result['success']) {
                return [
                    'success' => true,
                    'data' => $result['data'],
                    'date' => $date,
                    'timestamp' => now()->toISOString()
                ];
            }

            return [
                'success' => false,
                'error' => 'Failed to fetch diagnostic files',
                'date' => $date,
                'timestamp' => now()->toISOString()
            ];
        } catch (\Exception $e) {
            $this->logError('PowerMTA diagnostic files fetch failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'date' => $date ?? now()->format('Y-m-d'),
                'timestamp' => now()->toISOString()
            ];
        }
    }

    /**
     * Download and parse diagnostic CSV file with automatic suppression list processing
     */
    public function parseDiagnosticFile(string $filename, string $date = null): array
    {
        try {
            $date = $date ?? now()->format('Y-m-d');
            
            $headers = $this->withAuth($this->apiKey);
            $result = $this->get($this->baseUrl . '/api/diagnostics/download', $headers, $this->timeout, ['filename' => $filename, 'date' => $date]);

            if ($result['success']) {
                $csvData = $result['data'];
                $parsedData = $this->parseCSVData($csvData);
                
                // Save CSV file for processing
                $filepath = 'fbl_files/' . $date . '_' . $filename;
                $this->saveFile($filepath, $csvData);
                
                // Process FBL file and add to suppression list
                $suppressionResult = $this->processFBLFile($filepath, 'powermta_fbl');
                
                return [
                    'success' => true,
                    'filename' => $filename,
                    'date' => $date,
                    'data' => $parsedData,
                    'suppression_processing' => $suppressionResult,
                    'timestamp' => now()->toISOString()
                ];
            }

            return [
                'success' => false,
                'error' => 'Failed to download diagnostic file',
                'filename' => $filename,
                'date' => $date,
                'timestamp' => now()->toISOString()
            ];
        } catch (\Exception $e) {
            $this->logError('PowerMTA diagnostic file parse failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'filename' => $filename,
                'date' => $date ?? now()->format('Y-m-d'),
                'timestamp' => now()->toISOString()
            ];
        }
    }

    /**
     * Parse CSV data from diagnostic files
     */
    protected function parseCSVData(string $csvData): array
    {
        $lines = explode("\n", trim($csvData));
        $headers = str_getcsv(array_shift($lines));
        $data = [];

        foreach ($lines as $line) {
            if (empty(trim($line))) continue;
            
            $row = str_getcsv($line);
            if (count($row) === count($headers)) {
                $data[] = array_combine($headers, $row);
            }
        }

        return $data;
    }

    /**
     * Analyze sender reputation with suppression list integration
     */
    public function analyzeSenderReputation(string $senderDomain, string $date = null): array
    {
        try {
            $date = $date ?? now()->format('Y-m-d');
            
            // Get FBL data
            $fblData = $this->getFBLDataForDomain($senderDomain, $date);
            
            // Get diagnostic data
            $diagnosticData = $this->getDiagnosticDataForDomain($senderDomain, $date);
            
            // Calculate reputation metrics
            $metrics = $this->calculateReputationMetrics($fblData, $diagnosticData);
            
            // Process FBL complaints for suppression list
            if (!empty($fblData)) {
                $this->processFBLComplaints($fblData, $senderDomain, $date);
            }
            
            return [
                'success' => true,
                'domain' => $senderDomain,
                'date' => $date,
                'metrics' => $metrics,
                'fbl_data' => $fblData,
                'diagnostic_data' => $diagnosticData,
                'timestamp' => now()->toISOString()
            ];
            
        } catch (\Exception $e) {
            $this->logError('PowerMTA reputation analysis failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'domain' => $senderDomain,
                'date' => $date ?? now()->format('Y-m-d'),
                'timestamp' => now()->toISOString()
            ];
        }
    }

    /**
     * Process FBL complaints and add to suppression list
     */
    protected function processFBLComplaints(array $fblData, string $domain, string $date): void
    {
        try {
            $complaints = [];
            
            foreach ($fblData as $record) {
                if (isset($record['email']) && $this->validateEmail($record['email'])) {
                    $complaints[] = $record['email'];
                }
            }
            
            if (!empty($complaints)) {
                // Create FBL complaints file
                $filepath = 'fbl_files/' . $date . '_' . $domain . '_complaints.txt';
                $content = implode("\n", $complaints);
                $this->saveFile($filepath, $content);
                
                // Process through suppression list service
                $this->processFBLFile($filepath, 'powermta_fbl_' . $domain);
                
                $this->logInfo('FBL complaints processed for suppression list', [
                    'domain' => $domain,
                    'date' => $date,
                    'complaints_count' => count($complaints),
                    'filepath' => $filepath
                ]);
            }
            
        } catch (\Exception $e) {
            $this->logError('Failed to process FBL complaints', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get FBL data for specific domain
     */
    protected function getFBLDataForDomain(string $domain, string $date): array
    {
        try {
            $headers = $this->withAuth($this->apiKey);
            $result = $this->get($this->baseUrl . '/api/fbl/data', $headers, $this->timeout, ['domain' => $domain, 'date' => $date]);

            if ($result['success']) {
                return $result['data'];
            }

            return [];
        } catch (\Exception $e) {
            $this->logError('Failed to get FBL data for domain', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Get diagnostic data for specific domain
     */
    protected function getDiagnosticDataForDomain(string $domain, string $date): array
    {
        try {
            $headers = $this->withAuth($this->apiKey);
            $result = $this->get($this->baseUrl . '/api/diagnostics/data', $headers, $this->timeout, ['domain' => $domain, 'date' => $date]);

            if ($result['success']) {
                return $result['data'];
            }

            return [];
        } catch (\Exception $e) {
            $this->logError('Failed to get diagnostic data for domain', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Calculate reputation metrics
     */
    protected function calculateReputationMetrics(array $fblData, array $diagnosticData): array
    {
        $totalSent = count($diagnosticData);
        $totalDelivered = 0;
        $totalBounced = 0;
        $totalComplaints = count($fblData);
        
        foreach ($diagnosticData as $record) {
            if (isset($record['status'])) {
                if ($record['status'] === 'delivered') {
                    $totalDelivered++;
                } elseif (in_array($record['status'], ['bounce', 'hard_bounce', 'soft_bounce'])) {
                    $totalBounced++;
                }
            }
        }
        
        $deliveryRate = $totalSent > 0 ? ($totalDelivered / $totalSent) * 100 : 0;
        $bounceRate = $totalSent > 0 ? ($totalBounced / $totalSent) * 100 : 0;
        $complaintRate = $totalSent > 0 ? ($totalComplaints / $totalSent) * 100 : 0;
        
        return [
            'total_sent' => $totalSent,
            'total_delivered' => $totalDelivered,
            'total_bounced' => $totalBounced,
            'total_complaints' => $totalComplaints,
            'delivery_rate' => round($deliveryRate, 2),
            'bounce_rate' => round($bounceRate, 2),
            'complaint_rate' => round($complaintRate, 2),
            'reputation_score' => $this->calculateReputationScore($deliveryRate, $bounceRate, $complaintRate)
        ];
    }

    /**
     * Calculate reputation score
     */
    protected function calculateReputationScore(float $deliveryRate, float $bounceRate, float $complaintRate): float
    {
        $score = 100;
        
        // Deduct points for bounces
        $score -= $bounceRate * 2;
        
        // Deduct points for complaints
        $score -= $complaintRate * 10;
        
        // Bonus for high delivery rate
        if ($deliveryRate > 95) {
            $score += 5;
        }
        
        return max(0, min(100, round($score, 2)));
    }

    /**
     * Get PowerMTA configuration
     */
    public function getConfiguration(): array
    {
        try {
            $headers = $this->withAuth($this->apiKey);
            $result = $this->get($this->baseUrl . '/api/config', $headers, $this->timeout);
            if ($result['success']) {
                return [
                    'success' => true,
                    'data' => $result['data'],
                    'timestamp' => now()->toISOString()
                ];
            }
            return [
                'success' => false,
                'error' => 'Failed to fetch configuration',
                'timestamp' => now()->toISOString()
            ];
        } catch (\Exception $e) {
            $this->logError('PowerMTA configuration fetch failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ];
        }
    }

    /**
     * Update PowerMTA configuration
     */
    public function updateConfiguration(array $config): array
    {
        try {
            $headers = $this->withAuth($this->apiKey);
            $result = $this->put($this->baseUrl . '/api/config', $headers, $this->timeout, $config);
            if ($result['success']) {
                return [
                    'success' => true,
                    'data' => $result['data'],
                    'timestamp' => now()->toISOString()
                ];
            }
            return [
                'success' => false,
                'error' => 'Failed to update configuration',
                'timestamp' => now()->toISOString()
            ];
        } catch (\Exception $e) {
            $this->logError('PowerMTA configuration update failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ];
        }
    }
} 