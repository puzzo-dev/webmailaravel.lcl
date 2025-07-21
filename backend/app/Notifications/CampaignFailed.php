<?php

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CampaignFailed extends Notification implements ShouldQueue
{
    use Queueable;

    public $campaign;
    public $errorMessage;

    /**
     * Create a new notification instance.
     */
    public function __construct(Campaign $campaign, string $errorMessage = null)
    {
        $this->campaign = $campaign;
        $this->errorMessage = $errorMessage ?: 'Unknown error occurred';
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
            ->subject('Campaign Failed - Action Required')
            ->error()
            ->line("Your campaign '{$this->campaign->name}' has failed to complete.")
            ->line("Error: {$this->errorMessage}")
            ->line("Statistics before failure:")
            ->line("• Total Sent: {$this->campaign->total_sent}")
            ->line("• Total Failed: {$this->campaign->total_failed}")
            ->action('Review Campaign', url('/campaigns/' . $this->campaign->id))
            ->line('Please review the campaign settings and try again, or contact support if the issue persists.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'campaign_id' => $this->campaign->id,
            'campaign_name' => $this->campaign->name,
            'error_message' => $this->errorMessage,
            'total_sent' => $this->campaign->total_sent,
            'total_failed' => $this->campaign->total_failed,
            'type' => 'campaign_failed',
            'priority' => 'high',
            'message' => "Campaign '{$this->campaign->name}' failed: {$this->errorMessage}",
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): array
    {
        return [
            'campaign_id' => $this->campaign->id,
            'campaign_name' => $this->campaign->name,
            'error_message' => $this->errorMessage,
            'total_sent' => $this->campaign->total_sent,
            'total_failed' => $this->campaign->total_failed,
            'type' => 'campaign_failed',
            'priority' => 'high',
            'message' => "Campaign '{$this->campaign->name}' failed",
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $sent = $this->campaign->total_sent;
        $failed = $this->campaign->total_failed;
        
        return [
            'text' => "🚨 <b>Campaign Failed!</b>\n\n" .
                     "Campaign: <b>{$this->campaign->name}</b>\n" .
                     "Error: <code>{$this->errorMessage}</code>\n\n" .
                     "📊 <b>Progress before failure:</b>\n" .
                     "✅ Sent: <b>{$sent}</b>\n" .
                     "❌ Failed: <b>{$failed}</b>\n\n" .
                     "⚠️ Please review and take action: " . url('/campaigns/' . $this->campaign->id),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}
