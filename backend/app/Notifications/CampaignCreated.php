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
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Campaign Created Successfully')
            ->line("Your campaign '{$this->campaign->name}' has been created successfully.")
            ->line("Recipients: {$this->campaign->recipient_count}")
            ->line("Status: {$this->campaign->status}")
            ->action('View Campaign', url('/campaigns/' . $this->campaign->id))
            ->line('You can now review and start your campaign when ready.');
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
            'recipient_count' => $this->campaign->recipient_count,
            'status' => $this->campaign->status,
            'type' => 'campaign_created',
            'message' => "Campaign '{$this->campaign->name}' has been created successfully",
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
            'recipient_count' => $this->campaign->recipient_count,
            'status' => $this->campaign->status,
            'type' => 'campaign_created',
            'message' => "Campaign '{$this->campaign->name}' created successfully",
        ];
    }
}
