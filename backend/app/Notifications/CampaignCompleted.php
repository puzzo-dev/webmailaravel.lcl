<?php

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CampaignCompleted extends Notification implements ShouldQueue
{
    use Queueable;

    public $campaign;

    public function __construct(Campaign $campaign)
    {
        $this->campaign = $campaign;
    }

    public function via(object $notifiable): array
    {
        return [\App\Channels\TelegramChannel::class];
    }

    public function toTelegram(object $notifiable): array
    {
        $c = $this->campaign;
        return [
            'text' => "✅ <b>Campaign Completed</b>\n\n" .
                     "Name: <b>{$c->name}</b>\n" .
                     "Total Sent: <b>{$c->total_sent}</b>\n" .
                     "Opens: <b>{$c->total_opens}</b>\n" .
                     "Clicks: <b>{$c->total_clicks}</b>\n\n" .
                     "View: " . url('/campaigns/' . $c->id),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}
