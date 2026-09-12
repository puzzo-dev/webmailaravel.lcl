<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class UserLogin extends Notification implements ShouldQueue
{
    use Queueable;

    public $timeout = 30;
    public $tries = 2;
    public $backoff = [10];

    protected $loginData;

    public function __construct(array $loginData)
    {
        $this->loginData = $loginData;
    }

    public function via(object $notifiable): array
    {
        return [\App\Channels\TelegramChannel::class];
    }

    public function toTelegram(object $notifiable): array
    {
        $ip = $this->loginData['ip'] ?? 'Unknown';
        $device = $this->loginData['device'] ?? 'Unknown';
        $time = now()->format('Y-m-d H:i:s');
        return [
            'text' => "🔐 <b>Login Alert</b>\n\n" .
                     "A login to your account was detected.\n\n" .
                     "Device: <b>{$device}</b>\n" .
                     "IP: <code>{$ip}</code>\n" .
                     "Time: <b>{$time}</b>\n\n" .
                     "If this was not you, please secure your account immediately.",
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}
