<?php

namespace App\Services;

use App\Models\User;
use App\Models\Campaign;
use App\Models\Subscription;
use App\Notifications\UserLogin;
use App\Notifications\CampaignStatusUpdated;
use App\Notifications\SubscriptionUpdated;
use App\Notifications\SubscriptionExpiryReminder;
use App\Notifications\AccountDeactivated;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send login notification
     */
    public function sendLoginNotification(User $user, array $loginData): void
    {
        try {
            $user->notify(new UserLogin($loginData));
            Log::info('Login notification sent', [
                'user_id' => $user->id,
                'device' => $loginData['device'] ?? 'Unknown',
                'ip' => $loginData['ip'] ?? 'Unknown'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send login notification', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send campaign status update notification
     */
    public function sendCampaignStatusNotification(Campaign $campaign, string $oldStatus, string $newStatus): void
    {
        try {
            $campaign->user->notify(new CampaignStatusUpdated($campaign, $oldStatus, $newStatus));
            Log::info('Campaign status notification sent', [
                'campaign_id' => $campaign->id,
                'user_id' => $campaign->user_id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send campaign status notification', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send unified subscription status notification
     */
    public function sendSubscriptionStatusNotification(Subscription $subscription, string $oldStatus, string $newStatus, array $context = []): void
    {
        try {
            $subscription->user->notify(new SubscriptionUpdated($subscription, $oldStatus, $newStatus, $context));
            Log::info('Subscription status notification sent', [
                'subscription_id' => $subscription->id,
                'user_id' => $subscription->user_id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'context' => $context
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send subscription status notification', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send subscription expired notification (convenience method)
     */
    public function sendSubscriptionExpiredNotification(Subscription $subscription): void
    {
        $this->sendSubscriptionStatusNotification($subscription, 'active', 'expired');
    }

    /**
     * Send subscription cancelled notification (convenience method)
     */
    public function sendSubscriptionCancelledNotification(Subscription $subscription, string $reason = null): void
    {
        $context = $reason ? ['reason' => $reason] : [];
        $this->sendSubscriptionStatusNotification($subscription, 'active', 'cancelled', $context);
    }

    /**
     * Send subscription renewed notification (convenience method)
     */
    public function sendSubscriptionRenewedNotification(Subscription $subscription, float $paymentAmount = null): void
    {
        $context = $paymentAmount ? ['amount' => $paymentAmount] : [];
        $this->sendSubscriptionStatusNotification($subscription, 'expired', 'renewed', $context);
    }

    /**
     * Send account deactivated notification
     */
    public function sendAccountDeactivatedNotification(User $user, string $reason = null, $reactivationDate = null): void
    {
        try {
            $user->notify(new AccountDeactivated($reason, $reactivationDate));
            Log::info('Account deactivated notification sent', [
                'user_id' => $user->id,
                'reason' => $reason,
                'reactivation_date' => $reactivationDate
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send account deactivated notification', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send subscription expiry reminder notification
     */
    public function sendSubscriptionExpiryReminder(Subscription $subscription, string $reminderType): void
    {
        try {
            $subscription->user->notify(new SubscriptionExpiryReminder($subscription, $reminderType));
            Log::info('Subscription expiry reminder sent', [
                'subscription_id' => $subscription->id,
                'user_id' => $subscription->user_id,
                'reminder_type' => $reminderType
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send subscription expiry reminder', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Bulk send notifications to multiple users
     */
    public function sendBulkNotification(array $userIds, string $title, string $message, string $type = 'info'): array
    {
        $results = [
            'sent' => 0,
            'failed' => 0,
            'errors' => []
        ];

        $users = User::whereIn('id', $userIds)->get();

        foreach ($users as $user) {
            try {
                $user->notify(new \App\Notifications\AdminNotification($title, $message, $type));
                $results['sent']++;
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = "Failed to send to {$user->email}: " . $e->getMessage();
                Log::error('Failed to send bulk notification', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        Log::info('Bulk notification completed', [
            'total_users' => count($userIds),
            'sent' => $results['sent'],
            'failed' => $results['failed']
        ]);

        return $results;
    }
}
