<?php

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CampaignStatusChanged extends Notification implements ShouldQueue
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
            ->subject('Campaign Status Changed')
            ->line("Your campaign '{$this->campaign->name}' status has changed to {$this->campaign->status}.")
            ->line("Total sent: {$this->campaign->total_sent}, Failed: {$this->campaign->total_failed}")
            ->action('View Campaign', url('/campaigns/' . $this->campaign->id))
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
            'campaign_id' => $this->campaign->id,
            'campaign_name' => $this->campaign->name,
            'status' => $this->campaign->status,
            'total_sent' => $this->campaign->total_sent,
            'total_failed' => $this->campaign->total_failed,
            'type' => 'campaign_status_changed',
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
            'status' => $this->campaign->status,
            'total_sent' => $this->campaign->total_sent,
            'total_failed' => $this->campaign->total_failed,
            'type' => 'campaign_status_changed',
            'message' => "Campaign '{$this->campaign->name}' status changed to {$this->campaign->status}",
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $status = ucfirst($this->campaign->status);
        $sent = $this->campaign->total_sent;
        $failed = $this->campaign->total_failed;
        
        return [
            'text' => "📧 <b>Campaign Status Update</b>\n\n" .
                     "Campaign: <b>{$this->campaign->name}</b>\n" .
                     "Status: <b>{$status}</b>\n" .
                     "Sent: <b>{$sent}</b>\n" .
                     "Failed: <b>{$failed}</b>\n\n" .
                     "View campaign: " . url('/campaigns/' . $this->campaign->id),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}
