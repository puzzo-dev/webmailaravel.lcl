<?php

namespace App\Services;

use App\Models\Domain;
use App\Models\Sender;
use App\Models\TrainingConfig;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\CacheManagementTrait;
use App\Traits\FileProcessingTrait;
use Carbon\Carbon;
use App\Models\Campaign; // Added for trainSenderFromCampaign

class AutomaticTrainingService
{
    use LoggingTrait, ValidationTrait, CacheManagementTrait, FileProcessingTrait;

    protected $powerMtaService;
    protected $reputationThresholds = [
        'excellent' => 90,
        'good' => 80,
        'fair' => 70,
        'poor' => 60,
        'critical' => 50
    ];

    public function __construct(PowerMTAService $powerMtaService)
    {
        $this->powerMtaService = $powerMtaService;
    }

    /**
     * Run automatic training for all senders
     */
    public function runAutomaticTraining(): array
    {
        $this->logInfo('Starting automatic training process');
        
        $results = [
            'senders_processed' => 0,
            'senders_updated' => 0,
            'errors' => []
        ];

        try {
            // Get all active senders
            $senders = Sender::with(['domain', 'user'])
                ->where('is_active', true)
                ->get();
            
            foreach ($senders as $sender) {
                try {
                    $updated = $this->processSender($sender);
                    $results['senders_processed']++;
                    if ($updated) {
                        $results['senders_updated']++;
                    }
                } catch (\Exception $e) {
                    $this->logError('Error processing sender: ' . $sender->email, ['error' => $e->getMessage()]);
                    $results['errors'][] = "Sender {$sender->email}: " . $e->getMessage();
                }
            }

            $this->logInfo('Automatic training completed', $results);
            return $results;

        } catch (\Exception $e) {
            $this->logError('Automatic training failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Process a single sender
     */
    public function processSender(Sender $sender): bool
    {
        $this->logInfo("Processing sender: {$sender->email}");

        // Get PowerMTA data for this sender
        $senderData = $this->analyzeSenderFromPowerMTA($sender);
        
        if (empty($senderData)) {
            $this->logWarning("No PowerMTA data found for sender: {$sender->email}");
            return false;
        }

        // Calculate new reputation score
        $newReputation = $this->calculateReputationScore($senderData);
        
        // Update sender reputation and limits
        $oldLimit = $sender->daily_limit;
        $oldReputation = $sender->reputation_score;
        
        $sender->update([
            'reputation_score' => $newReputation,
            'training_data' => $senderData,
            'last_training_at' => now()
        ]);
        
        // Update daily limit based on new reputation
        $sender->updateDailyLimitFromReputation();
        
        $this->logInfo("Sender training completed", [
            'email' => $sender->email,
            'old_reputation' => $oldReputation,
            'new_reputation' => $newReputation,
            'old_limit' => $oldLimit,
            'new_limit' => $sender->fresh()->daily_limit
        ]);
        
        return $sender->daily_limit !== $oldLimit;
    }

    /**
     * Analyze sender from PowerMTA CSV files
     */
    protected function analyzeSenderFromPowerMTA(Sender $sender): array
    {
        $senderData = [
            'total_sent' => 0,
            'total_delivered' => 0,
            'total_bounced' => 0,
            'total_complaints' => 0,
            'delivery_rate' => 0,
            'bounce_rate' => 0,
            'complaint_rate' => 0,
            'analysis_date' => now()->toDateString()
        ];

        try {
            // Analyze accounting CSV files
            $accountingData = $this->analyzeAccountingCSV($sender);
            if ($accountingData) {
                $senderData = array_merge($senderData, $accountingData);
            }

            // Analyze diagnostic CSV files
            $diagnosticData = $this->analyzeDiagnosticCSV($sender);
            if ($diagnosticData) {
                $senderData['bounces'] = $diagnosticData;
            }

            // Analyze FBL CSV files
            $fblData = $this->analyzeFBLCSV($sender);
            if ($fblData) {
                $senderData['complaints'] = $fblData;
            }

            // Calculate rates
            if ($senderData['total_sent'] > 0) {
                $senderData['delivery_rate'] = ($senderData['total_delivered'] / $senderData['total_sent']) * 100;
                $senderData['bounce_rate'] = ($senderData['total_bounced'] / $senderData['total_sent']) * 100;
                $senderData['complaint_rate'] = ($senderData['total_complaints'] / $senderData['total_sent']) * 100;
            }

            return $senderData;

        } catch (\Exception $e) {
            $this->logError("Error analyzing PowerMTA data for sender: {$sender->email}", [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Analyze accounting CSV for sender
     */
    protected function analyzeAccountingCSV(Sender $sender): ?array
    {
        try {
            $csvFiles = $this->getPowerMtaCSVFiles('acct');
            $stats = ['total_sent' => 0, 'total_delivered' => 0];
            
            foreach ($csvFiles as $csvFile) {
                $data = $this->parseCSVFile($csvFile);
                
                foreach ($data as $row) {
                    // Check if this row is for our sender
                    if ($this->matchesSender($row, $sender)) {
                        $stats['total_sent'] += intval($row['sent'] ?? $row['messages'] ?? 0);
                        $stats['total_delivered'] += intval($row['delivered'] ?? $row['success'] ?? 0);
                    }
                }
            }
            
            return $stats['total_sent'] > 0 ? $stats : null;
            
        } catch (\Exception $e) {
            $this->logError("Error analyzing accounting CSV for sender: {$sender->email}", [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Analyze diagnostic CSV for sender
     */
    protected function analyzeDiagnosticCSV(Sender $sender): ?array
    {
        try {
            $csvFiles = $this->getPowerMtaCSVFiles('diag');
            $bounces = 0;
            
            foreach ($csvFiles as $csvFile) {
                $data = $this->parseCSVFile($csvFile);
                
                foreach ($data as $row) {
                    if ($this->matchesSender($row, $sender)) {
                        // Count bounces (permanent failures)
                        $status = strtolower($row['status'] ?? $row['result'] ?? '');
                        if (strpos($status, 'bounce') !== false || strpos($status, 'failed') !== false) {
                            $bounces++;
                        }
                    }
                }
            }
            
            return $bounces > 0 ? ['total_bounced' => $bounces] : null;
            
        } catch (\Exception $e) {
            $this->logError("Error analyzing diagnostic CSV for sender: {$sender->email}", [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Analyze FBL CSV for sender
     */
    protected function analyzeFBLCSV(Sender $sender): ?array
    {
        try {
            $csvFiles = $this->getPowerMtaCSVFiles('fbl');
            $complaints = 0;
            
            foreach ($csvFiles as $csvFile) {
                $data = $this->parseCSVFile($csvFile);
                
                foreach ($data as $row) {
                    if ($this->matchesSender($row, $sender)) {
                        $complaints++;
                    }
                }
            }
            
            return $complaints > 0 ? ['total_complaints' => $complaints] : null;
            
        } catch (\Exception $e) {
            $this->logError("Error analyzing FBL CSV for sender: {$sender->email}", [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get PowerMTA CSV files by type
     */
    protected function getPowerMtaCSVFiles(string $type): array
    {
        $basePath = config('services.powermta.csv_path', '/var/log/powermta');
        $files = [];
        
        if (!is_dir($basePath)) {
            $this->logWarning("PowerMTA CSV directory not found: {$basePath}");
            return [];
        }
        
        // Look for files matching pattern: acct*.csv, diag*.csv, fbl*.csv
        $pattern = $basePath . '/' . $type . '*.csv';
        $matchedFiles = glob($pattern);
        
        foreach ($matchedFiles as $file) {
            // Only include files modified in the last 7 days
            if (filemtime($file) > strtotime('-7 days')) {
                $files[] = $file;
            }
        }
        
        return $files;
    }

    /**
     * Check if CSV row matches sender
     */
    protected function matchesSender(array $row, Sender $sender): bool
    {
        $senderEmail = strtolower($sender->email);
        $senderDomain = strtolower($sender->domain->name);
        
        // Check various possible column names for sender email/domain
        $emailFields = ['from', 'sender', 'email', 'orig_from', 'envelope_from'];
        $domainFields = ['domain', 'from_domain', 'sender_domain'];
        
        foreach ($emailFields as $field) {
            if (isset($row[$field]) && strtolower($row[$field]) === $senderEmail) {
                return true;
            }
        }
        
        foreach ($domainFields as $field) {
            if (isset($row[$field]) && strtolower($row[$field]) === $senderDomain) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Parse CSV file
     */
    protected function parseCSVFile(string $filePath): array
    {
        $data = [];
        
        if (($handle = fopen($filePath, "r")) !== false) {
            $headers = fgetcsv($handle);
            
            while (($row = fgetcsv($handle)) !== false) {
                $data[] = array_combine($headers, $row);
            }
            
            fclose($handle);
        }

        return $data;
    }

    /**
     * Calculate reputation score from sender data
     */
    protected function calculateReputationScore(array $senderData): float
    {
        $score = 50.0; // Start with neutral score
        
        $deliveryRate = $senderData['delivery_rate'] ?? 0;
        $bounceRate = $senderData['bounce_rate'] ?? 0;
        $complaintRate = $senderData['complaint_rate'] ?? 0;
        $totalSent = $senderData['total_sent'] ?? 0;
        
        // Base score on delivery rate
        if ($deliveryRate >= 95) {
            $score = 95;
        } elseif ($deliveryRate >= 90) {
            $score = 85;
        } elseif ($deliveryRate >= 85) {
            $score = 75;
        } elseif ($deliveryRate >= 80) {
            $score = 65;
        } elseif ($deliveryRate >= 70) {
            $score = 55;
        } else {
            $score = 30;
        }
        
        // Penalize high bounce rates
        if ($bounceRate > 10) {
            $score -= 30;
        } elseif ($bounceRate > 5) {
            $score -= 20;
        } elseif ($bounceRate > 2) {
            $score -= 10;
        }
        
        // Penalize high complaint rates
        if ($complaintRate > 1) {
            $score -= 40;
        } elseif ($complaintRate > 0.5) {
            $score -= 25;
        } elseif ($complaintRate > 0.1) {
            $score -= 10;
        }
        
        // Bonus for high volume senders with good performance
        if ($totalSent > 1000 && $deliveryRate > 90 && $bounceRate < 2) {
            $score += 5;
        }
        
        return max(1, min(100, $score));
    }

    /**
     * Find sender in account data
     */
    protected function findSenderInAccountData(Sender $sender, array $accountData): ?array
    {
        foreach ($accountData as $row) {
            if (isset($row['sender']) && $row['sender'] === $sender->email) {
                return $row;
            }
        }
        return null;
    }

    /**
     * Find sender in diagnostic data
     */
    protected function findSenderInDiagnosticData(Sender $sender, array $diagnosticData): ?array
    {
        foreach ($diagnosticData as $row) {
            if (isset($row['sender']) && $row['sender'] === $sender->email) {
                return $row;
            }
        }
        return null;
    }

    /**
     * Find sender in FBL data
     */
    protected function findSenderInFBLData(Sender $sender, array $fblData): ?array
    {
        foreach ($fblData as $row) {
            if (isset($row['sender']) && $row['sender'] === $sender->email) {
                return $row;
            }
        }
        return null;
    }

    /**
     * Calculate score from account data
     */
    protected function calculateAccountScore(array $accountData, float $currentScore): float
    {
        // Analyze sending volume and success rate
        $sent = (int) ($accountData['sent'] ?? 0);
        $delivered = (int) ($accountData['delivered'] ?? 0);
        $bounced = (int) ($accountData['bounced'] ?? 0);
        $complained = (int) ($accountData['complained'] ?? 0);

        if ($sent > 0) {
            $deliveryRate = ($delivered / $sent) * 100;
            $bounceRate = ($bounced / $sent) * 100;
            $complaintRate = ($complained / $sent) * 100;

            // Adjust score based on delivery rate
            if ($deliveryRate < 95) {
                $currentScore -= (95 - $deliveryRate) * 2;
            }

            // Penalize high bounce rates
            if ($bounceRate > 2) {
                $currentScore -= ($bounceRate - 2) * 5;
            }

            // Penalize high complaint rates
            if ($complaintRate > 0.1) {
                $currentScore -= ($complaintRate - 0.1) * 50;
            }
        }

        return $currentScore;
    }

    /**
     * Calculate score from diagnostic data
     */
    protected function calculateDiagnosticScore(array $diagnosticData, float $currentScore): float
    {
        // Analyze delivery statistics
        $softBounces = (int) ($diagnosticData['soft_bounces'] ?? 0);
        $hardBounces = (int) ($diagnosticData['hard_bounces'] ?? 0);
        $deferred = (int) ($diagnosticData['deferred'] ?? 0);

        $totalIssues = $softBounces + $hardBounces + $deferred;
        $totalSent = (int) ($diagnosticData['sent'] ?? 0);

        if ($totalSent > 0) {
            $issueRate = ($totalIssues / $totalSent) * 100;

            // Penalize high issue rates
            if ($issueRate > 5) {
                $currentScore -= ($issueRate - 5) * 3;
            }

            // Extra penalty for hard bounces
            if ($hardBounces > 0) {
                $hardBounceRate = ($hardBounces / $totalSent) * 100;
                $currentScore -= $hardBounceRate * 10;
            }
        }

        return $currentScore;
    }

    /**
     * Calculate score from FBL data
     */
    protected function calculateFBLScore(array $fblData, float $currentScore): float
    {
        // Analyze feedback loop complaints
        $complaints = (int) ($fblData['complaints'] ?? 0);
        $totalSent = (int) ($fblData['sent'] ?? 0);

        if ($totalSent > 0) {
            $complaintRate = ($complaints / $totalSent) * 100;

            // Heavy penalty for complaints
            if ($complaintRate > 0.01) {
                $currentScore -= $complaintRate * 100;
            }
        }

        return $currentScore;
    }

    /**
     * Calculate new daily limit based on reputation
     */
    protected function calculateNewLimit(Sender $sender, float $reputationScore): int
    {
        $baseLimit = 20; // Initial limit per sender
        $maxLimit = 1000; // Maximum limit per sender

        if ($reputationScore >= $this->reputationThresholds['excellent']) {
            // Excellent reputation: increase by 50%
            $newLimit = min($maxLimit, (int) ($sender->daily_limit * 1.5));
        } elseif ($reputationScore >= $this->reputationThresholds['good']) {
            // Good reputation: increase by 25%
            $newLimit = min($maxLimit, (int) ($sender->daily_limit * 1.25));
        } elseif ($reputationScore >= $this->reputationThresholds['fair']) {
            // Fair reputation: maintain current limit
            $newLimit = $sender->daily_limit;
        } elseif ($reputationScore >= $this->reputationThresholds['poor']) {
            // Poor reputation: decrease by 25%
            $newLimit = max($baseLimit, (int) ($sender->daily_limit * 0.75));
        } else {
            // Critical reputation: decrease by 50%
            $newLimit = max($baseLimit, (int) ($sender->daily_limit * 0.5));
        }

        return $newLimit;
    }

    /**
     * Update domain reputation
     */
    protected function updateDomainReputation(Domain $domain, array $powerMtaData): void
    {
        $senders = $domain->senders()->where('is_active', true)->get();
        
        if ($senders->isEmpty()) {
            return;
        }

        // Calculate average reputation score
        $totalScore = $senders->sum('reputation_score');
        $averageScore = $totalScore / $senders->count();

        $domain->update([
            'reputation_score' => $averageScore,
            'last_reputation_check' => now()
        ]);

        $this->logInfo("Updated domain reputation", [
            'domain' => $domain->name,
            'reputation_score' => $averageScore
        ]);
    }

    /**
     * Get training statistics
     */
    public function getTrainingStatistics(): array
    {
        $domains = Domain::with(['senders'])->where('is_active', true)->get();
        
        $stats = [
            'total_domains' => $domains->count(),
            'total_senders' => $domains->sum(function($domain) {
                return $domain->senders->count();
            }),
            'average_reputation' => $domains->avg('reputation_score'),
            'domains_by_reputation' => [
                'excellent' => $domains->where('reputation_score', '>=', $this->reputationThresholds['excellent'])->count(),
                'good' => $domains->whereBetween('reputation_score', [$this->reputationThresholds['good'], $this->reputationThresholds['excellent']])->count(),
                'fair' => $domains->whereBetween('reputation_score', [$this->reputationThresholds['fair'], $this->reputationThresholds['good']])->count(),
                'poor' => $domains->whereBetween('reputation_score', [$this->reputationThresholds['poor'], $this->reputationThresholds['fair']])->count(),
                'critical' => $domains->where('reputation_score', '<', $this->reputationThresholds['poor'])->count(),
            ]
        ];

        return $stats;
    }

    /**
     * Train sender based on campaign results (from TrainingService)
     */
    public function trainSenderFromCampaign(Campaign $campaign): void
    {
        try {
            // Get all senders for this campaign
            $senders = $campaign->getSenders();
            
            if ($senders->isEmpty()) {
                return;
            }

            $trainingData = [
                'campaign_id' => $campaign->id,
                'emails_sent' => $campaign->total_sent ?? 0,
                'bounces' => $campaign->bounces ?? 0,
                'fbl_complaints' => $campaign->complaints ?? 0,
                'opens' => $campaign->opens ?? 0,
                'clicks' => $campaign->clicks ?? 0,
            ];

            // Update training data for each sender
            foreach ($senders as $sender) {
                $this->updateSenderTrainingData($sender, $trainingData);
                
                // Analyze and adjust if needed
                $this->analyzeSenderReputation($sender);
                
                $this->logInfo('Sender trained from campaign', [
                    'sender_id' => $sender->id,
                    'campaign_id' => $campaign->id,
                    'training_data' => $trainingData
                ]);
            }

        } catch (\Exception $e) {
            $this->logError('Sender training from campaign failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update sender training data (from TrainingService)
     */
    protected function updateSenderTrainingData(Sender $sender, array $trainingData): void
    {
        $cacheKey = "sender_training_data:{$sender->id}";
        $existingData = $this->getCache($cacheKey, [
            'sent' => 0,
            'bounces' => 0,
            'fbl_complaints' => 0,
            'opens' => 0,
            'clicks' => 0,
        ]);

        // Update with new data
        $existingData['sent'] += $trainingData['emails_sent'];
        $existingData['bounces'] += $trainingData['bounces'];
        $existingData['fbl_complaints'] += $trainingData['fbl_complaints'];
        $existingData['opens'] += $trainingData['opens'];
        $existingData['clicks'] += $trainingData['clicks'];

        $this->putCache($cacheKey, $existingData, 1800);
    }

    /**
     * Get training summary for all senders (from TrainingService)
     */
    public function getTrainingSummary(): array
    {
        try {
            $senders = Sender::with('domain')->get();
            $summary = [];

            foreach ($senders as $sender) {
                $reputation = $this->calculateSenderReputation($sender, []);
                $trainingData = $this->getTrainingData($sender);
                
                $summary[] = [
                    'sender_id' => $sender->id,
                    'domain' => $sender->domain->name,
                    'reputation' => $reputation,
                    'daily_limit' => $sender->daily_limit,
                    'training_data' => $trainingData,
                    'status' => $reputation > 70 ? 'good' : ($reputation > 40 ? 'fair' : 'poor')
                ];
            }

            $this->logInfo('Training summary generated', [
                'senders_count' => count($summary)
            ]);

            return $summary;

        } catch (\Exception $e) {
            $this->logError('Training summary generation failed', [
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Get training data for sender (from TrainingService)
     */
    protected function getTrainingData(Sender $sender): array
    {
        $cacheKey = "sender_training_data:{$sender->id}";
        
        return $this->rememberCache($cacheKey, 1800, function () use ($sender) {
            $thirtyDaysAgo = now()->subDays(30);
            
            return [
                'sent' => $sender->campaigns()
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->sum('emails_sent'),
                'bounces' => $sender->campaigns()
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->sum('bounces'),
                'fbl_complaints' => $sender->campaigns()
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->sum('fbl_complaints'),
                'opens' => $sender->campaigns()
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->sum('opens'),
                'clicks' => $sender->campaigns()
                    ->where('created_at', '>=', $thirtyDaysAgo)
                    ->sum('clicks'),
            ];
        });
    }

    /**
     * Analyze sender reputation and adjust training (from TrainingService)
     */
    public function analyzeSenderReputation(Sender $sender): array
    {
        try {
            $domain = $sender->domain;
            $currentReputation = $this->calculateSenderReputation($sender, []);
            $trainingData = $this->getTrainingData($sender);
            
            $analysis = [
                'sender_id' => $sender->id,
                'domain' => $domain->name,
                'current_reputation' => $currentReputation,
                'training_data' => $trainingData,
                'recommendations' => []
            ];

            // Analyze bounce rate
            $bounceRate = $trainingData['bounces'] / max($trainingData['sent'], 1) * 100;
            if ($bounceRate > 5) {
                $analysis['recommendations'][] = 'High bounce rate detected - consider reducing sending volume';
                $this->reduceSendingVolume($sender, 20);
            } elseif ($bounceRate < 2) {
                $analysis['recommendations'][] = 'Low bounce rate - can increase sending volume';
                $this->increaseSendingVolume($sender, 10);
            }

            // Analyze FBL complaints
            $fblRate = $trainingData['fbl_complaints'] / max($trainingData['sent'], 1) * 100;
            if ($fblRate > 0.1) {
                $analysis['recommendations'][] = 'High FBL complaint rate - review content and sending practices';
                $this->reduceSendingVolume($sender, 30);
            }

            // Analyze engagement
            $openRate = $trainingData['opens'] / max($trainingData['sent'], 1) * 100;
            if ($openRate < 10) {
                $analysis['recommendations'][] = 'Low engagement rate - review subject lines and content';
            }

            $this->logInfo('Sender reputation analyzed', [
                'sender_id' => $sender->id,
                'domain' => $domain->name,
                'bounce_rate' => $bounceRate,
                'fbl_rate' => $fblRate,
                'open_rate' => $openRate,
                'recommendations_count' => count($analysis['recommendations'])
            ]);

            return $analysis;

        } catch (\Exception $e) {
            $this->logError('Sender reputation analysis failed', [
                'sender_id' => $sender->id,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Reduce sending volume for sender (from TrainingService)
     */
    protected function reduceSendingVolume(Sender $sender, int $percentage): void
    {
        $currentLimit = $sender->daily_limit;
        $newLimit = max(20, $currentLimit - ($currentLimit * $percentage / 100));
        
        $sender->update(['daily_limit' => $newLimit]);
        
        $this->logInfo('Sender sending volume reduced', [
            'sender_id' => $sender->id,
            'old_limit' => $currentLimit,
            'new_limit' => $newLimit,
            'reduction_percentage' => $percentage
        ]);
    }

    /**
     * Increase sending volume for sender (from TrainingService)
     */
    protected function increaseSendingVolume(Sender $sender, int $percentage): void
    {
        $currentLimit = $sender->daily_limit;
        $newLimit = min(1000, $currentLimit + ($currentLimit * $percentage / 100));
        
        $sender->update(['daily_limit' => $newLimit]);
        
        $this->logInfo('Sender sending volume increased', [
            'sender_id' => $sender->id,
            'old_limit' => $currentLimit,
            'new_limit' => $newLimit,
            'increase_percentage' => $percentage
        ]);
    }
} 