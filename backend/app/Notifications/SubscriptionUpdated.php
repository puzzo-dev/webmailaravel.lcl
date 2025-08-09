<?php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SubscriptionUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    public $subscription;
    public $oldStatus;
    public $newStatus;
    public $context;

    /**
     * Create a new notification instance.
     */
    public function __construct(Subscription $subscription, ?string $oldStatus = null, ?string $newStatus = null, array $context = [])
    {
        $this->subscription = $subscription;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus ?? $subscription->status;
        $this->context = $context;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast', \App\Channels\TelegramChannel::class];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Subscription Updated')
            ->line("Your subscription to '{$this->subscription->plan->name}' has been updated.")
            ->line("Status: {$this->subscription->status}")
            ->line("Expires: " . ($this->subscription->expiry ? $this->subscription->expiry->format('Y-m-d') : 'Never'))
            ->action('View Subscription', url('/subscriptions'))
            ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        // Enhanced status messages with more detailed context
        $statusConfig = [
            'active' => [
                'message' => 'is now active and ready to use',
                'title' => 'Subscription Activated',
                'type' => 'success'
            ],
            'cancelled' => [
                'message' => 'has been cancelled',
                'title' => 'Subscription Cancelled',
                'type' => 'warning'
            ],
            'expired' => [
                'message' => 'has expired',
                'title' => 'Subscription Expired',
                'type' => 'error'
            ],
            'renewed' => [
                'message' => 'has been successfully renewed',
                'title' => 'Subscription Renewed',
                'type' => 'success'
            ],
            'suspended' => [
                'message' => 'has been suspended',
                'title' => 'Subscription Suspended',
                'type' => 'warning'
            ],
            'pending' => [
                'message' => 'is pending activation',
                'title' => 'Subscription Pending',
                'type' => 'info'
            ],
            'trial' => [
                'message' => 'trial period has started',
                'title' => 'Trial Started',
                'type' => 'info'
            ],
            'trial_expired' => [
                'message' => 'trial period has expired',
                'title' => 'Trial Expired',
                'type' => 'warning'
            ],
        ];

        $config = $statusConfig[$this->newStatus] ?? [
            'message' => "status has been updated to {$this->newStatus}",
            'title' => 'Subscription Updated',
            'type' => 'info'
        ];

        // Add specific context for certain statuses
        $additionalContext = '';
        if ($this->newStatus === 'expired' && $this->subscription->expiry) {
            $additionalContext = " Expired on: {$this->subscription->expiry->format('Y-m-d')}";
        } elseif ($this->newStatus === 'renewed' && isset($this->context['next_billing_date'])) {
            $additionalContext = " Next billing: {$this->context['next_billing_date']}";
        } elseif ($this->newStatus === 'cancelled' && isset($this->context['reason'])) {
            $additionalContext = " Reason: {$this->context['reason']}";
        } elseif ($this->newStatus === 'cancelled' && isset($this->context['access_until'])) {
            $additionalContext = " Access until: {$this->context['access_until']}";
        } elseif (in_array($this->newStatus, ['renewed', 'active']) && isset($this->context['amount'])) {
            $additionalContext = " Amount: \${$this->context['amount']}";
        }

        return [
            'title' => $config['title'],
            'message' => "Your subscription to '{$this->subscription->plan->name}' {$config['message']}.{$additionalContext}",
            'type' => 'subscription_updated',
            'notification_type' => $config['type'],
            'subscription_id' => $this->subscription->id,
            'plan_name' => $this->subscription->plan->name,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'expiry' => $this->subscription->expiry,
            'context' => $this->context,
            'status_changed_at' => now()->toISOString(),
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): array
    {
        return [
            'subscription_id' => $this->subscription->id,
            'plan_name' => $this->subscription->plan->name,
            'status' => $this->subscription->status,
            'expiry' => $this->subscription->expiry,
            'type' => 'subscription_updated',
            'message' => "Subscription to '{$this->subscription->plan->name}' updated to {$this->subscription->status}",
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $status = ucfirst($this->subscription->status);
        $planName = $this->subscription->plan->name;
        $expiry = $this->subscription->expiry ? $this->subscription->expiry->format('Y-m-d') : 'Never';
        
        return [
            'text' => "💳 <b>Subscription Update</b>\n\n" .
                     "Plan: <b>{$planName}</b>\n" .
                     "Status: <b>{$status}</b>\n" .
                     "Expires: <b>{$expiry}</b>\n\n" .
                     "View subscription: " . url('/subscriptions'),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}
