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

    public $campaign;
    public $oldStatus;
    public $newStatus;

    /**
     * Create a new notification instance.
     */
    public function __construct(Campaign $campaign, string $oldStatus, string $newStatus)
    {
        $this->campaign = $campaign;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Campaign Status Updated')
            ->greeting('Hello!')
            ->line("The status of your campaign '{$this->campaign->name}' has been updated.")
            ->line("Previous status: {$this->oldStatus}")
            ->line("New status: {$this->newStatus}")
            ->action('View Campaign', url('/campaigns/' . $this->campaign->id))
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

        // Add specific context for certain statuses
        $additionalContext = '';
        if ($this->newStatus === 'failed' && isset($this->campaign->error_message)) {
            $additionalContext = " Error: {$this->campaign->error_message}";
        } elseif ($this->newStatus === 'completed' && isset($this->campaign->total_sent)) {
            $additionalContext = " Total emails sent: {$this->campaign->total_sent}";
        } elseif ($this->newStatus === 'milestone' && isset($this->campaign->milestone_data)) {
            $additionalContext = " Milestone: {$this->campaign->milestone_data}";
        }

        return [
            'title' => $config['title'],
            'message' => "Your campaign '{$this->campaign->name}' {$config['message']}.{$additionalContext}",
            'type' => 'campaign_status_updated',
            'notification_type' => $config['type'],
            'campaign_id' => $this->campaign->id,
            'campaign_name' => $this->campaign->name,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'status_changed_at' => now()->toISOString(),
        ];
    }
}
