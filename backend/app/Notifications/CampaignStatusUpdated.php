<?php

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CampaignStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    public $campaignId;
    public $campaignName;
    public $oldStatus;
    public $newStatus;

    public function __construct(Campaign $campaign, string $oldStatus, string $newStatus)
    {
        $this->campaignId = $campaign->id;
        $this->campaignName = $campaign->name;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
    }

    public function via(object $notifiable): array
    {
        return [\App\Channels\TelegramChannel::class];
    }

    public function toTelegram(object $notifiable): array
    {
        return [
            'text' => "📝 <b>Campaign Status Updated</b>\n\n" .
                     "Campaign: <b>{$this->campaignName}</b>\n" .
                     "Status: <b>{$this->oldStatus}</b> → <b>{$this->newStatus}</b>\n\n" .
                     "View: " . url('/campaigns/' . $this->campaignId),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}
