<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Subscription;
use App\Models\User;
use App\Notifications\SubscriptionExpiryReminder;
use Carbon\Carbon;

class SendRenewalReminders extends Command
{
    protected $signature = 'billing:send-renewal-reminders';
    protected $description = 'Send renewal reminders to users with expiring subscriptions';

    public function handle()
    {
        $this->info('Checking for subscriptions requiring renewal reminders...');

        // Get subscriptions expiring in 7 days
        $subscriptionsExpiringSoon = Subscription::where('status', 'active')
            ->whereBetween('expiry', [
                now()->addDays(6),
                now()->addDays(8)
            ])
            ->with('user', 'plan')
            ->get();

        // Get subscriptions expiring in 3 days
        $subscriptionsExpiringVerySoon = Subscription::where('status', 'active')
            ->whereBetween('expiry', [
                now()->addDays(2),
                now()->addDays(4)
            ])
            ->with('user', 'plan')
            ->get();

        // Get subscriptions expiring tomorrow
        $subscriptionsExpiringTomorrow = Subscription::where('status', 'active')
            ->whereBetween('expiry', [
                now()->addDay()->startOfDay(),
                now()->addDay()->endOfDay()
            ])
            ->with('user', 'plan')
            ->get();

        $remindersSent = 0;

        // Send 7-day reminders
        foreach ($subscriptionsExpiringSoon as $subscription) {
            if ($this->shouldSendReminder($subscription, '7_days')) {
                $subscription->user->notify(new SubscriptionExpiryReminder($subscription, '7_days'));
                $this->markReminderSent($subscription, '7_days');
                $remindersSent++;
                $this->info("Sent 7-day reminder to {$subscription->user->email}");
            }
        }

        // Send 3-day reminders
        foreach ($subscriptionsExpiringVerysSoon as $subscription) {
            if ($this->shouldSendReminder($subscription, '3_days')) {
                $subscription->user->notify(new SubscriptionExpiryReminder($subscription, '3_days'));
                $this->markReminderSent($subscription, '3_days');
                $remindersSent++;
                $this->info("Sent 3-day reminder to {$subscription->user->email}");
            }
        }

        // Send 1-day reminders
        foreach ($subscriptionsExpiringTomorrow as $subscription) {
            if ($this->shouldSendReminder($subscription, '1_day')) {
                $subscription->user->notify(new SubscriptionExpiryReminder($subscription, '1_day'));
                $this->markReminderSent($subscription, '1_day');
                $remindersSent++;
                $this->info("Sent 1-day reminder to {$subscription->user->email}");
            }
        }

        $this->info("Sent {$remindersSent} renewal reminders");
        return 0;
    }

    private function shouldSendReminder(Subscription $subscription, string $type): bool
    {
        $reminderData = json_decode($subscription->reminder_data ?? '{}', true);
        return !isset($reminderData[$type]);
    }

    private function markReminderSent(Subscription $subscription, string $type): void
    {
        $reminderData = json_decode($subscription->reminder_data ?? '{}', true);
        $reminderData[$type] = now()->toISOString();
        
        $subscription->update([
            'reminder_data' => json_encode($reminderData)
        ]);
    }
}
