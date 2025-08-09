<?php

namespace App\Services;

use App\Models\User;
use App\Models\Subscription;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\SystemConfig;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\CacheManagementTrait;
use App\Traits\HttpClientTrait;
use App\Events\SubscriptionUpdated;
use App\Notifications\SubscriptionUpdated as SubscriptionNotification;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RefinedBillingService
{
    use LoggingTrait, ValidationTrait, CacheManagementTrait, HttpClientTrait;

    private array $btcpayConfig;

    public function __construct()
    {
        $this->btcpayConfig = $this->loadBTCPayConfiguration();
    }

    /**
     * Create subscription with unified validation and processing
     */
    public function createSubscription(User $user, Plan $plan, string $paymentMethod = 'btcpay', array $paymentDetails = []): array
    {
        $this->logInfo('Creating subscription', [
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'payment_method' => $paymentMethod
        ]);

        try {
            DB::beginTransaction();

            // Validate user can create subscription
            $this->validateSubscriptionCreation($user, $plan);

            // Create subscription based on payment method
            $result = match ($paymentMethod) {
                'btcpay' => $this->createBTCPaySubscription($user, $plan),
                'manual' => $this->createManualSubscription($user, $plan, $paymentDetails),
                default => throw new \InvalidArgumentException("Unsupported payment method: {$paymentMethod}")
            };

            if ($result['success']) {
                DB::commit();
                $this->logInfo('Subscription created successfully', [
                    'subscription_id' => $result['subscription_id'],
                    'payment_method' => $paymentMethod
                ]);
            } else {
                DB::rollBack();
                $this->logError('Subscription creation failed', [
                    'error' => $result['error'],
                    'payment_method' => $paymentMethod
                ]);
            }

            return $result;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->logError('Subscription creation exception', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'plan_id' => $plan->id
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process payment with unified handling
     */
    public function processPayment(Subscription $subscription, array $paymentData): array
    {
        $this->logInfo('Processing payment', [
            'subscription_id' => $subscription->id,
            'payment_method' => $subscription->payment_method
        ]);

        try {
            $result = match ($subscription->payment_method) {
                'btcpay' => $this->processBTCPayPayment($paymentData),
                'manual' => $this->processManualPayment($subscription, $paymentData),
                default => throw new \InvalidArgumentException("Unsupported payment method: {$subscription->payment_method}")
            };

            if ($result['success']) {
                $this->updateSubscriptionAfterPayment($subscription, $result);
                $this->sendPaymentNotifications($subscription, $result);
            }

            return $result;

        } catch (\Exception $e) {
            $this->logError('Payment processing failed', [
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
     * Get subscription analytics with caching
     */
    public function getSubscriptionAnalytics(User $user = null, int $cacheTtl = 3600): array
    {
        $cacheKey = 'subscription_analytics' . ($user ? "_{$user->id}" : '_system');
        
        return $this->getCachedData($cacheKey, function () use ($user) {
            $query = Subscription::with(['plan', 'user']);
            
            if ($user) {
                $query->where('user_id', $user->id);
            }

            $subscriptions = $query->get();

            return [
                'total_subscriptions' => $subscriptions->count(),
                'active_subscriptions' => $subscriptions->where('status', 'active')->count(),
                'pending_subscriptions' => $subscriptions->where('status', 'pending')->count(),
                'cancelled_subscriptions' => $subscriptions->where('status', 'cancelled')->count(),
                'total_revenue' => $subscriptions->where('status', 'active')->sum('amount'),
                'monthly_revenue' => $subscriptions->where('status', 'active')
                    ->where('created_at', '>=', now()->startOfMonth())->sum('amount'),
                'subscription_breakdown' => $subscriptions->groupBy('plan.name')
                    ->map(fn($group) => $group->count()),
                'payment_method_breakdown' => $subscriptions->groupBy('payment_method')
                    ->map(fn($group) => $group->count()),
            ];
        }, $cacheTtl);
    }

    /**
     * Validate subscription limits and constraints
     */
    public function validateSubscriptionLimits(User $user): array
    {
        $activeSubscription = $user->activeSubscription();
        
        if (!$activeSubscription) {
            return [
                'valid' => false,
                'error' => 'No active subscription found',
                'limits' => $this->getFreePlanLimits()
            ];
        }

        $plan = $activeSubscription->plan;
        $usage = $this->getUserUsageStats($user);
        
        $limits = [
            'max_campaigns' => $plan->max_campaigns ?? 10,
            'max_live_campaigns' => $plan->max_live_campaigns ?? 2,
            'max_senders' => $plan->max_senders ?? 5,
            'max_domains' => $plan->max_domains ?? 2,
            'max_monthly_emails' => $plan->max_monthly_emails ?? 1000,
        ];

        $violations = [];
        
        if ($usage['campaigns'] >= $limits['max_campaigns']) {
            $violations[] = 'Maximum campaigns limit reached';
        }
        
        if ($usage['live_campaigns'] >= $limits['max_live_campaigns']) {
            $violations[] = 'Maximum live campaigns limit reached';
        }
        
        if ($usage['senders'] >= $limits['max_senders']) {
            $violations[] = 'Maximum senders limit reached';
        }
        
        if ($usage['domains'] >= $limits['max_domains']) {
            $violations[] = 'Maximum domains limit reached';
        }
        
        if ($usage['monthly_emails'] >= $limits['max_monthly_emails']) {
            $violations[] = 'Monthly email limit reached';
        }

        return [
            'valid' => empty($violations),
            'violations' => $violations,
            'limits' => $limits,
            'usage' => $usage,
            'subscription' => $activeSubscription
        ];
    }

    /**
     * Cancel subscription with proper cleanup
     */
    public function cancelSubscription(Subscription $subscription, string $reason = null): array
    {
        $this->logInfo('Cancelling subscription', [
            'subscription_id' => $subscription->id,
            'reason' => $reason
        ]);

        try {
            DB::beginTransaction();

            // Cancel based on payment method
            $result = match ($subscription->payment_method) {
                'btcpay' => $this->cancelBTCPaySubscription($subscription),
                'manual' => $this->cancelManualSubscription($subscription),
                default => ['success' => true] // Default cancellation
            };

            if ($result['success']) {
                $subscription->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                    'cancellation_reason' => $reason
                ]);

                // Notify user
                $subscription->user->notify(new SubscriptionNotification($subscription, 'cancelled'));
                
                // Broadcast event
                event(new SubscriptionUpdated($subscription));

                DB::commit();
                
                $this->logInfo('Subscription cancelled successfully', [
                    'subscription_id' => $subscription->id
                ]);
            } else {
                DB::rollBack();
            }

            return $result;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->logError('Subscription cancellation failed', [
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
     * Renew subscription with validation
     */
    public function renewSubscription(Subscription $subscription): array
    {
        $this->logInfo('Renewing subscription', [
            'subscription_id' => $subscription->id
        ]);

        try {
            // Validate subscription can be renewed
            if (!in_array($subscription->status, ['active', 'expired'])) {
                throw new \Exception('Subscription cannot be renewed in current status: ' . $subscription->status);
            }

            $result = match ($subscription->payment_method) {
                'btcpay' => $this->renewBTCPaySubscription($subscription),
                'manual' => $this->renewManualSubscription($subscription),
                default => throw new \InvalidArgumentException("Unsupported payment method for renewal: {$subscription->payment_method}")
            };

            if ($result['success']) {
                $this->logInfo('Subscription renewed successfully', [
                    'subscription_id' => $subscription->id,
                    'new_expiry' => $result['new_expiry'] ?? null
                ]);
            }

            return $result;

        } catch (\Exception $e) {
            $this->logError('Subscription renewal failed', [
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
     * Private helper methods
     */
    private function loadBTCPayConfiguration(): array
    {
        return SystemConfig::getBTCPayConfig();
    }

    private function validateSubscriptionCreation(User $user, Plan $plan): void
    {
        // Check if user already has active subscription
        $activeSubscription = Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if ($activeSubscription) {
            throw new \Exception('User already has an active subscription');
        }

        // Validate plan is available
        if (!$plan->is_active) {
            throw new \Exception('Selected plan is not available');
        }
    }

    private function createBTCPaySubscription(User $user, Plan $plan): array
    {
        // Implementation would use the existing BillingTrait logic
        // but with better error handling and validation
        return ['success' => true, 'subscription_id' => null]; // Placeholder
    }

    private function createManualSubscription(User $user, Plan $plan, array $paymentDetails): array
    {
        // Implementation would use the existing BillingTrait logic
        return ['success' => true, 'subscription_id' => null]; // Placeholder
    }

    private function processBTCPayPayment(array $paymentData): array
    {
        // Implementation would use the existing BillingTrait logic
        return ['success' => true]; // Placeholder
    }

    private function processManualPayment(Subscription $subscription, array $paymentData): array
    {
        // Implementation would use the existing BillingTrait logic
        return ['success' => true]; // Placeholder
    }

    private function updateSubscriptionAfterPayment(Subscription $subscription, array $paymentResult): void
    {
        $subscription->update([
            'status' => 'active',
            'last_payment_at' => now(),
            'expiry' => now()->addDays($subscription->plan->duration_days ?? 30)
        ]);
    }

    private function sendPaymentNotifications(Subscription $subscription, array $paymentResult): void
    {
        $subscription->user->notify(new SubscriptionNotification($subscription, 'payment_received'));
        event(new SubscriptionUpdated($subscription));
    }

    private function getUserUsageStats(User $user): array
    {
        return [
            'campaigns' => $user->campaigns()->count(),
            'live_campaigns' => $user->campaigns()->whereIn('status', ['RUNNING', 'PAUSED'])->count(),
            'senders' => $user->senders()->count(),
            'domains' => $user->domains()->count(),
            'monthly_emails' => $user->campaigns()
                ->where('created_at', '>=', now()->startOfMonth())
                ->sum('total_sent')
        ];
    }

    private function getFreePlanLimits(): array
    {
        return [
            'max_campaigns' => 1,
            'max_live_campaigns' => 1,
            'max_senders' => 1,
            'max_domains' => 1,
            'max_monthly_emails' => 100,
        ];
    }

    private function cancelBTCPaySubscription(Subscription $subscription): array
    {
        // Implementation would use the existing BillingTrait logic
        return ['success' => true]; // Placeholder
    }

    private function cancelManualSubscription(Subscription $subscription): array
    {
        return ['success' => true]; // Placeholder
    }

    private function renewBTCPaySubscription(Subscription $subscription): array
    {
        // Implementation would use the existing BillingTrait logic
        return ['success' => true]; // Placeholder
    }

    private function renewManualSubscription(Subscription $subscription): array
    {
        return ['success' => true]; // Placeholder
    }
}
