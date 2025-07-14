<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\Plan;
use App\Models\User;
use App\Events\SubscriptionUpdated;
use App\Notifications\SubscriptionUpdated as SubscriptionNotification;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\CacheServiceTrait;

class BillingService
{
    use LoggingTrait, ValidationTrait, CacheServiceTrait;

    private BTCPayService $btcpayService;

    public function __construct(BTCPayService $btcpayService)
    {
        $this->btcpayService = $btcpayService;
    }

    /**
     * Create a new subscription via BTCPay
     */
    public function createSubscription(User $user, Plan $plan): array
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
                'expiry' => now()->addDays(30), // Default 30 days
            ]);

            // Create BTCPay invoice
            $invoiceResult = $this->btcpayService->createSubscriptionInvoice($subscription);

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
    public function createManualSubscription(User $user, Plan $plan, array $paymentDetails): array
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
    public function processManualPayment(Subscription $subscription, array $paymentDetails): array
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

            // Update subscription with payment details
            $subscription->update([
                'status' => 'active',
                'payment_method' => $paymentDetails['payment_method'],
                'payment_reference' => $paymentDetails['payment_reference'] ?? null,
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
                'user_id' => $subscription->user_id,
                'payment_method' => $paymentDetails['payment_method'],
                'amount_paid' => $paymentDetails['amount_paid'],
                'processed_by' => auth()->id()
            ]);

            $result = [
                'success' => true,
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
    public function getManualPaymentMethods(): array
    {
        return [
            'cash' => [
                'name' => 'Cash',
                'description' => 'Physical cash payment',
                'icon' => '💵'
            ],
            'bank_transfer' => [
                'name' => 'Bank Transfer',
                'description' => 'Direct bank transfer',
                'icon' => '🏦'
            ],
            'check' => [
                'name' => 'Check',
                'description' => 'Physical check payment',
                'icon' => '📄'
            ],
            'paypal' => [
                'name' => 'PayPal',
                'description' => 'PayPal payment',
                'icon' => '💳'
            ],
            'other' => [
                'name' => 'Other',
                'description' => 'Other payment method',
                'icon' => '📝'
            ]
        ];
    }

    /**
     * Process BTCPay webhook
     */
    public function processWebhook(array $payload): bool
    {
        $this->logMethodEntry(__METHOD__, $payload);

        try {
            $invoiceId = $payload['invoiceId'] ?? null;
            $status = $payload['status'] ?? null;

            if (!$invoiceId || !$status) {
                $this->logWarning('Invalid webhook payload', ['payload' => $payload]);
                return false;
            }

            $subscription = Subscription::where('payment_id', $invoiceId)->first();

            if (!$subscription) {
                $this->logWarning('Subscription not found for invoice', ['invoice_id' => $invoiceId]);
                return false;
            }

            $oldStatus = $subscription->status;

            switch ($status) {
                case 'Settled':
                    $subscription->update([
                        'status' => 'active',
                        'expiry' => now()->addDays(30), // Extend subscription
                    ]);
                    break;

                case 'Expired':
                case 'Invalid':
                    $subscription->update(['status' => 'expired']);
                    break;

                case 'Cancelled':
                    $subscription->update(['status' => 'canceled']);
                    break;

                default:
                    $this->logInfo('Unhandled webhook status', ['status' => $status, 'invoice_id' => $invoiceId]);
                    return true;
            }

            // Broadcast subscription update
            event(new SubscriptionUpdated($subscription));

            // Send notification
            $subscription->user->notify(new SubscriptionNotification($subscription));

            $this->logInfo('Webhook processed', [
                'invoice_id' => $invoiceId,
                'old_status' => $oldStatus,
                'new_status' => $subscription->status,
                'user_id' => $subscription->user_id
            ]);

            $this->logMethodExit(__METHOD__, ['success' => true]);
            return true;

        } catch (\Exception $e) {
            $this->logError('Webhook processing error', [
                'payload' => $payload,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Get subscription status from BTCPay
     */
    public function getInvoiceStatus(string $invoiceId): ?string
    {
        $this->logMethodEntry(__METHOD__, ['invoice_id' => $invoiceId]);

        try {
            $result = $this->btcpayService->getInvoice($invoiceId);
            
            if ($result['success']) {
                $status = $result['data']['status'] ?? null;
                $this->logMethodExit(__METHOD__, ['status' => $status]);
                return $status;
            }

            return null;

        } catch (\Exception $e) {
            $this->logError('Failed to get invoice status', [
                'invoice_id' => $invoiceId,
                'error' => $e->getMessage()
            ]);

            return null;
        }
    }

    /**
     * Cancel subscription
     */
    public function cancelSubscription(Subscription $subscription): bool
    {
        $this->logMethodEntry(__METHOD__, ['subscription_id' => $subscription->id]);

        try {
            $subscription->update(['status' => 'canceled']);

            // Broadcast subscription update
            event(new SubscriptionUpdated($subscription));

            // Send notification
            $subscription->user->notify(new SubscriptionNotification($subscription));

            $this->logInfo('Subscription canceled', [
                'subscription_id' => $subscription->id,
                'user_id' => $subscription->user_id
            ]);

            $this->logMethodExit(__METHOD__, ['success' => true]);
            return true;

        } catch (\Exception $e) {
            $this->logError('Failed to cancel subscription', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Check subscription limits
     */
    public function checkSubscriptionLimits(User $user): array
    {
        $activeSubscription = $user->subscriptions()
            ->where('status', 'active')
            ->where('expiry', '>', now())
            ->with('plan')
            ->first();

        if (!$activeSubscription) {
            return [
                'has_active_subscription' => false,
                'can_create_campaigns' => false,
                'can_send_emails' => false,
                'limits' => null
            ];
        }

        $plan = $activeSubscription->plan;
        $currentCampaigns = $user->campaigns()->where('status', 'active')->count();
        $todayEmails = $user->campaigns()
            ->whereDate('created_at', today())
            ->sum('emails_sent');

        return [
            'has_active_subscription' => true,
            'can_create_campaigns' => $currentCampaigns < $plan->max_campaigns,
            'can_send_emails' => $todayEmails < $plan->max_emails_per_day,
            'limits' => [
                'max_campaigns' => $plan->max_campaigns,
                'current_campaigns' => $currentCampaigns,
                'max_emails_per_day' => $plan->max_emails_per_day,
                'emails_sent_today' => $todayEmails,
                'subscription_expires' => $activeSubscription->expiry
            ]
        ];
    }

    /**
     * Get payment history for user
     */
    public function getPaymentHistory(User $user): array
    {
        $payments = $user->subscriptions()
            ->whereNotNull('paid_at')
            ->with('plan')
            ->orderBy('paid_at', 'desc')
            ->get()
            ->map(function ($subscription) {
                return [
                    'id' => $subscription->id,
                    'plan_name' => $subscription->plan->name,
                    'amount' => $subscription->payment_amount,
                    'currency' => $subscription->payment_currency,
                    'payment_method' => $subscription->payment_method,
                    'payment_reference' => $subscription->payment_reference,
                    'status' => $subscription->status,
                    'paid_at' => $subscription->paid_at,
                    'expiry' => $subscription->expiry,
                    'notes' => $subscription->notes
                ];
            });

        return [
            'success' => true,
            'data' => $payments
        ];
    }
} 