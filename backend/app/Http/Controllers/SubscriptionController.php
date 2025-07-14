<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\Plan;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class SubscriptionController extends BaseController
{
    public function __construct(
        private BillingService $billingService
    ) {}

    /**
     * Display a listing of the resource
     */
    public function index(): JsonResponse
    {
        return $this->executeControllerMethod(function () {
            $query = Subscription::where('user_id', Auth::id())
                ->with(['plan', 'user'])
                ->orderBy('created_at', 'desc');

            return $this->getPaginatedResults($query, request(), 'subscriptions', ['plan', 'user']);
        }, 'list_subscriptions');
    }

    /**
     * Store a newly created resource
     */
    public function store(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'plan_id' => 'required|exists:plans,id',
            ],
            function () use ($request) {
                $plan = Plan::findOrFail($request->plan_id);
                $user = Auth::user();

                // Check if user already has an active subscription
                $activeSubscription = Subscription::where('user_id', $user->id)
                    ->where('status', 'active')
                    ->first();

                if ($activeSubscription) {
                    return $this->conflictResponse('User already has an active subscription');
                }

                // Create subscription via BTCPay
                $subscriptionData = $this->billingService->createSubscription($user, $plan);

                return $this->createdResponse($subscriptionData, 'Subscription created successfully');
            },
            'create_subscription'
        );
    }

    /**
     * Display the specified resource
     */
    public function show(string $id): JsonResponse
    {
        return $this->executeControllerMethod(function () use ($id) {
            $subscription = Subscription::where('user_id', Auth::id())
                ->with(['plan', 'user'])
                ->findOrFail($id);

            return $this->getResource($subscription, 'subscription', $id);
        }, 'view_subscription');
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'status' => 'sometimes|string|in:active,inactive,cancelled',
                'amount' => 'sometimes|numeric|min:0',
                'currency' => 'sometimes|string|size:3',
            ],
            function () use ($request, $id) {
                $subscription = Subscription::where('user_id', Auth::id())->findOrFail($id);
                $subscription->update($request->validated());

                return $this->updateResponse($subscription->load(['plan', 'user']), 'Subscription updated successfully');
            },
            'update_subscription'
        );
    }

    /**
     * Remove the specified resource
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->executeControllerMethod(function () use ($id) {
            $subscription = Subscription::where('user_id', Auth::id())->findOrFail($id);
            $subscription->delete();

            return $this->deleteResponse('Subscription deleted successfully');
        }, 'delete_subscription');
    }

    /**
     * Cancel subscription
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'reason' => 'nullable|string|max:500'
            ],
            function () use ($request, $id) {
                $subscription = Subscription::where('user_id', Auth::id())->findOrFail($id);
                
                $result = $this->billingService->cancelSubscription($subscription, $request->input('reason'));

                if ($result['success']) {
                    return $this->actionResponse($subscription, 'Subscription cancelled successfully');
                }

                return $this->errorResponse('Failed to cancel subscription', $result['error']);
            },
            'cancel_subscription'
        );
    }

    /**
     * Renew subscription
     */
    public function renew(Request $request, string $id): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'plan_id' => 'sometimes|exists:plans,id'
            ],
            function () use ($request, $id) {
                $subscription = Subscription::where('user_id', Auth::id())->findOrFail($id);
                
                $planId = $request->input('plan_id');
                if ($planId) {
                    $plan = Plan::findOrFail($planId);
                    $subscription->plan_id = $plan->id;
                }

                $result = $this->billingService->renewSubscription($subscription);

                if ($result['success']) {
                    return $this->actionResponse($subscription, 'Subscription renewed successfully');
                }

                return $this->errorResponse('Failed to renew subscription', $result['error']);
            },
            'renew_subscription'
        );
    }

    /**
     * Get subscription statistics
     */
    public function statistics(): JsonResponse
    {
        return $this->executeControllerMethod(function () {
            $stats = [
                'total_subscriptions' => Subscription::where('user_id', Auth::id())->count(),
                'active_subscriptions' => Subscription::where('user_id', Auth::id())->where('status', 'active')->count(),
                'total_spent' => Subscription::where('user_id', Auth::id())->sum('amount'),
                'monthly_revenue' => Subscription::where('user_id', Auth::id())
                    ->where('status', 'active')
                    ->whereMonth('created_at', now()->month)
                    ->sum('amount')
            ];

            return $this->successResponse($stats, 'Subscription statistics retrieved successfully');
        }, 'view_subscription_statistics');
    }

    /**
     * Get payment history
     */
    public function paymentHistory(string $id): JsonResponse
    {
        return $this->executeControllerMethod(function () use ($id) {
            $subscription = Subscription::where('user_id', Auth::id())->findOrFail($id);
            
            $payments = $this->billingService->getPaymentHistory($subscription);

            return $this->successResponse($payments, 'Payment history retrieved successfully');
        }, 'view_payment_history');
    }

    /**
     * Process payment webhook
     */
    public function processPaymentWebhook(Request $request): JsonResponse
    {
        return $this->executeControllerMethod(function () use ($request) {
            $result = $this->billingService->processPaymentWebhook($request->all());

            if ($result['success']) {
                return $this->successResponse($result['data'], 'Payment processed successfully');
            }

            return $this->errorResponse('Payment processing failed', $result['error']);
        }, 'process_payment_webhook');
    }

    /**
     * Get available plans
     */
    public function getPlans(): JsonResponse
    {
        return $this->executeControllerMethod(function () {
            $plans = Plan::where('is_active', true)
                ->orderBy('price')
                ->get();

            return $this->successResponse($plans, 'Available plans retrieved successfully');
        }, 'get_plans');
    }

    /**
     * Compare plans
     */
    public function comparePlans(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'plan_ids' => 'required|array',
                'plan_ids.*' => 'exists:plans,id'
            ],
            function () use ($request) {
                $planIds = $request->input('plan_ids');
                $plans = Plan::whereIn('id', $planIds)->get();

                $comparison = $this->billingService->comparePlans($plans);

                return $this->successResponse($comparison, 'Plan comparison retrieved successfully');
            },
            'compare_plans'
        );
    }
}
