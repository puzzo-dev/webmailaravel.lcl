<?php

namespace App\Services;

use App\Traits\HttpClientTrait;
use App\Traits\LoggingTrait;

class TelegramService
{
    use HttpClientTrait, LoggingTrait;

    private string $botToken;

    public function __construct()
    {
        $this->botToken = config('services.telegram.bot_token') ?? '';
    }

    /**
     * Send message to Telegram chat
     */
    public function sendMessage(string $chatId, array $messageData): bool
    {
        try {
            if (!$this->botToken) {
                $this->logError('Telegram bot token not configured');
                return false;
            }

            $url = "https://api.telegram.org/bot{$this->botToken}/sendMessage";
            
            $data = array_merge([
                'chat_id' => $chatId,
                'parse_mode' => 'HTML'
            ], $messageData);

            $result = $this->post($url, $data);

            if ($result['success']) {
                $this->logInfo('Telegram message sent successfully', [
                    'chat_id' => $chatId,
                    'message_id' => $result['data']['result']['message_id'] ?? null
                ]);
                return true;
            } else {
                $this->logError('Failed to send Telegram message', $result);
                return false;
            }

        } catch (\Exception $e) {
            $this->logError('Telegram message error', ['error' => $e->getMessage()]);
            return false;
        }
    }
} 