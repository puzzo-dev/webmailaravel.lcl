<?php

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class HighBounceRateAlert extends Notification implements ShouldQueue
{
    use Queueable;

    public $campaign;
    public $bounceRate;
    public $threshold;

    /**
     * Create a new notification instance.
     */
    public function __construct(Campaign $campaign, float $bounceRate, float $threshold = 10.0)
    {
        $this->campaign = $campaign;
        $this->bounceRate = $bounceRate;
        $this->threshold = $threshold;
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
            ->subject('High Bounce Rate Alert - Action Required')
            ->error()
            ->line("Your campaign '{$this->campaign->name}' has a high bounce rate that requires attention.")
            ->line("Current bounce rate: " . number_format($this->bounceRate, 2) . "%")
            ->line("Alert threshold: " . number_format($this->threshold, 2) . "%")
            ->line("Campaign statistics:")
            ->line("• Total Sent: {$this->campaign->total_sent}")
            ->line("• Bounces: {$this->campaign->bounces}")
            ->line("• Failed: {$this->campaign->total_failed}")
            ->line("High bounce rates can affect your sender reputation and deliverability.")
            ->action('Review Campaign', url('/campaigns/' . $this->campaign->id))
            ->line('Consider pausing the campaign and reviewing your email list quality.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'High Bounce Rate Alert',
            'message' => "Your campaign '{$this->campaign->name}' has a high bounce rate of {$this->bounceRate}% (threshold: {$this->threshold}%). Please review your email list quality.",
            'type' => 'high_bounce_rate_alert',
            'campaign_id' => $this->campaign->id,
            'campaign_name' => $this->campaign->name,
            'bounce_rate' => $this->bounceRate,
            'threshold' => $this->threshold,
            'bounces' => $this->campaign->bounces,
            'total_sent' => $this->campaign->total_sent,
            'priority' => 'high',
            'alert_triggered_at' => now()->toISOString(),
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
            'bounce_rate' => $this->bounceRate,
            'threshold' => $this->threshold,
            'bounces' => $this->campaign->bounces,
            'total_sent' => $this->campaign->total_sent,
            'type' => 'high_bounce_rate_alert',
            'priority' => 'high',
            'message' => "High bounce rate detected: {$this->bounceRate}%",
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $bounceRate = number_format($this->bounceRate, 2);
        $threshold = number_format($this->threshold, 2);
        
        return [
            'text' => "⚠️ <b>High Bounce Rate Alert!</b>\n\n" .
                     "Campaign: <b>{$this->campaign->name}</b>\n" .
                     "Bounce Rate: <b>{$bounceRate}%</b> (threshold: {$threshold}%)\n\n" .
                     "📊 <b>Statistics:</b>\n" .
                     "📧 Sent: <b>{$this->campaign->total_sent}</b>\n" .
                     "⚠️ Bounces: <b>{$this->campaign->bounces}</b>\n" .
                     "❌ Failed: <b>{$this->campaign->total_failed}</b>\n\n" .
                     "🚨 This may affect your sender reputation!\n" .
                     "Review campaign: " . url('/campaigns/' . $this->campaign->id),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}
