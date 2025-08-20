<?php

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CampaignCompleted extends Notification implements ShouldQueue
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
            ->subject('Campaign Completed Successfully')
            ->greeting('Hello!')
            ->line("Your campaign '{$this->campaign->name}' has been completed successfully!")
            ->line("Total emails sent: {$this->campaign->total_sent}")
            ->line("Total failed: {$this->campaign->total_failed}")
            ->line("Success rate: " . round(($this->campaign->total_sent / ($this->campaign->total_sent + $this->campaign->total_failed)) * 100, 2) . "%")
            ->action('View Campaign Details', url('/campaigns/' . $this->campaign->id))
            ->line('Thank you for using our email marketing platform!');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $successRate = 0;
        $totalEmails = $this->campaign->total_sent + $this->campaign->total_failed;
        if ($totalEmails > 0) {
            $successRate = round(($this->campaign->total_sent / $totalEmails) * 100, 2);
        }

        return [
            'campaign_id' => $this->campaign->id,
            'campaign_name' => $this->campaign->name,
            'status' => 'completed',
            'type' => 'campaign_completed',
            'action_url' => '/campaigns/' . $this->campaign->id,
            'message' => "Campaign '{$this->campaign->name}' has been completed successfully with {$this->campaign->total_sent} emails sent",
            'title' => 'Campaign Completed',
            'notification_type' => 'success',
            'timestamp' => now()->toISOString(),
            'stats' => [
                'total_sent' => $this->campaign->total_sent,
                'total_failed' => $this->campaign->total_failed,
                'success_rate' => $successRate
            ]
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $successRate = 0;
        $totalEmails = $this->campaign->total_sent + $this->campaign->total_failed;
        if ($totalEmails > 0) {
            $successRate = round(($this->campaign->total_sent / $totalEmails) * 100, 2);
        }

        $message = "🎉 <b>Campaign Completed!</b>\n\n";
        $message .= "📧 Campaign: <b>{$this->campaign->name}</b>\n";
        $message .= "✅ Status: Completed Successfully\n";
        $message .= "📊 Total sent: {$this->campaign->total_sent} emails\n";
        $message .= "❌ Total failed: {$this->campaign->total_failed} emails\n";
        $message .= "📈 Success rate: {$successRate}%\n";
        $message .= "\nView your campaign dashboard for detailed analytics.";
        
        return [
            'text' => $message,
            'parse_mode' => 'HTML'
        ];
    }
}
