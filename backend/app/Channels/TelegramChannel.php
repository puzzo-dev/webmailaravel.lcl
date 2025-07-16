<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramChannel
{

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
            $this->sendTelegramMessage($notifiable->telegram_chat_id, $message);
        }
    }

    /**
     * Send message to Telegram using Http facade
     */
    protected function sendTelegramMessage(string $chatId, array $messageData): bool
    {
        try {
            $botToken = config('services.telegram.bot_token');
            
            if (!$botToken) {
                Log::error('Telegram bot token not configured');
                return false;
            }

            $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
            
            $data = array_merge([
                'chat_id' => $chatId,
                'parse_mode' => 'HTML'
            ], $messageData);

            $response = Http::post($url, $data);

            if ($response->successful()) {
                Log::info('Telegram message sent successfully', [
                    'chat_id' => $chatId,
                    'message_id' => $response->json('result.message_id')
                ]);
                return true;
            } else {
                Log::error('Failed to send Telegram message', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return false;
            }

        } catch (\Exception $e) {
            Log::error('Telegram message error', ['error' => $e->getMessage()]);
            return false;
        }
    }
} 