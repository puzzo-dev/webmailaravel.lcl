<?php

namespace App\Traits;

use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\CacheManagementTrait;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Subscription;
use App\Models\Payment;
use Carbon\Carbon;
use App\Models\Plan;
use App\Events\SubscriptionUpdated;
use App\Notifications\SubscriptionUpdated as SubscriptionNotification;

trait BillingTrait
{
    use LoggingTrait, ValidationTrait, CacheManagementTrait;

    /**
     * Create a new subscription via BTCPay
     */
    protected function createBTCPaySubscription(User $user, Plan $plan): array
    {
        $this->logMethodEntry(__METHOD__, [
            'user_id' => $user->id,
            'plan_id' => $plan->id
        ]);

        try {
            // Create subscription record first
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'status' => 'pending',
                'expiry' => now()->addDays($plan->duration_days ?? 30),
            ]);

            // Create BTCPay invoice directly
            $invoiceResult = $this->createBTCPayInvoice([
                'amount' => $plan->price,
                'currency' => $plan->currency ?? 'USD',
                'metadata' => [
                    'subscription_id' => $subscription->id,
                    'user_id' => $subscription->user_id,
                    'plan_id' => $subscription->plan_id
                ]
            ]);

            if (!$invoiceResult['success']) {
                // Delete subscription if invoice creation failed
                $subscription->delete();
                
                $this->logError('BTCPay invoice creation failed', [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'error' => $invoiceResult['error']
                ]);

                return ['success' => false, 'error' => 'Failed to create invoice'];
            }

            // Update subscription with payment details
            $subscription->update([
                'payment_id' => $invoiceResult['data']['id'],
                'payment_url' => $invoiceResult['data']['checkoutLink']
            ]);

            $this->logInfo('BTCPay invoice created', [
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'invoice_id' => $invoiceResult['data']['id'],
                'amount' => $plan->price
            ]);

            $result = [
                'success' => true,
                'invoice_id' => $invoiceResult['data']['id'],
                'checkout_url' => $invoiceResult['data']['checkoutLink'],
                'subscription_id' => $subscription->id,
            ];

            $this->logMethodExit(__METHOD__, $result);
            return $result;

        } catch (\Exception $e) {
            $this->logError('BTCPay API error', [
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'error' => $e->getMessage()
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Create manual subscription (cash payment)
     */
    protected function createManualSubscription(User $user, Plan $plan, array $paymentDetails): array
    {
        $this->logMethodEntry(__METHOD__, [
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'payment_method' => $paymentDetails['payment_method'] ?? 'unknown'
        ]);

        try {
            // Validate payment details
            $requiredFields = ['payment_method', 'payment_reference', 'amount_paid'];
            $validation = $this->validateRequiredFields($paymentDetails, $requiredFields);
            
            if (!$validation['is_valid']) {
                return [
                    'success' => false,
                    'error' => implode(', ', $validation['errors'])
                ];
            }

            // Validate payment amount
            if ($paymentDetails['amount_paid'] != $plan->price) {
                return [
                    'success' => false,
                    'error' => 'Payment amount does not match plan price'
                ];
            }

            // Create subscription with manual payment details
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'status' => 'active', // Immediately active for manual payments
                'payment_method' => $paymentDetails['payment_method'],
                'payment_reference' => $paymentDetails['payment_reference'],
                'payment_amount' => $paymentDetails['amount_paid'],
                'payment_currency' => $paymentDetails['currency'] ?? 'USD',
                'paid_at' => now(),
                'expiry' => now()->addDays($plan->duration_days ?? 30),
                'notes' => $paymentDetails['notes'] ?? null,
                'processed_by' => auth()->id() ?? null
            ]);

            // Update user billing status
            $user->update([
                'billing_status' => 'active',
                'last_payment_at' => now()
            ]);

            // Broadcast subscription update
            event(new SubscriptionUpdated($subscription));

            // Send notification
            $user->notify(new SubscriptionNotification($subscription));

            $this->logInfo('Manual subscription created', [
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'subscription_id' => $subscription->id,
                'payment_method' => $paymentDetails['payment_method'],
                'amount_paid' => $paymentDetails['amount_paid'],
                'processed_by' => auth()->id()
            ]);

            $result = [
                'success' => true,
                'subscription_id' => $subscription->id,
                'message' => 'Manual subscription created successfully'
            ];

            $this->logMethodExit(__METHOD__, $result);
            return $result;

        } catch (\Exception $e) {
            $this->logError('Manual subscription creation failed', [
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process manual payment for existing subscription
     */
    protected function processManualPayment(Subscription $subscription, array $paymentDetails): array
    {
        $this->logMethodEntry(__METHOD__, [
            'subscription_id' => $subscription->id,
            'payment_method' => $paymentDetails['payment_method'] ?? 'unknown'
        ]);

        try {
            // Validate payment details
            if (!isset($paymentDetails['payment_method']) || !isset($paymentDetails['amount_paid'])) {
                return [
                    'success' => false,
                    'error' => 'Missing payment method or amount'
                ];
            }

            // Validate payment amount
            if ($paymentDetails['amount_paid'] != $subscription->plan->price) {
                return [
                    'success' => false,
                    'error' => 'Payment amount does not match subscription amount'
                ];
            }

            // Update subscription with payment details
            $subscription->update([
                'status' => 'active',
                'payment_method' => $paymentDetails['payment_method'],
                'payment_reference' => $paymentDetails['payment_reference'],
                'payment_amount' => $paymentDetails['amount_paid'],
                'payment_currency' => $paymentDetails['currency'] ?? 'USD',
                'paid_at' => now(),
                'expiry' => now()->addDays($subscription->plan->duration_days ?? 30),
                'notes' => $paymentDetails['notes'] ?? null,
                'processed_by' => auth()->id() ?? null
            ]);

            // Update user billing status
            $subscription->user->update([
                'billing_status' => 'active',
                'last_payment_at' => now()
            ]);

            // Broadcast subscription update
            event(new SubscriptionUpdated($subscription));

            // Send notification
            $subscription->user->notify(new SubscriptionNotification($subscription));

            $this->logInfo('Manual payment processed', [
                'subscription_id' => $subscription->id,
                'payment_method' => $paymentDetails['payment_method'],
                'amount_paid' => $paymentDetails['amount_paid'],
                'processed_by' => auth()->id()
            ]);

            $result = [
                'success' => true,
                'subscription_id' => $subscription->id,
                'message' => 'Manual payment processed successfully'
            ];

            $this->logMethodExit(__METHOD__, $result);
            return $result;

        } catch (\Exception $e) {
            $this->logError('Manual payment processing failed', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get manual payment methods
     */
    protected function getManualPaymentMethods(): array
    {
        return [
            'cash' => [
                'name' => 'Cash',
                'description' => 'Cash payment',
                'processing_time' => 'immediate'
            ],
            'bank_transfer' => [
                'name' => 'Bank Transfer',
                'description' => 'Direct bank transfer',
                'processing_time' => '1-3 business days'
            ],
            'check' => [
                'name' => 'Check',
                'description' => 'Check or money order',
                'processing_time' => '3-5 business days'
            ],
            'paypal' => [
                'name' => 'PayPal',
                'description' => 'PayPal payment',
                'processing_time' => '1-2 business days'
            ],
            'other' => [
                'name' => 'Other',
                'description' => 'Other payment method',
                'processing_time' => 'varies'
            ]
        ];
    }

    /**
     * Cancel subscription
     */
    protected function cancelSubscription(Subscription $subscription): bool
    {
        try {
            $subscription->update([
                'status' => 'cancelled',
                'cancelled_at' => now()
            ]);

            // Update user billing status if no active subscriptions
            $user = $subscription->user;
            if (!$user->subscriptions()->where('status', 'active')->exists()) {
                $user->update(['billing_status' => 'inactive']);
            }

            // Broadcast subscription update
            event(new SubscriptionUpdated($subscription));

            $this->logInfo('Subscription cancelled', [
                'subscription_id' => $subscription->id,
                'user_id' => $subscription->user_id
            ]);

            return true;

        } catch (\Exception $e) {
            $this->logError('Subscription cancellation failed', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Check subscription limits for user
     */
    protected function checkSubscriptionLimits(User $user): array
    {
        $subscription = $user->activeSubscription;
        
        if (!$subscription) {
            return [
                'has_active_subscription' => false,
                'limits' => [
                    'max_domains' => 1,
                    'max_senders_per_domain' => 2,
                    'max_total_campaigns' => 10,
                    'max_live_campaigns' => 1,
                    'daily_sending_limit' => 1000,
                ]
            ];
        }

        return [
            'has_active_subscription' => true,
            'subscription_id' => $subscription->id,
            'plan_name' => $subscription->plan->name,
            'expiry' => $subscription->expiry,
            'limits' => [
                'max_domains' => $subscription->plan->max_domains ?? 20,
                'max_senders_per_domain' => $subscription->plan->max_senders_per_domain ?? 5,
                'max_total_campaigns' => $subscription->plan->max_total_campaigns ?? 100,
                'max_live_campaigns' => $subscription->plan->max_live_campaigns ?? 10,
                'daily_sending_limit' => $subscription->plan->daily_sending_limit ?? 10000,
            ]
        ];
    }

    /**
     * Get payment history for user
     */
    protected function getPaymentHistory(User $user): array
    {
        try {
            $subscriptions = $user->subscriptions()
                ->with('plan')
                ->orderBy('created_at', 'desc')
                ->get();

            $history = [];
            foreach ($subscriptions as $subscription) {
                $history[] = [
                    'subscription_id' => $subscription->id,
                    'plan_name' => $subscription->plan->name,
                    'amount' => $subscription->payment_amount,
                    'currency' => $subscription->payment_currency,
                    'status' => $subscription->status,
                    'payment_method' => $subscription->payment_method,
                    'payment_reference' => $subscription->payment_reference,
                    'created_at' => $subscription->created_at,
                    'paid_at' => $subscription->paid_at,
                    'expiry' => $subscription->expiry
                ];
            }

            return [
                'success' => true,
                'data' => $history,
                'total' => count($history)
            ];

        } catch (\Exception $e) {
            $this->logError('Payment history retrieval failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Create a new BTCPay invoice
     */
    protected function createBTCPayInvoice(array $data): array
    {
        $this->logMethodEntry(__METHOD__, $data);

        try {
            $baseUrl = config('services.btcpay.base_url');
            $apiKey = config('services.btcpay.api_key');
            $storeId = config('services.btcpay.store_id');
            $timeout = config('services.btcpay.timeout', 30);

            // Check if BTCPay is properly configured
            if (!$baseUrl || !$apiKey || !$storeId) {
                return [
                    'success' => false,
                    'error' => 'BTCPay is not properly configured. Please check your configuration.',
                    'details' => [
                        'base_url' => $baseUrl ? 'configured' : 'missing',
                        'api_key' => $apiKey ? 'configured' : 'missing',
                        'store_id' => $storeId ? 'configured' : 'missing'
                    ]
                ];
            }

            $url = "{$baseUrl}/api/v1/stores/{$storeId}/invoices";
            
            $headers = $this->withApiKey($apiKey);
            
            // Prepare BTCPay invoice payload with proper structure
            $invoicePayload = [
                'amount' => $data['amount'],
                'currency' => $data['currency'] ?? 'USD',
                'metadata' => $data['metadata'] ?? [],
                'checkout' => [
                    'redirectURL' => url('/billing?payment=success'),
                    'closeURL' => url('/billing?payment=cancelled'),
                ],
                'notificationURL' => url('/api/billing/webhook'),
                'notificationEmail' => auth()->user()->email ?? null,
            ];
            
            $result = $this->post($url, $invoicePayload, $headers, $timeout);

            if ($result['success']) {
                $this->logInfo('BTCPay invoice created successfully', [
                    'invoice_id' => $result['data']['id'] ?? null
                ]);
            } else {
                $this->logError('Failed to create BTCPay invoice', $result);
            }

            $this->logMethodExit(__METHOD__, $result);
            return $result;

        } catch (\Exception $e) {
            $this->logError('BTCPay invoice creation error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get BTCPay invoice details
     */
    protected function getBTCPayInvoice(string $invoiceId): array
    {
        $this->logMethodEntry(__METHOD__, ['invoice_id' => $invoiceId]);

        try {
            $baseUrl = config('services.btcpay.base_url');
            $apiKey = config('services.btcpay.api_key');
            $storeId = config('services.btcpay.store_id');
            $timeout = config('services.btcpay.timeout', 30);

            // Check if BTCPay is properly configured
            if (!$baseUrl || !$apiKey || !$storeId) {
                return [
                    'success' => false,
                    'error' => 'BTCPay is not properly configured. Please check your configuration.',
                    'details' => [
                        'base_url' => $baseUrl ? 'configured' : 'missing',
                        'api_key' => $apiKey ? 'configured' : 'missing',
                        'store_id' => $storeId ? 'configured' : 'missing'
                    ]
                ];
            }

            $url = "{$baseUrl}/api/v1/stores/{$storeId}/invoices/{$invoiceId}";
            
            $headers = $this->withApiKey($apiKey);
            
            $result = $this->get($url, $headers, $timeout);

            if ($result['success']) {
                $this->logInfo('BTCPay invoice retrieved successfully', [
                    'invoice_id' => $invoiceId
                ]);
            } else {
                $this->logError('Failed to retrieve BTCPay invoice', $result);
            }

            $this->logMethodExit(__METHOD__, $result);
            return $result;

        } catch (\Exception $e) {
            $this->logError('BTCPay invoice retrieval error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process BTCPay webhook
     */
    protected function processBTCPayWebhook(array $payload, string $signature): array
    {
        $this->logMethodEntry(__METHOD__, ['payload' => $payload]);

        try {
            // Verify signature
            if (!$this->verifyBTCPaySignature($payload, $signature)) {
                $this->logWarning('BTCPay webhook invalid signature', [
                    'signature' => $signature
                ]);
                
                return [
                    'success' => false,
                    'error' => 'Invalid signature'
                ];
            }

            // Process payment
            $result = $this->processBTCPayPayment($payload);
            
            $this->logInfo('BTCPay webhook processed', [
                'invoice_id' => $payload['invoiceId'] ?? null,
                'result' => $result
            ]);

            $this->logMethodExit(__METHOD__, $result);
            return $result;

        } catch (\Exception $e) {
            $this->logError('BTCPay webhook processing error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Verify BTCPay webhook signature
     */
    protected function verifyBTCPaySignature(array $payload, string $signature): bool
    {
        $webhookSecret = config('services.btcpay.webhook_secret');
        
        // If webhook secret is not configured, signature verification will fail
        if (!$webhookSecret) {
            $this->logWarning('BTCPay webhook secret not configured, signature verification skipped');
            return false;
        }
        
        // Remove 'sha256=' prefix if present
        $signature = str_replace('sha256=', '', $signature);
        
        $payloadString = json_encode($payload, JSON_UNESCAPED_SLASHES);
        $expectedSignature = hash_hmac('sha256', $payloadString, $webhookSecret);
        
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Process BTCPay payment from webhook
     */
    protected function processBTCPayPayment(array $payload): array
    {
        // BTCPay Server webhook payload structure
        $invoiceId = $payload['invoiceId'] ?? $payload['id'] ?? null;
        $status = $payload['status'] ?? null;
        $type = $payload['type'] ?? null;

        if (!$invoiceId) {
            return [
                'success' => false,
                'error' => 'Invalid webhook payload - missing invoice ID'
            ];
        }

        // Find subscription by invoice ID
        $subscription = Subscription::where('payment_id', $invoiceId)->first();
        
        if (!$subscription) {
            $this->logWarning('Subscription not found for BTCPay invoice', [
                'invoice_id' => $invoiceId,
                'payload' => $payload
            ]);
            return [
                'success' => false,
                'error' => 'Subscription not found for invoice'
            ];
        }

        $this->logInfo('Processing BTCPay webhook for subscription', [
            'subscription_id' => $subscription->id,
            'invoice_id' => $invoiceId,
            'status' => $status,
            'type' => $type
        ]);

        // Handle different BTCPay webhook events
        switch ($type) {
            case 'InvoiceReceivedPayment':
                // Payment received but not yet confirmed
                $subscription->update(['status' => 'processing']);
                return [
                    'success' => true,
                    'message' => 'Payment received, waiting for confirmations',
                    'subscription_id' => $subscription->id
                ];

            case 'InvoicePaymentSettled':
                // Payment confirmed with required confirmations
                $confirmationCount = $payload['confirmationCount'] ?? 0;
                $requiredConfirmations = config('services.btcpay.required_confirmations', 1);
                
                if ($confirmationCount >= $requiredConfirmations) {
                    $subscription->update([
                        'status' => 'active',
                        'paid_at' => now(),
                        'expiry' => now()->addDays($subscription->plan->duration_days ?? 30)
                    ]);
                    
                    // Update user billing status
                    $subscription->user->update([
                        'billing_status' => 'active',
                        'last_payment_at' => now()
                    ]);
                    
                    return [
                        'success' => true,
                        'message' => 'Payment confirmed and subscription activated',
                        'subscription_id' => $subscription->id
                    ];
                }
                break;

            case 'InvoiceExpired':
                $subscription->update(['status' => 'expired']);
                return [
                    'success' => true,
                    'message' => 'Invoice expired',
                    'subscription_id' => $subscription->id
                ];

            case 'InvoiceInvalid':
                $subscription->update(['status' => 'failed']);
                return [
                    'success' => true,
                    'message' => 'Payment failed',
                    'subscription_id' => $subscription->id
                ];
        }

        // Handle legacy status-based processing for backward compatibility
        if ($status) {
            switch (strtolower($status)) {
                case 'settled':
                case 'confirmed':
                case 'complete':
                    $subscription->update([
                        'status' => 'active',
                        'paid_at' => now(),
                        'expiry' => now()->addDays($subscription->plan->duration_days ?? 30)
                    ]);
                    
                    $subscription->user->update([
                        'billing_status' => 'active',
                        'last_payment_at' => now()
                    ]);
                    
                    return [
                        'success' => true,
                        'message' => 'Payment confirmed and subscription activated',
                        'subscription_id' => $subscription->id
                    ];

                case 'expired':
                    $subscription->update(['status' => 'expired']);
                    return [
                        'success' => true,
                        'message' => 'Invoice expired',
                        'subscription_id' => $subscription->id
                    ];

                case 'invalid':
                    $subscription->update(['status' => 'failed']);
                    return [
                        'success' => true,
                        'message' => 'Payment failed',
                        'subscription_id' => $subscription->id
                    ];
            }
        }

        return [
            'success' => false,
            'error' => 'Unknown payment status: ' . $status
        ];
    }

    /**
     * Renew a BTCPay subscription
     */
    protected function renewBTCPaySubscription(Subscription $subscription): array
    {
        $this->logMethodEntry(__METHOD__, [
            'subscription_id' => $subscription->id
        ]);

        try {
            // Get the subscription's plan
            $plan = $subscription->plan;
            if (!$plan) {
                return [
                    'success' => false,
                    'message' => 'Subscription plan not found'
                ];
            }

            // Create a new BTCPay invoice for renewal
            $invoiceResult = $this->createBTCPayInvoice([
                'amount' => $plan->price,
                'currency' => $plan->currency ?? 'USD',
                'metadata' => [
                    'subscription_id' => $subscription->id,
                    'user_id' => $subscription->user_id,
                    'plan_id' => $subscription->plan_id,
                    'type' => 'renewal'
                ]
            ]);

            if ($invoiceResult['success']) {
                // Update subscription status to pending renewal
                $subscription->update([
                    'status' => 'pending_renewal'
                ]);

                $this->logInfo('Subscription renewal invoice created', [
                    'subscription_id' => $subscription->id,
                    'invoice_id' => $invoiceResult['data']['id']
                ]);

                return [
                    'success' => true,
                    'data' => [
                        'subscription' => $subscription->fresh(),
                        'invoice' => $invoiceResult['data']
                    ]
                ];
            }

            return $invoiceResult;

        } catch (\Exception $e) {
            $this->logError('Failed to renew BTCPay subscription', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to renew subscription: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get BTCPay payment rates
     */
    protected function getBTCPayPaymentRates(): array
    {
        try {
            $baseUrl = config('services.btcpay.base_url');
            $apiKey = config('services.btcpay.api_key');
            $storeId = config('services.btcpay.store_id');
            $timeout = config('services.btcpay.timeout', 30);

            // Check if BTCPay is properly configured
            if (!$baseUrl || !$apiKey || !$storeId) {
                return [
                    'success' => false,
                    'error' => 'BTCPay is not properly configured. Please check your configuration.',
                    'details' => [
                        'base_url' => $baseUrl ? 'configured' : 'missing',
                        'api_key' => $apiKey ? 'configured' : 'missing',
                        'store_id' => $storeId ? 'configured' : 'missing'
                    ]
                ];
            }

            $url = "{$baseUrl}/api/v1/stores/{$storeId}/rates";
            
            $headers = $this->withApiKey($apiKey);
            
            $result = $this->get($url, $headers, $timeout);

            if ($result['success']) {
                $this->logInfo('BTCPay rates retrieved successfully');
            } else {
                $this->logError('Failed to retrieve BTCPay rates', $result);
            }

            return $result;

        } catch (\Exception $e) {
            $this->logError('BTCPay rates retrieval error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
} 