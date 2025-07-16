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
        $userId = Auth::id();
        
        // Admin can view any user's payment history
        if (Auth::user()->hasRole('admin') && $request->has('user_id')) {
            $userId = $request->user_id;
        }

        $payments = $this->getBTCPayPaymentHistory($userId);

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
        $result = $this->handleBTCPayWebhook($request->all());

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
        $plans = Plan::where('is_active', true)
            ->orderBy('price')
            ->get();

        return $this->successResponse($plans, 'Plans retrieved successfully');
    }

    /**
     * Get payment rates and configuration
     */
    public function rates(): JsonResponse
    {
        $rates = $this->getBTCPayRates();

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
}
