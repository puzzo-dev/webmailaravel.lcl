<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\User;
use App\Models\Plan;
use App\Traits\HttpClientTrait;
use App\Traits\LoggingTrait;
use App\Traits\CacheServiceTrait;
use Carbon\Carbon;
use Exception;

class BTCPayService
{
    use HttpClientTrait, LoggingTrait, CacheServiceTrait;

    protected $baseUrl;
    protected $apiKey;
    protected $storeId;
    protected $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.btcpay.base_url');
        $this->apiKey = config('services.btcpay.api_key');
        $this->storeId = config('services.btcpay.store_id');
        $this->timeout = config('services.btcpay.timeout', 30);
    }

    /**
     * Create a new invoice using Laravel's HTTP client
     */
    public function createInvoice(array $data): array
    {
        $this->logMethodEntry(__METHOD__, $data);

        try {
            $url = "{$this->baseUrl}/api/v1/stores/{$this->storeId}/invoices";
            
            $headers = $this->withApiKey($this->apiKey);
            
            $result = $this->post($url, $data, $headers, $this->timeout);

            if ($result['success']) {
                $this->logInfo('BTCPay invoice created successfully', [
                    'invoice_id' => $result['data']['id'] ?? null
                ]);
            } else {
                $this->logError('Failed to create BTCPay invoice', $result);
            }

            $this->logMethodExit(__METHOD__, $result);
            return $result;

        } catch (Exception $e) {
            $this->logError('BTCPay invoice creation error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get invoice details using Laravel's HTTP client
     */
    public function getInvoice(string $invoiceId): array
    {
        $this->logMethodEntry(__METHOD__, ['invoice_id' => $invoiceId]);

        try {
            $url = "{$this->baseUrl}/api/v1/stores/{$this->storeId}/invoices/{$invoiceId}";
            
            $headers = $this->withApiKey($this->apiKey);
            
            $result = $this->get($url, $headers, $this->timeout);

            if ($result['success']) {
                $this->logInfo('BTCPay invoice retrieved successfully', [
                    'invoice_id' => $invoiceId
                ]);
            } else {
                $this->logError('Failed to retrieve BTCPay invoice', $result);
            }

            $this->logMethodExit(__METHOD__, $result);
            return $result;

        } catch (Exception $e) {
            $this->logError('BTCPay invoice retrieval error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process webhook using Laravel's HTTP client
     */
    public function processWebhook(array $payload, string $signature): array
    {
        $this->logMethodEntry(__METHOD__, ['payload' => $payload]);

        try {
            // Verify signature
            if (!$this->verifySignature($payload, $signature)) {
                $this->logWarning('BTCPay webhook invalid signature', [
                    'signature' => $signature
                ]);
                
                return [
                    'success' => false,
                    'error' => 'Invalid signature'
                ];
            }

            // Process payment
            $result = $this->processPayment($payload);
            
            $this->logInfo('BTCPay webhook processed', [
                'invoice_id' => $payload['invoiceId'] ?? null,
                'result' => $result
            ]);

            $this->logMethodExit(__METHOD__, $result);
            return $result;

        } catch (Exception $e) {
            $this->logError('BTCPay webhook processing error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Create subscription invoice using Laravel's HTTP client
     */
    public function createSubscriptionInvoice(Subscription $subscription): array
    {
        $this->logMethodEntry(__METHOD__, ['subscription_id' => $subscription->id]);

        try {
            $data = [
                'amount' => $subscription->amount,
                'currency' => $subscription->currency,
                'metadata' => [
                    'subscription_id' => $subscription->id,
                    'user_id' => $subscription->user_id,
                    'plan_id' => $subscription->plan_id
                ]
            ];

            $result = $this->createInvoice($data);

            if ($result['success']) {
                // Cache the invoice for later reference
                $cacheKey = "btcpay_invoice_{$subscription->id}";
                $this->cache($cacheKey, $result['data'], 3600);
            }

            $this->logMethodExit(__METHOD__, $result);
            return $result;

        } catch (Exception $e) {
            $this->logError('BTCPay subscription invoice creation error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Verify webhook signature
     */
    protected function verifySignature(array $payload, string $signature): bool
    {
        $payloadString = json_encode($payload);
        $expectedSignature = hash_hmac('sha256', $payloadString, $this->apiKey);
        
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Process payment from webhook
     */
    protected function processPayment(array $payload): array
    {
        $invoiceId = $payload['invoiceId'] ?? null;
        $status = $payload['status'] ?? null;

        if (!$invoiceId || !$status) {
            return [
                'success' => false,
                'error' => 'Invalid webhook payload'
            ];
        }

        // Get cached subscription info
        $cacheKey = "btcpay_invoice_{$invoiceId}";
        $cachedData = $this->getCache($cacheKey);

        if (!$cachedData) {
            return [
                'success' => false,
                'error' => 'Invoice not found in cache'
            ];
        }

        // Update subscription status
        if ($status === 'paid') {
            $subscription = Subscription::find($cachedData['metadata']['subscription_id'] ?? null);
            
            if ($subscription) {
                $subscription->update([
                    'status' => 'active',
                    'paid_at' => now(),
                    'btcpay_invoice_id' => $invoiceId
                ]);

                $this->logInfo('Subscription activated via BTCPay', [
                    'subscription_id' => $subscription->id,
                    'invoice_id' => $invoiceId
                ]);

                return [
                    'success' => true,
                    'message' => 'Payment processed successfully'
                ];
            }
        }

        return [
            'success' => false,
            'error' => 'Unable to process payment'
        ];
    }

    /**
     * Get payment history using Laravel's HTTP client
     */
    public function getPaymentHistory(string $userId, int $limit = 50): array
    {
        $this->logMethodEntry(__METHOD__, ['user_id' => $userId]);

        try {
            $cacheKey = "btcpay_payment_history_{$userId}";
            
            return $this->getCached($cacheKey, function () use ($userId, $limit) {
                $url = "{$this->baseUrl}/api/v1/stores/{$this->storeId}/invoices";
                
                $headers = $this->withApiKey($this->apiKey);
                
                $params = [
                    'limit' => $limit,
                    'includeArchived' => true
                ];
                
                $result = $this->get($url . '?' . http_build_query($params), $headers, $this->timeout);

                if ($result['success']) {
                    $this->logInfo('BTCPay payment history retrieved', [
                        'user_id' => $userId,
                        'count' => count($result['data'] ?? [])
                    ]);
                }

                return $result;
            }, 1800); // Cache for 30 minutes

        } catch (Exception $e) {
            $this->logError('BTCPay payment history error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
} 

