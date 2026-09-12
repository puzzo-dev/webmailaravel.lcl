<?php

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CampaignMilestone extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private Campaign $campaign,
        private int $milestone
    ) {}

    public function via(object $notifiable): array
    {
        return [\App\Channels\TelegramChannel::class];
    }

    public function toTelegram(object $notifiable): array
    {
        return [
            'text' => "🎉 <b>Campaign Milestone</b>\n\n" .
                     "Campaign: <b>{$this->campaign->name}</b>\n" .
                     "Milestone: <b>{$this->milestone}</b>\n\n" .
                     "View: " . url('/campaigns/' . $this->campaign->id),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}
