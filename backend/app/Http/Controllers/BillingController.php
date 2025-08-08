<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\Plan;
use App\Models\User;
use App\Models\SystemConfig;
use App\Traits\BillingTrait;
use App\Traits\ResponseTrait;
use App\Traits\LoggingTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BillingController extends Controller
{
    // Alias the trait's processManualPayment to avoid name collision with the controller's public method
    use BillingTrait { processManualPayment as protected traitProcessManualPayment; }
    use ResponseTrait, LoggingTrait;

    /**
     * Get user subscriptions
     */
    public function index(Request $request): JsonResponse
    {
        $subscriptions = Subscription::where('user_id', Auth::id())
            ->with(['plan', 'user'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return $this->paginatedResponse($subscriptions, 'Subscriptions retrieved successfully');
    }

    /**
     * Get specific subscription
     */
    public function show(Subscription $subscription): JsonResponse
    {
        // Authorize user can view this subscription
        if ($subscription->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return $this->successResponse($subscription->load(['plan', 'user']), 'Subscription retrieved successfully');
    }

    /**
     * Create new subscription
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $plan = Plan::findOrFail($request->plan_id);
        $user = Auth::user();

        // Check if user already has an active subscription
        $activeSubscription = Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if ($activeSubscription) {
            return $this->errorResponse('User already has an active subscription', 400);
        }

        // Create subscription using BTCPay
        $result = $this->createBTCPaySubscription($user, $plan);

        if ($result['success']) {
            $this->logInfo('Subscription created successfully', [
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'subscription_id' => $result['subscription_id'] ?? null
            ]);

            return $this->successResponse($result, 'Subscription created successfully', 201);
        }

        return $this->errorResponse($result['error'] ?? 'Failed to create subscription', 400);
    }

    /**
     * Update subscription
     */
    public function update(Request $request, Subscription $subscription): JsonResponse
    {
        // Authorize user can update this subscription
        if ($subscription->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $request->validate([
            'plan_id' => 'sometimes|exists:plans,id',
            'status' => 'sometimes|in:active,cancelled,expired,pending'
        ]);

        if ($request->has('plan_id')) {
            $newPlan = Plan::findOrFail($request->plan_id);
            
            // Create upgrade/downgrade invoice
            $result = $this->createBTCPaySubscription(Auth::user(), $newPlan);
            
            if (!$result['success']) {
                return $this->errorResponse($result['error'] ?? 'Failed to update subscription', 400);
            }
        }

        $subscription->update($request->only(['status']));

        return $this->successResponse($subscription->fresh(['plan', 'user']), 'Subscription updated successfully');
    }

    /**
     * Cancel subscription
     */
    public function destroy(Subscription $subscription): JsonResponse
    {
        // Authorize user can cancel this subscription
        if ($subscription->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $result = $this->cancelBTCPaySubscription($subscription);

        if ($result['success']) {
            $this->logInfo('Subscription cancelled successfully', [
                'subscription_id' => $subscription->id,
                'user_id' => $subscription->user_id
            ]);

            return $this->successResponse(null, 'Subscription cancelled successfully');
        }

        return $this->errorResponse($result['error'] ?? 'Failed to cancel subscription', 400);
    }

    /**
     * Create invoice for subscription payment
     */
    public function createInvoice(Request $request): JsonResponse
    {
        $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
        ]);

        $subscription = Subscription::with('plan', 'user')->findOrFail($request->subscription_id);

        // Authorize user can create invoice for this subscription
        if ($subscription->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $result = $this->createBTCPaySubscriptionInvoice($subscription);

        if ($result['success']) {
            return $this->successResponse($result['data'], 'Invoice created successfully');
        }

        return $this->errorResponse($result['error'] ?? 'Failed to create invoice', 400);
    }

    /**
     * Get payment history
     */
    public function paymentHistory(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Admin can view any user's payment history
        if ($user->hasRole('admin') && $request->has('user_id')) {
            $user = User::findOrFail($request->user_id);
        }

        $payments = $this->getPaymentHistory($user);

        return $this->successResponse($payments, 'Payment history retrieved successfully');
    }

    /**
     * Get invoice status
     */
    public function invoiceStatus(Request $request): JsonResponse
    {
        $request->validate([
            'invoice_id' => 'required|string',
        ]);

        $status = $this->getBTCPayInvoiceStatus($request->invoice_id);

        return $this->successResponse($status, 'Invoice status retrieved successfully');
    }

    /**
     * Handle BTCPay webhook
     */
    public function webhook(Request $request): JsonResponse
    {
        $this->logInfo('BTCPay webhook received', [
            'headers' => $request->headers->all(),
            'payload_size' => strlen($request->getContent())
        ]);

        $payload = $request->all();
        
        // BTCPay Server sends signature in different header formats
        $signature = $request->header('BTCPay-Sig') ?? 
                    $request->header('X-BTCPay-Signature') ?? 
                    $request->header('X-BTCPay-Sig') ?? '';
        
        if (empty($signature)) {
            $this->logWarning('BTCPay webhook received without signature');
            return $this->errorResponse('Missing webhook signature', 400);
        }

        $result = $this->processBTCPayWebhook($payload, $signature);

        if ($result['success']) {
            $this->logInfo('BTCPay webhook processed successfully', [
                'result' => $result
            ]);
            return $this->successResponse($result, 'Webhook processed successfully');
        }

        $this->logError('BTCPay webhook processing failed', [
            'error' => $result['error'] ?? 'Unknown error',
            'payload' => $payload
        ]);

        return $this->errorResponse($result['error'] ?? 'Failed to process webhook', 400);
    }

    /**
     * Get available plans
     */
    public function plans(): JsonResponse
    {
        try {
        $plans = Plan::where('is_active', true)
            ->orderBy('price')
            ->get();

            // If no plans exist, create default plans
            if ($plans->isEmpty()) {
                $defaultPlans = [
                    [
                        'name' => 'Starter',
                        'description' => 'Perfect for small businesses and individuals',
                        'price' => 19.99,
                        'currency' => 'USD',
                        'duration_days' => 30,
                        'max_domains' => 1,
                        'max_senders_per_domain' => 2,
                        'max_total_campaigns' => 10,
                        'max_live_campaigns' => 1,
                        'daily_sending_limit' => 1000,
                        'features' => [
                            'Basic Analytics',
                            'Email Support',
                            'Standard Templates',
                            'Basic Reporting'
                        ],
                        'is_active' => true,
                    ],
                    [
                        'name' => 'Professional',
                        'description' => 'Ideal for growing businesses and marketing teams',
                        'price' => 49.99,
                        'currency' => 'USD',
                        'duration_days' => 30,
                        'max_domains' => 3,
                        'max_senders_per_domain' => 5,
                        'max_total_campaigns' => 50,
                        'max_live_campaigns' => 3,
                        'daily_sending_limit' => 5000,
                        'features' => [
                            'Advanced Analytics',
                            'Priority Support',
                            'Custom Domains',
                            'API Access',
                            'Advanced Reporting',
                            'A/B Testing'
                        ],
                        'is_active' => true,
                    ],
                    [
                        'name' => 'Enterprise',
                        'description' => 'For large organizations with high-volume needs',
                        'price' => 99.99,
                        'currency' => 'USD',
                        'duration_days' => 30,
                        'max_domains' => 10,
                        'max_senders_per_domain' => 10,
                        'max_total_campaigns' => 200,
                        'max_live_campaigns' => 10,
                        'daily_sending_limit' => 25000,
                        'features' => [
                            'Advanced Analytics',
                            'Dedicated Support',
                            'Custom Domains',
                            'API Access',
                            'White-label Options',
                            'Advanced Reporting',
                            'A/B Testing',
                            'Custom Integrations'
                        ],
                        'is_active' => true,
                    ],
                ];

                foreach ($defaultPlans as $planData) {
                    Plan::create($planData);
                }

                $plans = Plan::where('is_active', true)
                    ->orderBy('price')
                    ->get();
            }

        return $this->successResponse($plans, 'Plans retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve plans', 500);
        }
    }

    /**
     * Get payment rates and configuration
     */
    public function rates(): JsonResponse
    {
        $rates = $this->getBTCPayPaymentRates();

        return $this->successResponse($rates, 'Payment rates retrieved successfully');
    }

    /**
     * Renew subscription
     */
    public function renew(Request $request, Subscription $subscription): JsonResponse
    {
        // Authorize user can renew this subscription
        if ($subscription->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $result = $this->renewBTCPaySubscription($subscription);

        if ($result['success']) {
            $this->logInfo('Subscription renewed successfully', [
                'subscription_id' => $subscription->id,
                'user_id' => $subscription->user_id
            ]);

            return $this->successResponse($result['data'], 'Subscription renewed successfully');
        }

        return $this->errorResponse($result['error'] ?? 'Failed to renew subscription', 400);
    }

    /**
     * Get billing statistics for admin dashboard
     */
    public function getBillingStats(): JsonResponse
    {
        try {
            // Initialize default stats to prevent null/undefined issues
            $stats = [
                'active_subscriptions' => 0,
                'pending_payments' => 0,
                'expiring_soon' => 0,
                'monthly_revenue' => 0.00,
                'last_month_revenue' => 0.00,
                'total_revenue' => 0.00,
                'conversion_rate' => 0.0,
            ];

            // Safely calculate each stat with error handling
            try {
                $stats['active_subscriptions'] = Subscription::where('status', 'active')->count();
            } catch (\Exception $e) {
                \Log::warning('Failed to get active subscriptions count: ' . $e->getMessage());
            }

            try {
                $stats['pending_payments'] = Subscription::where('status', 'pending')->count();
            } catch (\Exception $e) {
                \Log::warning('Failed to get pending payments count: ' . $e->getMessage());
            }

            try {
                $stats['expiring_soon'] = Subscription::where('status', 'active')
                    ->where('expiry', '<=', now()->addDays(7))
                    ->count();
            } catch (\Exception $e) {
                \Log::warning('Failed to get expiring subscriptions count: ' . $e->getMessage());
            }

            try {
                $stats['monthly_revenue'] = (float) Subscription::where('status', 'active')
                    ->where('paid_at', '>=', now()->startOfMonth())
                    ->sum('payment_amount') ?: 0.00;
            } catch (\Exception $e) {
                \Log::warning('Failed to calculate monthly revenue: ' . $e->getMessage());
            }

            try {
                $stats['last_month_revenue'] = (float) Subscription::where('status', 'active')
                    ->where('paid_at', '>=', now()->subMonth()->startOfMonth())
                    ->where('paid_at', '<', now()->startOfMonth())
                    ->sum('payment_amount') ?: 0.00;
            } catch (\Exception $e) {
                \Log::warning('Failed to calculate last month revenue: ' . $e->getMessage());
            }

            try {
                $stats['total_revenue'] = (float) Subscription::where('status', 'active')
                    ->sum('payment_amount') ?: 0.00;
            } catch (\Exception $e) {
                \Log::warning('Failed to calculate total revenue: ' . $e->getMessage());
            }

            try {
                $stats['conversion_rate'] = $this->calculateConversionRate();
            } catch (\Exception $e) {
                \Log::warning('Failed to calculate conversion rate: ' . $e->getMessage());
            }

            return $this->successResponse($stats, 'Billing statistics retrieved successfully');
        } catch (\Exception $e) {
            \Log::error('getBillingStats failed: ' . $e->getMessage());
            // Return default stats instead of error to prevent frontend loading loops
            $defaultStats = [
                'active_subscriptions' => 0,
                'pending_payments' => 0,
                'expiring_soon' => 0,
                'monthly_revenue' => 0.00,
                'last_month_revenue' => 0.00,
                'total_revenue' => 0.00,
                'conversion_rate' => 0.0,
            ];
            return $this->successResponse($defaultStats, 'Billing statistics retrieved with defaults due to errors');
        }
    }

    /**
     * Get all subscriptions for admin management
     */
    public function getAllSubscriptions(Request $request): JsonResponse
    {
        try {
            // Validate pagination parameters
            $perPage = max(1, min(100, (int) $request->get('per_page', 15)));
            
            $subscriptions = Subscription::with(['user', 'plan'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return $this->paginatedResponse($subscriptions, 'Subscriptions retrieved successfully');
        } catch (\Exception $e) {
            \Log::error('getAllSubscriptions failed: ' . $e->getMessage());
            // Return empty paginated response instead of error to prevent frontend loading loops
            $emptyPagination = new \Illuminate\Pagination\LengthAwarePaginator(
                collect([]),
                0,
                $request->get('per_page', 15),
                1,
                ['path' => $request->url()]
            );
            return $this->paginatedResponse($emptyPagination, 'Subscriptions retrieved with empty result due to errors');
        }
    }

    /**
     * Create a new plan
     */
    public function createPlan(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'currency' => 'required|string|size:3',
            'duration_days' => 'required|integer|min:1',
            'max_domains' => 'required|integer|min:1',
            'max_senders_per_domain' => 'required|integer|min:1',
            'max_total_campaigns' => 'required|integer|min:1',
            'max_live_campaigns' => 'required|integer|min:1',
            'daily_sending_limit' => 'required|integer|min:1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        try {
            $plan = Plan::create($request->all());

            return $this->successResponse($plan, 'Plan created successfully', 201);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to create plan', 500);
        }
    }

    /**
     * Update a plan
     */
    public function updatePlan(Request $request, Plan $plan): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'duration_days' => 'sometimes|integer|min:1',
            'max_domains' => 'sometimes|integer|min:1',
            'max_senders_per_domain' => 'sometimes|integer|min:1',
            'max_total_campaigns' => 'sometimes|integer|min:1',
            'max_live_campaigns' => 'sometimes|integer|min:1',
            'daily_sending_limit' => 'sometimes|integer|min:1',
            'features' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        try {
            $plan->update($request->all());

            return $this->successResponse($plan->fresh(), 'Plan updated successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update plan', 500);
        }
    }

    /**
     * Delete a plan
     */
    public function deletePlan(Plan $plan): JsonResponse
    {
        try {
            // Check if plan has active subscriptions
            $activeSubscriptions = Subscription::where('plan_id', $plan->id)
                ->where('status', 'active')
                ->count();

            if ($activeSubscriptions > 0) {
                return $this->errorResponse('Cannot delete plan with active subscriptions', 400);
            }

            $plan->delete();

            return $this->successResponse(null, 'Plan deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to delete plan', 500);
        }
    }

    /**
     * Process manual payment for subscription
     */
    public function processManualPayment(Request $request, Subscription $subscription): JsonResponse
    {
        $validated = $request->validate([
            'payment_method' => 'required|string',
            // Make reference optional; we will auto-generate if missing
            'payment_reference' => 'nullable|string',
            'amount_paid' => 'required|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'notes' => 'nullable|string',
        ]);

        try {
            // Auto-generate a unique payment reference if not provided
            if (empty($validated['payment_reference'])) {
                // Example format: TOPUP-YYYYMMDDHHMMSS-<subscriptionId>-<random>
                $validated['payment_reference'] = sprintf(
                    'TOPUP-%s-%d-%s',
                    now()->format('YmdHis'),
                    $subscription->id,
                    substr(bin2hex(random_bytes(4)), 0, 8)
                );
            }

            $result = $this->traitProcessManualPayment($subscription, $validated);

            if (!empty($result['success'])) {
                return $this->successResponse($subscription->fresh(['user', 'plan']), 'Manual payment processed successfully');
            }

            return $this->errorResponse($result['error'] ?? 'Failed to process manual payment', 400);
        } catch (\Exception $e) {
            Log::error('Manual payment processing error', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
            ]);
            return $this->errorResponse('Failed to process manual payment', 500);
        }
    }

    /**
     * Calculate conversion rate
     */
    private function calculateConversionRate(): float
    {
        $totalUsers = User::count();
        $activeSubscriptions = Subscription::where('status', 'active')->count();

        if ($totalUsers === 0) {
            return 0.0;
        }

        return round(($activeSubscriptions / $totalUsers) * 100, 1);
    }

    /**
     * Create BTCPay subscription
     */
    private function createBTCPaySubscription(User $user, Plan $plan): array
    {
        try {
            // Create subscription record
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'plan_name' => $plan->name,
                'status' => 'pending',
                'starts_at' => now(),
                'ends_at' => now()->addDays($plan->duration_days),
                'expiry' => now()->addDays($plan->duration_days),
            ]);

            // Create BTCPay invoice (if BTCPay is configured)
            $invoiceResult = $this->createBTCPaySubscriptionInvoice($subscription);

            if ($invoiceResult['success']) {
                // Update subscription with payment details
                $subscription->update([
                    'payment_id' => $invoiceResult['data']['invoice_id'] ?? null,
                ]);

                return [
                    'success' => true,
                    'subscription_id' => $subscription->id,
                    'invoice_url' => $invoiceResult['data']['invoice_url'] ?? null,
                    'invoice_id' => $invoiceResult['data']['invoice_id'] ?? null,
                ];
            }

            // If BTCPay invoice creation fails, subscription still created but marked as pending
            return [
                'success' => true,
                'subscription_id' => $subscription->id,
                'warning' => 'Subscription created but payment invoice generation failed',
            ];

        } catch (\Exception $e) {
            \Log::error('createBTCPaySubscription failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to create subscription: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Create BTCPay invoice for subscription
     */
    private function createBTCPaySubscriptionInvoice(Subscription $subscription): array
    {
        try {
            // Check if BTCPay is configured
            $btcpayUrl = SystemConfig::get('BTCPAY_BASE_URL');
            $apiKey = SystemConfig::get('BTCPAY_API_KEY');
            $storeId = SystemConfig::get('BTCPAY_STORE_ID');

            if (!$btcpayUrl || !$apiKey || !$storeId) {
                return [
                    'success' => false,
                    'error' => 'BTCPay not configured properly',
                ];
            }

            // Create BTCPay invoice
            $invoiceData = [
                'amount' => $subscription->plan->price,
                'currency' => $subscription->plan->currency,
                'orderId' => 'subscription_' . $subscription->id,
                'itemDesc' => $subscription->plan->name . ' Subscription',
                'notificationURL' => url('/api/btcpay/webhook'),
                'redirectURL' => url('/billing?payment=success'),
                'buyer' => [
                    'email' => $subscription->user->email,
                    'name' => $subscription->user->name,
                ]
            ];

            // TODO: Implement actual BTCPay API call here
            // For now, return success with dummy data
            return [
                'success' => true,
                'data' => [
                    'invoice_id' => 'dummy_invoice_' . $subscription->id,
                    'invoice_url' => $btcpayUrl . '/invoice/dummy_' . $subscription->id,
                ]
            ];

        } catch (\Exception $e) {
            \Log::error('createBTCPaySubscriptionInvoice failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to create BTCPay invoice: ' . $e->getMessage(),
            ];
        }
    }
}
