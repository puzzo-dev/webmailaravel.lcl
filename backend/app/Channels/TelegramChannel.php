<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use App\Services\TelegramService;

class TelegramChannel
{
    protected $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    /**
     * Send the given notification.
     */
    public function send($notifiable, Notification $notification): void
    {
        if (method_exists($notification, 'toTelegram')) {
            $message = $notification->toTelegram($notifiable);
        } else {
            $message = $notification->toArray($notifiable);
        }

        if ($notifiable->telegram_notifications_enabled && $notifiable->telegram_chat_id) {
            $this->telegramService->sendMessage($notifiable->telegram_chat_id, $message);
        }
    }
} 