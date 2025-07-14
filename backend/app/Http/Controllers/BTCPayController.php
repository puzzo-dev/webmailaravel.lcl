<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\BTCPayService;
use App\Services\BillingService;
use App\Services\LoggingService;
use App\Models\Subscription;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class BTCPayController extends Controller
{
    protected $btcpayService;
    protected $billingService;
    protected $loggingService;

    public function __construct(
        BTCPayService $btcpayService, 
        BillingService $billingService,
        LoggingService $loggingService
    ) {
        $this->btcpayService = $btcpayService;
        $this->billingService = $billingService;
        $this->loggingService = $loggingService;
    }

    /**
     * Create a new payment invoice
     */
    public function createInvoice(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'plan_id' => 'required|exists:plans,id',
                'amount' => 'required|numeric|min:0.01',
                'currency' => 'nullable|string|size:3'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $plan = Plan::find($request->input('plan_id'));
            $user = auth()->user();

            // Create or get subscription
            $subscription = Subscription::firstOrCreate([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'status' => 'pending'
            ], [
                'start_date' => now(),
                'end_date' => now()->addDays($plan->duration_days)
            ]);

            // Create BTCPay invoice
            $result = $this->btcpayService->createSubscriptionInvoice($subscription);

            if ($result['success']) {
                $this->loggingService->log('btcpay.invoice.created', [
                    'user_id' => $user->id,
                    'subscription_id' => $subscription->id,
                    'plan_id' => $plan->id,
                    'amount' => $result['amount'],
                    'invoice_id' => $result['invoice_id'],
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'success' => true,
                    'data' => [
                        'invoice_id' => $result['invoice_id'],
                        'payment_url' => $result['payment_url'],
                        'amount' => $result['amount'],
                        'currency' => $result['currency'],
                        'expires_at' => $result['expires_at']
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to create invoice',
                'error' => $result['error']
            ], 500);
        } catch (\Exception $e) {
            $this->loggingService->log('btcpay.invoice.error', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create manual subscription (cash payment)
     */
    public function createManualSubscription(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'plan_id' => 'required|exists:plans,id',
                'payment_method' => 'required|string|in:cash,bank_transfer,check,paypal,other',
                'payment_reference' => 'nullable|string|max:255',
                'amount_paid' => 'required|numeric|min:0.01',
                'currency' => 'nullable|string|size:3',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $plan = Plan::find($request->input('plan_id'));
            $user = auth()->user();

            $paymentDetails = [
                'payment_method' => $request->input('payment_method'),
                'payment_reference' => $request->input('payment_reference'),
                'amount_paid' => $request->input('amount_paid'),
                'currency' => $request->input('currency', 'USD'),
                'notes' => $request->input('notes')
            ];

            $result = $this->billingService->createManualSubscription($user, $plan, $paymentDetails);

            if ($result['success']) {
                $this->loggingService->log('manual.subscription.created', [
                    'user_id' => $user->id,
                    'subscription_id' => $result['subscription_id'],
                    'plan_id' => $plan->id,
                    'payment_method' => $paymentDetails['payment_method'],
                    'amount_paid' => $paymentDetails['amount_paid'],
                    'processed_by' => auth()->id(),
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'success' => true,
                    'data' => [
                        'subscription_id' => $result['subscription_id'],
                        'message' => $result['message']
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to create manual subscription',
                'error' => $result['error']
            ], 500);
        } catch (\Exception $e) {
            $this->loggingService->log('manual.subscription.error', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process manual payment for existing subscription
     */
    public function processManualPayment(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'subscription_id' => 'required|exists:subscriptions,id',
                'payment_method' => 'required|string|in:cash,bank_transfer,check,paypal,other',
                'payment_reference' => 'nullable|string|max:255',
                'amount_paid' => 'required|numeric|min:0.01',
                'currency' => 'nullable|string|size:3',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $subscription = Subscription::findOrFail($request->input('subscription_id'));
            
            // Check if user has permission to process this subscription
            if ($subscription->user_id !== auth()->id() && !auth()->user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to process this subscription'
                ], 403);
            }

            $paymentDetails = [
                'payment_method' => $request->input('payment_method'),
                'payment_reference' => $request->input('payment_reference'),
                'amount_paid' => $request->input('amount_paid'),
                'currency' => $request->input('currency', 'USD'),
                'notes' => $request->input('notes')
            ];

            $result = $this->billingService->processManualPayment($subscription, $paymentDetails);

            if ($result['success']) {
                $this->loggingService->log('manual.payment.processed', [
                    'subscription_id' => $subscription->id,
                    'user_id' => $subscription->user_id,
                    'payment_method' => $paymentDetails['payment_method'],
                    'amount_paid' => $paymentDetails['amount_paid'],
                    'processed_by' => auth()->id(),
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'success' => true,
                    'data' => [
                        'message' => $result['message']
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to process manual payment',
                'error' => $result['error']
            ], 500);
        } catch (\Exception $e) {
            $this->loggingService->log('manual.payment.error', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get manual payment methods
     */
    public function getManualPaymentMethods(Request $request): JsonResponse
    {
        try {
            $methods = $this->billingService->getManualPaymentMethods();

            return response()->json([
                'success' => true,
                'data' => $methods
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get payment methods',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get invoice status
     */
    public function getInvoiceStatus(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'invoice_id' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $invoiceId = $request->input('invoice_id');
            $result = $this->btcpayService->getInvoice($invoiceId);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['data']
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to get invoice status',
                'error' => $result['error']
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payment rates
     */
    public function getPaymentRates(Request $request): JsonResponse
    {
        try {
            $result = $this->btcpayService->getPaymentRates();

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['rates']
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to get payment rates',
                'error' => $result['error']
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process BTCPay webhook
     */
    public function webhook(Request $request): JsonResponse
    {
        try {
            $payload = $request->getContent();
            $signature = $request->header('BTCPay-Sig');

            // Validate webhook signature
            if (!$this->btcpayService->validateWebhookSignature($payload, $signature)) {
                $this->loggingService->log('btcpay.webhook.invalid_signature', [
                    'ip' => $request->ip(),
                    'signature' => $signature
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid signature'
                ], 401);
            }

            $webhookData = json_decode($payload, true);
            $result = $this->btcpayService->processWebhook($webhookData);

            if ($result['success']) {
                $this->loggingService->log('btcpay.webhook.processed', [
                    'invoice_id' => $webhookData['invoiceId'] ?? null,
                    'status' => $webhookData['type'] ?? null,
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Webhook processed successfully'
                ]);
            }

            $this->loggingService->log('btcpay.webhook.error', [
                'error' => $result['error'],
                'webhook_data' => $webhookData,
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Webhook processing failed',
                'error' => $result['error']
            ], 500);
        } catch (\Exception $e) {
            $this->loggingService->log('btcpay.webhook.exception', [
                'error' => $e->getMessage(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's payment history
     */
    public function getPaymentHistory(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $result = $this->billingService->getPaymentHistory($user);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get payment history',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 