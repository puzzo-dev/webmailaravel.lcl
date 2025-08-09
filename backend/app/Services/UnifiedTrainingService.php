<?php

namespace App\Services;

use App\Models\User;
use App\Models\Sender;
use App\Models\Domain;
use App\Models\SystemConfig;
use App\Models\TrainingConfig;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\CacheManagementTrait;
use App\Traits\FileProcessingTrait;
use App\Services\PerformanceMonitoringService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UnifiedTrainingService
{
    use LoggingTrait, ValidationTrait, CacheManagementTrait, FileProcessingTrait;

    protected $powerMtaService;
    protected $performanceService;
    protected $reputationThresholds = [
        'excellent' => 90,
        'good' => 80,
        'fair' => 70,
        'poor' => 60,
        'critical' => 50
    ];

    public function __construct(PowerMTAService $powerMtaService, PerformanceMonitoringService $performanceService)
    {
        $this->powerMtaService = $powerMtaService;
        $this->performanceService = $performanceService;
    }

    /**
     * Run training based on system configuration (manual or automatic)
     */
    public function runTraining(?User $user = null, ?string $domainId = null): array
    {
        // Start performance monitoring
        $performanceData = $this->performanceService->monitorTrainingPerformance(
            'unified', 
            $user ? 1 : 0, 
            $domainId ? 1 : 0
        );
        
        try {
            $systemMode = SystemConfig::get('TRAINING_DEFAULT_MODE', 'automatic');
            
            $result = $systemMode === 'manual' 
                ? $this->runManualTraining($user, $domainId)
                : $this->runAutomaticTraining($user, $domainId);
            
            // End performance monitoring
            $this->performanceService->endTiming($performanceData['timing'], array_merge(
                $performanceData['metadata'],
                ['result_status' => 'success', 'senders_processed' => $result['senders_processed'] ?? 0]
            ));
            
            return $result;
            
        } catch (\Exception $e) {
            // End performance monitoring with error
            $this->performanceService->endTiming($performanceData['timing'], array_merge(
                $performanceData['metadata'],
                ['result_status' => 'error', 'error' => $e->getMessage()]
            ));
            
            throw $e;
        }
    }

    /**
     * Run automatic training for senders
     */
    public function runAutomaticTraining(?User $user = null, ?string $domainId = null): array
    {
        $this->logInfo('Starting automatic training process', [
            'user_id' => $user?->id,
            'domain_id' => $domainId
        ]);
        
        $results = [
            'type' => 'automatic',
            'senders_processed' => 0,
            'senders_updated' => 0,
            'errors' => []
        ];

        try {
            $senders = $this->getSendersForTraining($user, $domainId);
            
            foreach ($senders as $sender) {
                try {
                    $updated = $this->processAutomaticSender($sender);
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
     * Run manual training for senders
     */
    public function runManualTraining(?User $user = null, ?string $domainId = null): array
    {
        $this->logInfo('Starting manual training process', [
            'user_id' => $user?->id,
            'domain_id' => $domainId
        ]);

        $results = [
            'type' => 'manual',
            'senders_processed' => 0,
            'senders_updated' => 0,
            'errors' => []
        ];

        try {
            // Get manual training settings from system config
            $startLimit = (int) SystemConfig::get('TRAINING_MANUAL_START_LIMIT', 50);
            $increasePercentage = (int) SystemConfig::get('TRAINING_MANUAL_INCREASE_PERCENTAGE', 10);
            $intervalDays = (int) SystemConfig::get('TRAINING_MANUAL_INCREASE_INTERVAL_DAYS', 2);
            $maxLimit = (int) SystemConfig::get('TRAINING_MANUAL_MAX_LIMIT', 500);

            $senders = $this->getSendersForTraining($user, $domainId);

            foreach ($senders as $sender) {
                try {
                    $updated = $this->processManualSender($sender, $startLimit, $increasePercentage, $intervalDays, $maxLimit);
                    $results['senders_processed']++;
                    if ($updated) {
                        $results['senders_updated']++;
                    }
                } catch (\Exception $e) {
                    $error = "Failed to update sender {$sender->email}: " . $e->getMessage();
                    $results['errors'][] = $error;
                    $this->logError($error, [
                        'sender_id' => $sender->id,
                        'user_id' => $sender->user_id
                    ]);
                }
            }

            // Update user's last manual training timestamp if specific user
            if ($user) {
                $user->updateManualTrainingTimestamp();
            }

            $this->logInfo('Manual training completed', $results);
            return $results;

        } catch (\Exception $e) {
            $this->logError('Manual training failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Process a single sender for automatic training
     */
    private function processAutomaticSender(Sender $sender): bool
    {
        $this->logInfo("Processing sender for automatic training: {$sender->email}");

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
            'training_data' => array_merge($senderData, [
                'type' => 'automatic',
                'old_limit' => $oldLimit,
                'old_reputation' => $oldReputation,
                'updated_at' => now()->toISOString()
            ]),
            'last_training_at' => now()
        ]);

        $this->logInfo("Automatic training applied to sender", [
            'sender_id' => $sender->id,
            'sender_email' => $sender->email,
            'old_reputation' => $oldReputation,
            'new_reputation' => $newReputation,
            'daily_limit' => $sender->daily_limit
        ]);

        return true;
    }

    /**
     * Process a single sender for manual training
     */
    private function processManualSender(Sender $sender, int $startLimit, int $increasePercentage, int $intervalDays, int $maxLimit): bool
    {
        $daysSinceCreation = $sender->created_at->diffInDays(now());
        $trainingIntervals = floor($daysSinceCreation / $intervalDays);
        
        // Calculate new limit: start_limit * (1 + increase_percentage/100)^intervals
        $newLimit = $startLimit * pow(1 + ($increasePercentage / 100), $trainingIntervals);
        $newLimit = min($maxLimit, (int) $newLimit);

        $oldLimit = $sender->daily_limit;
        
        // Only update if the new limit is higher than current
        if ($newLimit > $oldLimit) {
            $sender->update([
                'daily_limit' => $newLimit,
                'last_training_at' => now(),
                'training_data' => [
                    'type' => 'manual',
                    'old_limit' => $oldLimit,
                    'new_limit' => $newLimit,
                    'training_intervals' => $trainingIntervals,
                    'updated_at' => now()->toISOString()
                ]
            ]);

            $this->logInfo("Manual training applied to sender", [
                'sender_id' => $sender->id,
                'sender_email' => $sender->email,
                'old_limit' => $oldLimit,
                'new_limit' => $newLimit,
                'training_intervals' => $trainingIntervals
            ]);

            return true;
        }

        return false;
    }

    /**
     * Get senders for training based on filters
     */
    private function getSendersForTraining(?User $user = null, ?string $domainId = null)
    {
        $query = Sender::with(['domain', 'user'])->where('is_active', true);

        if ($user) {
            $query->where('user_id', $user->id);
        }

        if ($domainId) {
            $query->whereHas('domain', function ($q) use ($domainId) {
                $q->where('id', $domainId);
            });
        }

        return $query->get();
    }

    /**
     * Analyze sender from PowerMTA data
     */
    private function analyzeSenderFromPowerMTA(Sender $sender): array
    {
        try {
            return $this->powerMtaService->analyzeSenderFromPowerMTA($sender);
        } catch (\Exception $e) {
            $this->logError("Failed to analyze sender from PowerMTA: {$sender->email}", [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Calculate reputation score based on sender data
     */
    private function calculateReputationScore(array $senderData): float
    {
        $deliveryRate = $senderData['delivery_rate'] ?? 0;
        $bounceRate = $senderData['bounce_rate'] ?? 0;
        $complaintRate = $senderData['complaint_rate'] ?? 0;

        // Base score from delivery rate
        $score = $deliveryRate;

        // Penalize for high bounce rate
        $score -= ($bounceRate * 2);

        // Penalize heavily for complaints
        $score -= ($complaintRate * 5);

        // Ensure score is between 0 and 100
        return max(0, min(100, $score));
    }

    /**
     * Get training statistics
     */
    public function getTrainingStatistics(?User $user = null): array
    {
        $query = Sender::with('domain')->where('is_active', true);
        
        if ($user) {
            $query->where('user_id', $user->id);
        }

        $senders = $query->get()->map(function ($sender) {
            return [
                'id' => $sender->id,
                'email' => $sender->email,
                'domain' => $sender->domain->name,
                'daily_limit' => $sender->daily_limit,
                'current_daily_sent' => $sender->current_daily_sent,
                'remaining_sends' => $sender->getRemainingDailySends(),
                'reputation_score' => $sender->reputation_score,
                'last_training_at' => $sender->last_training_at,
                'training_data' => $sender->training_data
            ];
        });

        return [
            'total_senders' => $senders->count(),
            'average_reputation' => $senders->avg('reputation_score'),
            'total_daily_limits' => $senders->sum('daily_limit'),
            'total_daily_sent' => $senders->sum('current_daily_sent'),
            'senders' => $senders
        ];
    }

    /**
     * Get training status
     */
    public function getTrainingStatus(): array
    {
        $lastTraining = Sender::whereNotNull('last_training_at')
            ->orderBy('last_training_at', 'desc')
            ->first();

        return [
            'last_training_run' => $lastTraining?->last_training_at,
            'next_scheduled_run' => now()->addDay()->setTime(2, 0), // 2 AM tomorrow
            'total_active_senders' => Sender::where('is_active', true)->count(),
            'senders_with_training_data' => Sender::whereNotNull('training_data')->count(),
            'average_reputation' => Sender::where('is_active', true)->avg('reputation_score'),
            'training_mode' => SystemConfig::get('TRAINING_DEFAULT_MODE', 'automatic'),
            'powermta_csv_path' => config('services.powermta.csv_path', '/var/log/powermta')
        ];
    }

    /**
     * Run training for specific user (admin function)
     */
    public function runTrainingForUser(User $user): array
    {
        return $this->runTraining($user);
    }

    /**
     * Run training for specific domain
     */
    public function runTrainingForDomain(string $domainId): array
    {
        return $this->runTraining(null, $domainId);
    }

    /**
     * Run system-wide training for all users
     */
    public function runSystemTraining(): array
    {
        return $this->runTraining();
    }
}
