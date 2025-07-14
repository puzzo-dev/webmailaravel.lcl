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

    /**
     * Create a new notification instance.
     */
    public function __construct(Subscription $subscription)
    {
        $this->subscription = $subscription;
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
        return [
            'subscription_id' => $this->subscription->id,
            'plan_name' => $this->subscription->plan->name,
            'status' => $this->subscription->status,
            'expiry' => $this->subscription->expiry,
            'type' => 'subscription_updated',
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
