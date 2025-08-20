<?php

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CampaignCreated extends Notification implements ShouldQueue
{
    use Queueable;

    public $campaign;

    /**
     * Create a new notification instance.
     */
    public function __construct(Campaign $campaign)
    {
        $this->campaign = $campaign;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        $channels = ['database']; // Always store in database
        
        // Add email channel if user has email notifications enabled
        if ($notifiable->email_notifications_enabled) {
            $channels[] = 'mail';
        }
        
        // Add Telegram channel if user has Telegram notifications enabled and chat ID
        if ($notifiable->telegram_notifications_enabled && $notifiable->telegram_chat_id) {
            $channels[] = \App\Channels\TelegramChannel::class;
        }
        
        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Campaign Created Successfully')
            ->greeting('Hello!')
            ->line("Your campaign '{$this->campaign->name}' has been created successfully.")
            ->line('You can now review and schedule your campaign for sending.')
            ->action('View Campaign', url('/campaigns/' . $this->campaign->id))
            ->line('Thank you for using our email marketing platform!');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'campaign_id' => $this->campaign->id,
            'campaign_name' => $this->campaign->name,
            'status' => $this->campaign->status,
            'type' => 'campaign_created',
            'action_url' => '/campaigns/' . $this->campaign->id,
            'message' => "Campaign '{$this->campaign->name}' has been created successfully",
            'title' => 'Campaign Created',
            'notification_type' => 'success',
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $message = "🎉 <b>Campaign Created</b>\n\n";
        $message .= "📧 Campaign: <b>{$this->campaign->name}</b>\n";
        $message .= "📊 Status: {$this->campaign->status}\n";
        $message .= "📅 Created: " . $this->campaign->created_at->format('M j, Y H:i') . "\n";
        $message .= "\nYour campaign is ready for review and scheduling!";
        
        return [
            'text' => $message,
            'parse_mode' => 'HTML'
        ];
    }
}
