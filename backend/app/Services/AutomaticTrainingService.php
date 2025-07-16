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
     * Run automatic training for all domains
     */
    public function runAutomaticTraining(): array
    {
        $this->logInfo('Starting automatic training process');
        
        $results = [
            'domains_processed' => 0,
            'senders_updated' => 0,
            'errors' => []
        ];

        try {
            // Get all active domains
            $domains = Domain::with(['senders', 'user'])->where('is_active', true)->get();
            
            foreach ($domains as $domain) {
                try {
                    $this->processDomain($domain);
                    $results['domains_processed']++;
                } catch (\Exception $e) {
                    $this->logError('Error processing domain: ' . $domain->name, ['error' => $e->getMessage()]);
                    $results['errors'][] = "Domain {$domain->name}: " . $e->getMessage();
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
     * Process a single domain
     */
    protected function processDomain(Domain $domain): void
    {
        $this->logInfo("Processing domain: {$domain->name}");

        // Get PowerMTA data for this domain
        $powerMtaData = $this->getPowerMtaData($domain);
        
        if (empty($powerMtaData)) {
            $this->logWarning("No PowerMTA data found for domain: {$domain->name}");
            return;
        }

        // Analyze reputation and adjust sender limits
        $this->analyzeAndAdjustSenders($domain, $powerMtaData);
        
        // Update domain reputation
        $this->updateDomainReputation($domain, $powerMtaData);
    }

    /**
     * Get PowerMTA data for domain
     */
    protected function getPowerMtaData(Domain $domain): array
    {
        $data = [];

        // Get account data (sending statistics)
        $accountData = $this->getAccountData($domain);
        if ($accountData) {
            $data['account'] = $accountData;
        }

        // Get diagnostic data (delivery statistics)
        $diagnosticData = $this->getDiagnosticData($domain);
        if ($diagnosticData) {
            $data['diagnostic'] = $diagnosticData;
        }

        // Get FBL data (feedback loop)
        $fblData = $this->getFBLData($domain);
        if ($fblData) {
            $data['fbl'] = $fblData;
        }

        return $data;
    }

    /**
     * Get account data from PowerMTA
     */
    protected function getAccountData(Domain $domain): ?array
    {
        try {
            $csvFile = $this->getPowerMtaCSVFile('account', $domain->name);
            if (!$csvFile) {
                return null;
            }

            return $this->parseCSVFile($csvFile);
        } catch (\Exception $e) {
            $this->logError("Error getting account data for domain: {$domain->name}", ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Get diagnostic data from PowerMTA
     */
    protected function getDiagnosticData(Domain $domain): ?array
    {
        try {
            $csvFile = $this->getPowerMtaCSVFile('diagnostic', $domain->name);
            if (!$csvFile) {
                return null;
            }

            return $this->parseCSVFile($csvFile);
        } catch (\Exception $e) {
            $this->logError("Error getting diagnostic data for domain: {$domain->name}", ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Get FBL data from PowerMTA
     */
    protected function getFBLData(Domain $domain): ?array
    {
        try {
            $csvFile = $this->getPowerMtaCSVFile('fbl', $domain->name);
            if (!$csvFile) {
                return null;
            }

            return $this->parseCSVFile($csvFile);
        } catch (\Exception $e) {
            $this->logError("Error getting FBL data for domain: {$domain->name}", ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Get PowerMTA CSV file path
     */
    protected function getPowerMtaCSVFile(string $type, string $domain): ?string
    {
        $basePath = config('services.powermta.csv_path', '/var/log/powermta');
        $fileName = "{$type}_{$domain}.csv";
        $filePath = "{$basePath}/{$fileName}";

        if (!file_exists($filePath)) {
            return null;
        }

        return $filePath;
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
     * Analyze and adjust sender limits based on reputation
     */
    protected function analyzeAndAdjustSenders(Domain $domain, array $powerMtaData): void
    {
        $senders = $domain->senders()->where('is_active', true)->get();
        
        foreach ($senders as $sender) {
            $reputationScore = $this->calculateSenderReputation($sender, $powerMtaData);
            $newLimit = $this->calculateNewLimit($sender, $reputationScore);
            
            if ($newLimit !== $sender->daily_limit) {
                $oldLimit = $sender->daily_limit;
                $sender->update([
                    'daily_limit' => $newLimit,
                    'reputation_score' => $reputationScore,
                    'last_training_at' => now()
                ]);

                $this->logInfo("Updated sender limit", [
                    'domain' => $domain->name,
                    'sender' => $sender->email,
                    'old_limit' => $oldLimit,
                    'new_limit' => $newLimit,
                    'reputation_score' => $reputationScore
                ]);
            }
        }
    }

    /**
     * Calculate sender reputation score
     */
    protected function calculateSenderReputation(Sender $sender, array $powerMtaData): float
    {
        $score = 100.0; // Start with perfect score
        
        // Account data analysis
        if (isset($powerMtaData['account'])) {
            $accountData = $this->findSenderInAccountData($sender, $powerMtaData['account']);
            if ($accountData) {
                $score = $this->calculateAccountScore($accountData, $score);
            }
        }

        // Diagnostic data analysis
        if (isset($powerMtaData['diagnostic'])) {
            $diagnosticData = $this->findSenderInDiagnosticData($sender, $powerMtaData['diagnostic']);
            if ($diagnosticData) {
                $score = $this->calculateDiagnosticScore($diagnosticData, $score);
            }
        }

        // FBL data analysis
        if (isset($powerMtaData['fbl'])) {
            $fblData = $this->findSenderInFBLData($sender, $powerMtaData['fbl']);
            if ($fblData) {
                $score = $this->calculateFBLScore($fblData, $score);
            }
        }

        return max(0, min(100, $score));
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
            $sender = $campaign->sender;
            
            if (!$sender) {
                return;
            }

            $trainingData = [
                'campaign_id' => $campaign->id,
                'emails_sent' => $campaign->emails_sent,
                'bounces' => $campaign->bounces,
                'fbl_complaints' => $campaign->fbl_complaints,
                'opens' => $campaign->opens,
                'clicks' => $campaign->clicks,
            ];

            // Update sender training data
            $this->updateSenderTrainingData($sender, $trainingData);
            
            // Analyze and adjust if needed
            $this->analyzeSenderReputation($sender);
            
            $this->logInfo('Sender trained from campaign', [
                'sender_id' => $sender->id,
                'campaign_id' => $campaign->id,
                'training_data' => $trainingData
            ]);

        } catch (\Exception $e) {
            $this->logError('Sender training from campaign failed', [
                'campaign_id' => $campaign->id,
                'sender_id' => $campaign->sender_id,
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
                    'domain' => $sender->domain->domain,
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
                'domain' => $domain->domain,
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
                'domain' => $domain->domain,
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