<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

trait WebhookProcessor
{
    /**
     * Process BTCPay webhook
     */
    protected function processBTCPayWebhook(array $payload, string $signature): array
    {
        try {
            // Verify signature
            if (!$this->verifyBTCPaySignature($payload, $signature)) {
                Log::warning('BTCPay webhook invalid signature', [
                    'payload' => $payload,
                    'signature' => $signature,
                    'ip' => request()->ip()
                ]);
                
                return [
                    'success' => false,
                    'error' => 'Invalid signature'
                ];
            }

            // Process payment
            $result = $this->processBTCPayPayment($payload);
            
            Log::info('BTCPay webhook processed', [
                'invoice_id' => $payload['invoiceId'] ?? null,
                'status' => $payload['status'] ?? null,
                'result' => $result
            ]);

            return [
                'success' => true,
                'data' => $result
            ];

        } catch (\Exception $e) {
            Log::error('BTCPay webhook error', [
                'error' => $e->getMessage(),
                'payload' => $payload,
                'ip' => request()->ip()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process Telegram webhook
     */
    protected function processTelegramWebhook(array $payload): array
    {
        try {
            $result = $this->processTelegramMessage($payload);
            
            Log::info('Telegram webhook processed', [
                'chat_id' => $payload['message']['chat']['id'] ?? null,
                'user_id' => $payload['message']['from']['id'] ?? null,
                'text' => $payload['message']['text'] ?? null
            ]);

            return [
                'success' => true,
                'data' => $result
            ];

        } catch (\Exception $e) {
            Log::error('Telegram webhook error', [
                'error' => $e->getMessage(),
                'payload' => $payload,
                'ip' => request()->ip()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process campaign webhook
     */
    protected function processCampaignWebhook($campaign, string $event): array
    {
        try {
            $webhookUrl = config('services.campaign_webhook.url');
            
            if (!$webhookUrl) {
                return [
                    'success' => true,
                    'message' => 'No webhook URL configured'
                ];
            }

            $payload = [
                'event' => $event,
                'campaign_id' => $campaign->id,
                'campaign_name' => $campaign->name,
                'user_id' => $campaign->user_id,
                'timestamp' => now()->toISOString(),
                'data' => $campaign->toArray()
            ];

            $response = Http::timeout(10)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-Webhook-Signature' => $this->generateWebhookSignature($payload)
                ])
                ->post($webhookUrl, $payload);

            if ($response->successful()) {
                Log::info('Campaign webhook sent successfully', [
                    'campaign_id' => $campaign->id,
                    'event' => $event,
                    'status_code' => $response->status()
                ]);

                return [
                    'success' => true,
                    'status_code' => $response->status()
                ];
            } else {
                Log::error('Campaign webhook failed', [
                    'campaign_id' => $campaign->id,
                    'event' => $event,
                    'status_code' => $response->status(),
                    'response' => $response->body()
                ]);

                return [
                    'success' => false,
                    'error' => 'Webhook request failed',
                    'status_code' => $response->status()
                ];
            }

        } catch (\Exception $e) {
            Log::error('Campaign webhook exception', [
                'campaign_id' => $campaign->id,
                'event' => $event,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process delivery status webhook
     */
    protected function processDeliveryStatusWebhook(array $payload): array
    {
        try {
            $webhookUrl = config('services.delivery_webhook.url');
            
            if (!$webhookUrl) {
                return [
                    'success' => true,
                    'message' => 'No delivery webhook URL configured'
                ];
            }

            $response = Http::timeout(10)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-Webhook-Signature' => $this->generateWebhookSignature($payload)
                ])
                ->post($webhookUrl, $payload);

            if ($response->successful()) {
                Log::info('Delivery status webhook sent', [
                    'email_id' => $payload['email_id'] ?? null,
                    'status' => $payload['status'] ?? null,
                    'status_code' => $response->status()
                ]);

                return [
                    'success' => true,
                    'status_code' => $response->status()
                ];
            } else {
                Log::error('Delivery status webhook failed', [
                    'email_id' => $payload['email_id'] ?? null,
                    'status' => $payload['status'] ?? null,
                    'status_code' => $response->status(),
                    'response' => $response->body()
                ]);

                return [
                    'success' => false,
                    'error' => 'Webhook request failed',
                    'status_code' => $response->status()
                ];
            }

        } catch (\Exception $e) {
            Log::error('Delivery status webhook exception', [
                'payload' => $payload,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Generic webhook processor
     */
    protected function processGenericWebhook(string $type, array $payload, string $webhookUrl): array
    {
        try {
            $logData = [
                'type' => $type,
                'webhook_url' => $webhookUrl,
                'payload_size' => strlen(json_encode($payload))
            ];

            $response = Http::timeout(10)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-Webhook-Signature' => $this->generateWebhookSignature($payload)
                ])
                ->post($webhookUrl, $payload);

            if ($response->successful()) {
                Log::info("Webhook processed: {$type}", $logData);
                
                return [
                    'success' => true,
                    'status_code' => $response->status()
                ];
            } else {
                Log::error("Webhook failed: {$type}", array_merge($logData, [
                    'status_code' => $response->status(),
                    'response' => $response->body()
                ]));

                return [
                    'success' => false,
                    'error' => 'Webhook request failed',
                    'status_code' => $response->status()
                ];
            }

        } catch (\Exception $e) {
            Log::error("Webhook exception: {$type}", [
                'type' => $type,
                'webhook_url' => $webhookUrl,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Verify BTCPay signature
     */
    protected function verifyBTCPaySignature(array $payload, string $signature): bool
    {
        $secret = config('services.btcpay.webhook_secret');
        
        if (!$secret) {
            return false;
        }

        $expectedSignature = hash_hmac('sha256', json_encode($payload), $secret);
        
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Process BTCPay payment
     */
    protected function processBTCPayPayment(array $payload): array
    {
        // Implementation depends on your BTCPay integration
        // This is a placeholder for the actual payment processing logic
        return [
            'invoice_id' => $payload['invoiceId'] ?? null,
            'status' => $payload['status'] ?? null,
            'amount' => $payload['amount'] ?? null,
            'currency' => $payload['currency'] ?? null
        ];
    }

    /**
     * Process Telegram message
     */
    protected function processTelegramMessage(array $payload): array
    {
        // Implementation depends on your Telegram bot integration
        // This is a placeholder for the actual message processing logic
        return [
            'chat_id' => $payload['message']['chat']['id'] ?? null,
            'user_id' => $payload['message']['from']['id'] ?? null,
            'text' => $payload['message']['text'] ?? null,
            'processed' => true
        ];
    }

    /**
     * Generate webhook signature
     */
    protected function generateWebhookSignature(array $payload): string
    {
        $secret = config('services.webhook.secret', 'default-secret');
        return hash_hmac('sha256', json_encode($payload), $secret);
    }

    /**
     * Cache webhook data
     */
    protected function cacheWebhookData(string $key, array $data, int $ttl = 3600): void
    {
        Cache::put("webhook:{$key}", $data, $ttl);
    }

    /**
     * Get cached webhook data
     */
    protected function getCachedWebhookData(string $key): ?array
    {
        return Cache::get("webhook:{$key}");
    }

    /**
     * Generate unique webhook ID
     */
    protected function generateWebhookId(): string
    {
        return Str::uuid()->toString();
    }
} 