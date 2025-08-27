<?php

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class CampaignMilestone extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private Campaign $campaign,
        private int $milestone
    ) {}

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $percentage = $this->milestone;
        $campaignName = $this->campaign->name;
        $totalSent = $this->campaign->total_sent ?? 0;
        $recipientCount = $this->campaign->recipient_count ?? 0;

        return (new MailMessage)
            ->subject("Campaign Milestone Reached: {$percentage}% Complete")
            ->greeting("Hello {$notifiable->name}!")
            ->line("Your campaign '{$campaignName}' has reached a significant milestone.")
            ->line("**Progress:** {$percentage}% complete")
            ->line("**Emails Sent:** {$totalSent} of {$recipientCount}")
            ->line("**Campaign Status:** " . ucfirst($this->campaign->status))
            ->action('View Campaign Details', url("/campaigns/{$this->campaign->id}"))
            ->line('Keep up the great work with your email marketing!')
            ->salutation('Best regards, ' . config('app.name'));
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'campaign_milestone',
            'campaign_id' => $this->campaign->id,
            'campaign_name' => $this->campaign->name,
            'milestone' => $this->milestone,
            'total_sent' => $this->campaign->total_sent ?? 0,
            'recipient_count' => $this->campaign->recipient_count ?? 0,
            'status' => $this->campaign->status,
            'message' => "Campaign '{$this->campaign->name}' has reached {$this->milestone}% completion",
            'action_url' => "/campaigns/{$this->campaign->id}",
            'created_at' => now()->toISOString(),
        ];
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
