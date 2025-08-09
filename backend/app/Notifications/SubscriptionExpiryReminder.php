<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Subscription;

class SubscriptionExpiryReminder extends Notification implements ShouldQueue
{
    use Queueable;

    private Subscription $subscription;
    private string $reminderType;

    public function __construct(Subscription $subscription, string $reminderType = '7_days')
    {
        $this->subscription = $subscription;
        $this->reminderType = $reminderType;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $daysUntilExpiry = $this->getDaysUntilExpiry();
        $urgencyText = $this->getUrgencyText();
        $planName = $this->subscription->plan->name ?? $this->subscription->plan_name;

        return (new MailMessage)
            ->subject("Subscription Renewal Reminder - {$planName}")
            ->greeting("Hi {$notifiable->name},")
            ->line($urgencyText)
            ->line("Your **{$planName}** subscription will expire on **{$this->subscription->expiry->format('F j, Y')}**.")
            ->line("To continue enjoying uninterrupted access to all features, please renew your subscription before it expires.")
            ->action('Renew Subscription', url('/billing'))
            ->line('If you have any questions or need assistance, please don\'t hesitate to contact our support team.')
            ->line('Thank you for being a valued customer!')
            ->salutation('Best regards, The Team');
    }

    private function getDaysUntilExpiry(): int
    {
        return now()->diffInDays($this->subscription->expiry, false);
    }

    private function getUrgencyText(): string
    {
        $days = $this->getDaysUntilExpiry();
        
        return match ($this->reminderType) {
            '7_days' => "This is a friendly reminder that your subscription will expire in {$days} days.",
            '3_days' => "⚠️ **Important:** Your subscription will expire in {$days} days.",
            '1_day' => "🚨 **Urgent:** Your subscription will expire tomorrow!",
            default => "Your subscription will expire in {$days} days."
        };
    }

    public function toArray($notifiable)
    {
        return [
            'subscription_id' => $this->subscription->id,
            'reminder_type' => $this->reminderType,
            'expires_at' => $this->subscription->expiry,
            'plan_name' => $this->subscription->plan->name ?? $this->subscription->plan_name,
        ];
    }
}
