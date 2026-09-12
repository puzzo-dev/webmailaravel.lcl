<?php

namespace App\Notifications;

use App\Models\Campaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CampaignCreated extends Notification implements ShouldQueue
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
            'text' => "📧 <b>Campaign Created</b>\n\n" .
                     "Name: <b>{$c->name}</b>\n" .
                     "Status: <b>{$c->status}</b>\n\n" .
                     "View: " . url('/campaigns/' . $c->id),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}
