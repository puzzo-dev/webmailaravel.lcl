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
        $openRate = $this->campaign->open_rate ? number_format($this->campaign->open_rate, 2) . '%' : 'N/A';
        $clickRate = $this->campaign->click_rate ? number_format($this->campaign->click_rate, 2) . '%' : 'N/A';

        return (new MailMessage)
            ->subject('Campaign Completed Successfully')
            ->line("Your campaign '{$this->campaign->name}' has been completed successfully!")
            ->line("📊 Campaign Results:")
            ->line("• Total Sent: {$this->campaign->total_sent}")
            ->line("• Total Failed: {$this->campaign->total_failed}")
            ->line("• Opens: {$this->campaign->opens}")
            ->line("• Clicks: {$this->campaign->clicks}")
            ->line("• Open Rate: {$openRate}")
            ->line("• Click Rate: {$clickRate}")
            ->action('View Campaign Details', url('/campaigns/' . $this->campaign->id))
            ->line('Thank you for using our email marketing platform!');
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
            'total_sent' => $this->campaign->total_sent,
            'total_failed' => $this->campaign->total_failed,
            'opens' => $this->campaign->opens,
            'clicks' => $this->campaign->clicks,
            'open_rate' => $this->campaign->open_rate,
            'click_rate' => $this->campaign->click_rate,
            'type' => 'campaign_completed',
            'message' => "Campaign '{$this->campaign->name}' completed successfully",
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
            'total_sent' => $this->campaign->total_sent,
            'total_failed' => $this->campaign->total_failed,
            'opens' => $this->campaign->opens,
            'clicks' => $this->campaign->clicks,
            'open_rate' => $this->campaign->open_rate,
            'click_rate' => $this->campaign->click_rate,
            'type' => 'campaign_completed',
            'message' => "Campaign '{$this->campaign->name}' completed with {$this->campaign->total_sent} emails sent",
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $sent = $this->campaign->total_sent;
        $failed = $this->campaign->total_failed;
        $opens = $this->campaign->opens;
        $clicks = $this->campaign->clicks;
        $openRate = $this->campaign->open_rate ? number_format($this->campaign->open_rate, 2) . '%' : 'N/A';
        $clickRate = $this->campaign->click_rate ? number_format($this->campaign->click_rate, 2) . '%' : 'N/A';
        
        return [
            'text' => "🎉 <b>Campaign Completed!</b>\n\n" .
                     "Campaign: <b>{$this->campaign->name}</b>\n\n" .
                     "📊 <b>Results:</b>\n" .
                     "✅ Sent: <b>{$sent}</b>\n" .
                     "❌ Failed: <b>{$failed}</b>\n" .
                     "👀 Opens: <b>{$opens}</b>\n" .
                     "🔗 Clicks: <b>{$clicks}</b>\n" .
                     "📈 Open Rate: <b>{$openRate}</b>\n" .
                     "📈 Click Rate: <b>{$clickRate}</b>\n\n" .
                     "View details: " . url('/campaigns/' . $this->campaign->id),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}
