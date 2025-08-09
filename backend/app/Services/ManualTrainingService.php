<?php

namespace App\Services;

use App\Models\User;
use App\Models\Sender;
use App\Models\SystemConfig;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use Illuminate\Support\Facades\Log;

class ManualTrainingService
{
    use LoggingTrait, ValidationTrait;

    /**
     * Run manual training for a specific user (New System Requirements)
     */
    public function runManualTrainingForUser(User $user): array
    {
        $this->logInfo("Starting manual training for user: {$user->email}");

        // Check if system is in manual mode
        $systemMode = \App\Models\SystemConfig::get('TRAINING_DEFAULT_MODE', 'manual');
        if ($systemMode !== 'manual') {
            return [
                'success' => false,
                'message' => 'System is not in manual training mode',
                'senders_updated' => 0
            ];
        }

        // Get manual training settings from system config
        $startLimit = (int) \App\Models\SystemConfig::get('TRAINING_MANUAL_START_LIMIT', 50);
        $increasePercentage = (int) \App\Models\SystemConfig::get('TRAINING_MANUAL_INCREASE_PERCENTAGE', 10);
        $intervalDays = (int) \App\Models\SystemConfig::get('TRAINING_MANUAL_INCREASE_INTERVAL_DAYS', 2);
        $maxLimit = (int) \App\Models\SystemConfig::get('TRAINING_MANUAL_MAX_LIMIT', 500);

        $sendersUpdated = 0;
        $errors = [];

        // Get all active senders for this user
        $senders = $user->senders()->where('is_active', true)->get();

        foreach ($senders as $sender) {
            try {
                $daysSinceCreation = $sender->created_at->diffInDays(now());
                $trainingIntervals = floor($daysSinceCreation / $intervalDays);
                
                // Calculate new limit: start_limit * (1 + increase_percentage/100)^intervals
                $newLimit = $startLimit * pow(1 + ($increasePercentage / 100), $trainingIntervals);
                $newLimit = min($maxLimit, (int) $newLimit);

                $oldLimit = $sender->daily_limit;
                $newLimit = min(500, $oldLimit + $increase); // Cap at 500 per user/domain

                $sender->update([
                    'daily_limit' => $newLimit,
                    'last_training_at' => now(),
                    'training_data' => [
                        'type' => 'manual',
                        'old_limit' => $oldLimit,
                        'new_limit' => $newLimit,
                        'increase' => $increase,
                        'percentage' => $percentage,
                        'updated_at' => now()->toISOString()
                    ]
                ]);

                $sendersUpdated++;

                $this->logInfo("Manual training applied to sender", [
                    'sender_id' => $sender->id,
                    'sender_email' => $sender->email,
                    'old_limit' => $oldLimit,
                    'new_limit' => $newLimit,
                    'increase' => $increase,
                    'percentage' => $percentage
                ]);

            } catch (\Exception $e) {
                $error = "Failed to update sender {$sender->email}: " . $e->getMessage();
                $errors[] = $error;
                $this->logError($error, [
                    'sender_id' => $sender->id,
                    'user_id' => $user->id
                ]);
            }
        }

        // Update user's last manual training timestamp
        $user->updateManualTrainingTimestamp();

        $this->logInfo("Manual training completed for user: {$user->email}", [
            'senders_updated' => $sendersUpdated,
            'errors_count' => count($errors)
        ]);

        return [
            'success' => true,
            'message' => "Manual training completed successfully",
            'senders_updated' => $sendersUpdated,
            'errors' => $errors,
            'percentage_applied' => $percentage
        ];
    }

    /**
     * Run manual training for all users who have it enabled and due
     */
    public function runManualTrainingForAllUsers(): array
    {
        $this->logInfo('Starting manual training for all eligible users');

        $users = User::where('training_enabled', true)
                    ->where('training_mode', 'manual')
                    ->get();

        $totalUsersProcessed = 0;
        $totalSendersUpdated = 0;
        $allErrors = [];

        foreach ($users as $user) {
            if ($user->isManualTrainingDue()) {
                $result = $this->runManualTrainingForUser($user);
                
                if ($result['success']) {
                    $totalUsersProcessed++;
                    $totalSendersUpdated += $result['senders_updated'];
                }
                
                if (!empty($result['errors'])) {
                    $allErrors = array_merge($allErrors, $result['errors']);
                }
            }
        }

        $this->logInfo('Manual training completed for all users', [
            'users_processed' => $totalUsersProcessed,
            'senders_updated' => $totalSendersUpdated,
            'errors_count' => count($allErrors)
        ]);

        return [
            'success' => true,
            'users_processed' => $totalUsersProcessed,
            'senders_updated' => $totalSendersUpdated,
            'errors' => $allErrors
        ];
    }

    /**
     * Get manual training statistics for a user
     */
    public function getManualTrainingStats(User $user): array
    {
        $senders = $user->senders()->where('is_active', true)->get();
        
        $stats = [
            'training_enabled' => $user->hasTrainingEnabled(),
            'training_mode' => $user->training_mode,
            'manual_training_percentage' => $user->getManualTrainingPercentage(),
            'last_manual_training_at' => $user->last_manual_training_at,
            'is_training_due' => $user->isManualTrainingDue(),
            'total_senders' => $senders->count(),
            'total_current_limit' => $senders->sum('daily_limit'),
            'average_limit' => $senders->count() > 0 ? round($senders->avg('daily_limit'), 2) : 0,
            'min_limit' => $senders->count() > 0 ? $senders->min('daily_limit') : 0,
            'max_limit' => $senders->count() > 0 ? $senders->max('daily_limit') : 0,
        ];

        if ($user->hasTrainingEnabled() && $user->usesManualTraining()) {
            $nextIncrease = [];
            foreach ($senders as $sender) {
                $currentLimit = $sender->daily_limit;
                $increase = max(1, (int) ($currentLimit * ($user->getManualTrainingPercentage() / 100)));
                $newLimit = min(1000, $currentLimit + $increase);
                
                $nextIncrease[] = [
                    'sender_id' => $sender->id,
                    'sender_email' => $sender->email,
                    'current_limit' => $currentLimit,
                    'projected_increase' => $increase,
                    'projected_new_limit' => $newLimit
                ];
            }
            $stats['next_training_projection'] = $nextIncrease;
        }

        return $stats;
    }

    /**
     * Run system-wide manual training according to admin settings
     * 50 emails start, 10% increase every 2 days, cap at 500 emails
     */
    public function runSystemManualTraining(): array
    {
        $this->logInfo('Starting system-wide manual training');

        // Check if system is in manual training mode
        $trainingMode = SystemConfig::get('TRAINING_DEFAULT_MODE', 'automatic');
        if ($trainingMode !== 'manual') {
            return [
                'success' => false,
                'message' => 'System is not in manual training mode',
                'senders_updated' => 0
            ];
        }

        // Get manual training settings from system config
        $startLimit = (int) SystemConfig::get('TRAINING_MANUAL_START_LIMIT', 50);
        $increasePercentage = (int) SystemConfig::get('TRAINING_MANUAL_INCREASE_PERCENTAGE', 10);
        $intervalDays = (int) SystemConfig::get('TRAINING_MANUAL_INCREASE_INTERVAL_DAYS', 2);
        $maxLimit = (int) SystemConfig::get('TRAINING_MANUAL_MAX_LIMIT', 500);

        $sendersUpdated = 0;
        $errors = [];

        // Get all active senders in the system
        $senders = Sender::where('is_active', true)->get();

        foreach ($senders as $sender) {
            try {
                // Check if training interval has passed
                $lastTraining = $sender->last_training_at;
                if ($lastTraining && $lastTraining->addDays($intervalDays)->isFuture()) {
                    continue; // Not time for training yet
                }

                $oldLimit = $sender->daily_limit ?: 0;
                
                // If sender is new or has no limit, start with start limit
                if ($oldLimit == 0) {
                    $newLimit = $startLimit;
                } else {
                    // Calculate increase (10% every 2 days)
                    $increase = max(1, (int) ($oldLimit * ($increasePercentage / 100)));
                    $newLimit = min($maxLimit, $oldLimit + $increase);
                    
                    // Don't update if already at max limit
                    if ($oldLimit >= $maxLimit) {
                        continue;
                    }
                }

                // Update sender with new limit and training timestamp
                $sender->update([
                    'daily_limit' => $newLimit,
                    'last_training_at' => now(),
                    'training_data' => [
                        'previous_limit' => $oldLimit,
                        'new_limit' => $newLimit,
                        'increase_percentage' => $increasePercentage,
                        'training_type' => 'system_manual',
                        'trained_at' => now()->toISOString(),
                    ]
                ]);

                $sendersUpdated++;
                $this->logInfo("Updated sender {$sender->email}: {$oldLimit} -> {$newLimit}");

            } catch (\Exception $e) {
                $error = "Failed to update sender {$sender->email}: " . $e->getMessage();
                $errors[] = $error;
                $this->logError($error);
            }
        }

        $this->logInfo('System manual training completed', [
            'senders_updated' => $sendersUpdated,
            'errors_count' => count($errors),
            'settings' => [
                'start_limit' => $startLimit,
                'increase_percentage' => $increasePercentage,
                'interval_days' => $intervalDays,
                'max_limit' => $maxLimit
            ]
        ]);

        return [
            'success' => true,
            'message' => "System manual training completed",
            'senders_updated' => $sendersUpdated,
            'errors' => $errors,
            'settings' => [
                'start_limit' => $startLimit,
                'increase_percentage' => $increasePercentage,
                'interval_days' => $intervalDays,
                'max_limit' => $maxLimit
            ]
        ];
    }
}
