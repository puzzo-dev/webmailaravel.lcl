<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BillingController extends Controller
{
    public function __construct(
        private BillingService $billingService
    ) {}

    /**
     * Get user subscriptions
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $perPage = min((int) $request->get('per_page', 15), 100);

            return Subscription::where('user_id', Auth::id())
                ->with(['plan', 'user'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);
        }, 'list_subscriptions');
    }

    /**
     * Get specific subscription
     */
    public function show(Subscription $subscription): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($subscription) {
            $this->authorize('view', $subscription);

            return $subscription->load(['plan', 'user']);
        }, 'view_subscription');
    }

    /**
     * Create new subscription
     */
    public function store(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $request->validate([
                'plan_id' => 'required|exists:plans,id',
            ]);

            $plan = Plan::findOrFail($request->plan_id);
            $user = Auth::user();

            $activeSubscription = Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->first();

            if ($activeSubscription) {
                return $this->errorResponse('User already has an active subscription', 400);
            }

            $result = $this->billingService->createBTCPaySubscription($user, $plan);

            if (!$result['success']) {
                return $this->errorResponse($result['error'] ?? 'Failed to create subscription', 400);
            }

            return $result;
        }, 'create_subscription');
    }

    /**
     * Update subscription
     */
    public function update(Request $request, Subscription $subscription): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $subscription) {
            $this->authorize('update', $subscription);

            $request->validate([
                'plan_id' => 'sometimes|exists:plans,id',
                'status' => 'sometimes|in:active,cancelled,expired,pending',
            ]);

            if ($request->has('plan_id')) {
                $newPlan = Plan::findOrFail($request->plan_id);
                $result = $this->billingService->createBTCPaySubscription(Auth::user(), $newPlan);

                if (!$result['success']) {
                    return $this->errorResponse($result['error'] ?? 'Failed to update subscription', 400);
                }
            }

            $subscription->update($request->only(['status']));

            return $subscription->fresh(['plan', 'user']);
        }, 'update_subscription');
    }

    /**
     * Cancel subscription
     */
    public function destroy(Subscription $subscription): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($subscription) {
            $this->authorize('delete', $subscription);

            $result = $this->billingService->cancelBTCPaySubscription($subscription);

            if (!$result['success']) {
                return $this->errorResponse($result['error'] ?? 'Failed to cancel subscription', 400);
            }

            return null;
        }, 'cancel_subscription');
    }

    /**
     * Create invoice for subscription payment
     */
    public function createInvoice(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $request->validate([
                'subscription_id' => 'required|exists:subscriptions,id',
            ]);

            $subscription = Subscription::with('plan', 'user')->findOrFail($request->subscription_id);

            $this->authorize('createInvoice', $subscription);

            $result = $this->billingService->createBTCPaySubscriptionInvoice($subscription);

            if (!$result['success']) {
                return $this->errorResponse($result['error'] ?? 'Failed to create invoice', 400);
            }

            return $result['data'];
        }, 'create_invoice');
    }

    /**
     * Get payment history
     */
    public function paymentHistory(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = Auth::user();

            if ($user->hasRole('admin') && $request->has('user_id')) {
                $user = User::findOrFail($request->user_id);
            }

            return $this->billingService->getPaymentHistory($user);
        }, 'get_payment_history');
    }

    /**
     * Get invoice status
     */
    public function invoiceStatus(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $request->validate([
                'invoice_id' => 'required|string',
            ]);

            return $this->billingService->getBTCPayInvoiceStatus($request->invoice_id);
        }, 'get_invoice_status');
    }

    /**
     * Handle BTCPay webhook
     */
    public function webhook(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $payload = $request->all();
            $signature = $request->header('BTCPay-Sig') ?? $request->header('X-BTCPay-Signature') ?? '';

            $result = $this->billingService->processBTCPayWebhook($payload, $signature);

            if (!$result['success']) {
                return $this->errorResponse($result['error'] ?? 'Failed to process webhook', 400);
            }

            return null;
        }, 'process_webhook');
    }

    /**
     * Get available plans
     */
    public function plans(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            return $this->billingService->getOrCreateDefaultPlans();
        }, 'get_plans');
    }

    /**
     * Get payment rates and configuration
     */
    public function rates(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            return $this->billingService->getBTCPayPaymentRates();
        }, 'get_payment_rates');
    }

    /**
     * Renew subscription
     */
    public function renew(Request $request, Subscription $subscription): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($subscription) {
            $this->authorize('renew', $subscription);

            $result = $this->billingService->renewBTCPaySubscription($subscription);

            if (!$result['success']) {
                return $this->errorResponse($result['error'] ?? 'Failed to renew subscription', 400);
            }

            return $result['data'];
        }, 'renew_subscription');
    }

    /**
     * Get billing statistics for admin dashboard
     */
    public function getBillingStats(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            return $this->billingService->getBillingStats();
        }, 'get_billing_stats');
    }

    /**
     * Get all subscriptions for admin management
     */
    public function getAllSubscriptions(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $perPage = min(max(1, (int) $request->get('per_page', 15)), 100);

            return Subscription::with(['user', 'plan'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);
        }, 'get_all_subscriptions');
    }

    /**
     * Create a new plan (admin only)
     */
    public function createPlan(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'required|numeric|min:0',
                'currency' => 'required|string|size:3',
                'duration_days' => 'required|integer|min:1',
                
                'max_senders' => 'required|integer|min:1',
                'max_total_campaigns' => 'required|integer|min:1',
                'max_live_campaigns' => 'required|integer|min:1',
                'daily_sending_limit' => 'required|integer|min:1',
                'features' => 'nullable|array',
                'is_active' => 'boolean',
            ]);

            return $this->billingService->createPlan($validated);
        }, 'create_plan');
    }

    /**
     * Update a plan (admin only)
     */
    public function updatePlan(Request $request, Plan $plan): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $plan) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'price' => 'sometimes|numeric|min:0',
                'currency' => 'sometimes|string|size:3',
                'duration_days' => 'sometimes|integer|min:1',
                
                'max_senders' => 'sometimes|integer|min:1',
                'max_total_campaigns' => 'sometimes|integer|min:1',
                'max_live_campaigns' => 'sometimes|integer|min:1',
                'daily_sending_limit' => 'sometimes|integer|min:1',
                'features' => 'nullable|array',
                'is_active' => 'sometimes|boolean',
            ]);

            return $this->billingService->updatePlan($plan, $validated);
        }, 'update_plan');
    }

    /**
     * Delete a plan (admin only)
     */
    public function deletePlan(Plan $plan): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($plan) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $this->billingService->deletePlan($plan);

            return null;
        }, 'delete_plan');
    }

    /**
     * Process manual payment for subscription (admin only)
     */
    public function processManualPayment(Request $request, Subscription $subscription): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $subscription) {
            $this->authorize('processManualPayment', $subscription);

            $validated = $request->validate([
                'payment_method' => 'required|string',
                'payment_reference' => 'required|string',
                'amount_paid' => 'required|numeric|min:0',
                'currency' => 'sometimes|string|size:3',
                'notes' => 'nullable|string',
            ]);

            $result = $this->billingService->processSubscriptionManualPayment($subscription, $validated);

            if (!$result['success']) {
                return $this->errorResponse($result['error'] ?? 'Failed to process manual payment', 400);
            }

            return $subscription->fresh(['user', 'plan']);
        }, 'process_manual_payment');
    }
}
