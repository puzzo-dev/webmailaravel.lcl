<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\Plan;
use App\Models\User;
use App\Traits\BillingTrait;
use App\Traits\ResponseTrait;
use App\Traits\LoggingTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BillingController extends Controller
{
    use BillingTrait, ResponseTrait, LoggingTrait;

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
        $payload = $request->all();
        $signature = $request->header('BTCPay-Sig') ?? $request->header('X-BTCPay-Signature') ?? '';
        
        $result = $this->processBTCPayWebhook($payload, $signature);

        if ($result['success']) {
            return $this->successResponse(null, 'Webhook processed successfully');
        }

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
            $stats = [
                'active_subscriptions' => Subscription::where('status', 'active')->count(),
                'pending_payments' => Subscription::where('status', 'pending')->count(),
                'expiring_soon' => Subscription::where('status', 'active')
                    ->where('expiry', '<=', now()->addDays(7))
                    ->count(),
                'monthly_revenue' => Subscription::where('status', 'active')
                    ->where('paid_at', '>=', now()->startOfMonth())
                    ->sum('payment_amount'),
                'last_month_revenue' => Subscription::where('status', 'active')
                    ->where('paid_at', '>=', now()->subMonth()->startOfMonth())
                    ->where('paid_at', '<', now()->startOfMonth())
                    ->sum('payment_amount'),
                'total_revenue' => Subscription::where('status', 'active')->sum('payment_amount'),
                'conversion_rate' => $this->calculateConversionRate(),
            ];

            return $this->successResponse($stats, 'Billing statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve billing statistics', 500);
        }
    }

    /**
     * Get all subscriptions for admin management
     */
    public function getAllSubscriptions(Request $request): JsonResponse
    {
        try {
            $subscriptions = Subscription::with(['user', 'plan'])
                ->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 15));

            return $this->paginatedResponse($subscriptions, 'Subscriptions retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve subscriptions', 500);
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
        $request->validate([
            'payment_method' => 'required|string',
            'payment_reference' => 'required|string',
            'amount_paid' => 'required|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'notes' => 'nullable|string',
        ]);

        try {
            $result = $this->processManualPayment($subscription, $request->all());

            if ($result['success']) {
                return $this->successResponse($subscription->fresh(['user', 'plan']), 'Manual payment processed successfully');
            }

            return $this->errorResponse($result['error'] ?? 'Failed to process manual payment', 400);
        } catch (\Exception $e) {
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
}
