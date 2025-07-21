<?php

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CampaignMilestone extends Notification implements ShouldQueue
{
    use Queueable;

    public $campaign;
    public $milestone;
    public $percentage;

    /**
     * Create a new notification instance.
     */
    public function __construct(Campaign $campaign, int $percentage)
    {
        $this->campaign = $campaign;
        $this->percentage = $percentage;
        $this->milestone = $this->determineMilestone($percentage);
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // Only send database and broadcast for milestones to avoid spam
        return ['database', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Campaign Progress: {$this->percentage}% Complete")
            ->line("Your campaign '{$this->campaign->name}' has reached {$this->percentage}% completion.")
            ->line("Progress: {$this->campaign->total_sent} of {$this->campaign->recipient_count} emails sent")
            ->line("Current statistics:")
            ->line("• Opens: {$this->campaign->opens}")
            ->line("• Clicks: {$this->campaign->clicks}")
            ->line("• Failed: {$this->campaign->total_failed}")
            ->action('View Campaign', url('/campaigns/' . $this->campaign->id))
            ->line('Keep monitoring your campaign progress!');
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
            'milestone' => $this->milestone,
            'percentage' => $this->percentage,
            'total_sent' => $this->campaign->total_sent,
            'recipient_count' => $this->campaign->recipient_count,
            'opens' => $this->campaign->opens,
            'clicks' => $this->campaign->clicks,
            'type' => 'campaign_milestone',
            'message' => "Campaign '{$this->campaign->name}' reached {$this->percentage}% completion",
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
            'milestone' => $this->milestone,
            'percentage' => $this->percentage,
            'total_sent' => $this->campaign->total_sent,
            'recipient_count' => $this->campaign->recipient_count,
            'opens' => $this->campaign->opens,
            'clicks' => $this->campaign->clicks,
            'type' => 'campaign_milestone',
            'message' => "Campaign reached {$this->percentage}% completion",
        ];
    }

    /**
     * Determine milestone emoji and label
     */
    private function determineMilestone(int $percentage): array
    {
        return match($percentage) {
            25 => ['emoji' => '🎯', 'label' => 'Quarter Complete'],
            50 => ['emoji' => '⚡', 'label' => 'Halfway There'],
            75 => ['emoji' => '🚀', 'label' => 'Almost Done'],
            90 => ['emoji' => '🏁', 'label' => 'Final Stretch'],
            default => ['emoji' => '📊', 'label' => 'Progress Update']
        };
    }
}
