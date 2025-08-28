<?php

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CampaignStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    public $campaignId;
    public $campaignName;
    public $oldStatus;
    public $newStatus;

    /**
     * Create a new notification instance.
     */
    public function __construct(Campaign $campaign, string $oldStatus, string $newStatus)
    {
        $this->campaignId = $campaign->id;
        $this->campaignName = $campaign->name;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
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
            ->subject('Campaign Status Updated')
            ->greeting('Hello!')
            ->line("The status of your campaign '{$this->campaignName}' has been updated.")
            ->line("Previous status: {$this->oldStatus}")
            ->line("New status: {$this->newStatus}")
            ->action('View Campaign', url('/campaigns/' . $this->campaignId))
            ->line('Thank you for using our email marketing platform!');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        // Enhanced status messages with more detailed context
        $statusConfig = [
            'draft' => [
                'message' => 'saved as draft',
                'title' => 'Campaign Saved',
                'type' => 'info'
            ],
            'scheduled' => [
                'message' => 'scheduled for sending',
                'title' => 'Campaign Scheduled',
                'type' => 'info'
            ],
            'sending' => [
                'message' => 'is currently being sent',
                'title' => 'Campaign Sending',
                'type' => 'info'
            ],
            'sent' => [
                'message' => 'has been successfully completed',
                'title' => 'Campaign Completed',
                'type' => 'success'
            ],
            'completed' => [
                'message' => 'has been successfully completed',
                'title' => 'Campaign Completed',
                'type' => 'success'
            ],
            'paused' => [
                'message' => 'has been paused',
                'title' => 'Campaign Paused',
                'type' => 'warning'
            ],
            'cancelled' => [
                'message' => 'has been cancelled',
                'title' => 'Campaign Cancelled',
                'type' => 'warning'
            ],
            'failed' => [
                'message' => 'failed to send due to an error',
                'title' => 'Campaign Failed',
                'type' => 'error'
            ],
            'created' => [
                'message' => 'has been created and is ready for review',
                'title' => 'Campaign Created',
                'type' => 'success'
            ],
            'milestone' => [
                'message' => 'has reached an important milestone',
                'title' => 'Campaign Milestone',
                'type' => 'info'
            ],
        ];

        $config = $statusConfig[$this->newStatus] ?? [
            'message' => "status changed to {$this->newStatus}",
            'title' => 'Campaign Status Updated',
            'type' => 'info'
        ];

        // Add specific context for certain statuses (removed campaign model references)
        $additionalContext = '';
        
        return [
            'campaign_id' => $this->campaignId,
            'campaign_name' => $this->campaignName,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'type' => 'campaign_status',
            'action_url' => '/campaigns/' . $this->campaignId,
            'message' => "Campaign '{$this->campaignName}' {$config['message']}{$additionalContext}",
            'title' => $config['title'],
            'notification_type' => $config['type'],
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $statusConfig = [
            'draft' => ['title' => 'Campaign Saved'],
            'scheduled' => ['title' => 'Campaign Scheduled'],
            'sending' => ['title' => 'Campaign Sending'],
            'sent' => ['title' => 'Campaign Completed'],
            'completed' => ['title' => 'Campaign Completed'],
            'paused' => ['title' => 'Campaign Paused'],
            'cancelled' => ['title' => 'Campaign Cancelled'],
            'failed' => ['title' => 'Campaign Failed'],
        ];
        
        $config = $statusConfig[$this->newStatus] ?? ['title' => 'Campaign Status Updated'];
        
        $message = "🔔 <b>{$config['title']}</b>\n\n";
        $message .= "📧 Campaign: <b>{$this->campaignName}</b>\n";
        $message .= "📊 Status: {$this->oldStatus} → {$this->newStatus}\n";
        
        $message .= "\nView your campaign dashboard for more details.";
        
        return [
            'text' => $message,
            'parse_mode' => 'HTML'
        ];
    }
}
