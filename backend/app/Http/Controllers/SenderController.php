<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Sender;
use App\Models\SmtpConfig;
use App\Mail\TestEmail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SenderController extends Controller
{
    public function __construct()
    {
        // No dependencies needed - using Laravel's built-in features
    }

    /**
     * Display a listing of the resource
     */
    public function index(): JsonResponse
    {
        try {
            $senders = Sender::where('user_id', Auth::id())
                ->with(['domain', 'domain.smtpConfig'])
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            Log::info('Senders listed', [
                'user_id' => Auth::id(),
                'count' => $senders->count()
            ]);

            return response()->json([
                'success' => true,
                'data' => $senders,
                'message' => 'Senders retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Senders list failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve senders'
            ], 500);
        }
    }

    /**
     * Store a newly created resource
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'domain_id' => 'required|exists:domains,id',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();
            $data['user_id'] = Auth::id();

            $sender = Sender::create($data);

            Log::info('Sender created', [
                'user_id' => Auth::id(),
                'sender_id' => $sender->id,
                'email' => $sender->email
            ]);

            return response()->json([
                'success' => true,
                'data' => $sender->load(['domain', 'domain.smtpConfig']),
                'message' => 'Sender created successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Sender creation failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create sender'
            ], 500);
        }
    }

    /**
     * Display the specified resource
     */
    public function show(Sender $sender): JsonResponse
    {
        try {
            if ($sender->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            Log::info('Sender viewed', [
                'user_id' => Auth::id(),
                'sender_id' => $sender->id
            ]);

            return response()->json([
                'success' => true,
                'data' => $sender->load(['domain', 'domain.smtpConfig']),
                'message' => 'Sender retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Sender view failed', [
                'user_id' => Auth::id(),
                'sender_id' => $sender->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sender'
            ], 500);
        }
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, Sender $sender): JsonResponse
    {
        try {
            if ($sender->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|max:255',
                'domain_id' => 'sometimes|exists:domains,id',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $sender->update($validator->validated());

            Log::info('Sender updated', [
                'user_id' => Auth::id(),
                'sender_id' => $sender->id,
                'updated_fields' => array_keys($validator->validated())
            ]);

            return response()->json([
                'success' => true,
                'data' => $sender->load(['domain', 'domain.smtpConfig']),
                'message' => 'Sender updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Sender update failed', [
                'user_id' => Auth::id(),
                'sender_id' => $sender->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update sender'
            ], 500);
        }
    }

    /**
     * Remove the specified resource
     */
    public function destroy(Sender $sender): JsonResponse
    {
        try {
            if ($sender->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            $sender->delete();

            Log::info('Sender deleted', [
                'user_id' => Auth::id(),
                'sender_id' => $sender->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Sender deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Sender deletion failed', [
                'user_id' => Auth::id(),
                'sender_id' => $sender->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete sender'
            ], 500);
        }
    }

    /**
     * Test sender configuration
     */
    public function testSender(Request $request, Sender $sender): JsonResponse
    {
        try {
            if ($sender->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'test_email' => 'required|email'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $smtpConfig = $sender->domain->smtpConfig;
            
            if (!$smtpConfig) {
                return response()->json([
                    'success' => false,
                    'message' => 'No SMTP configuration found for sender domain'
                ], 400);
            }

            $testResult = $this->testSmtpConfig($smtpConfig, $sender, $validator->validated()['test_email']);

            Log::info('Sender test completed', [
                'user_id' => Auth::id(),
                'sender_id' => $sender->id,
                'test_email' => $validator->validated()['test_email'],
                'success' => $testResult['success']
            ]);

            return response()->json([
                'success' => true,
                'data' => $testResult,
                'message' => $testResult['success'] ? 'Test email sent successfully' : 'Test email failed'
            ]);

        } catch (\Exception $e) {
            Log::error('Sender test failed', [
                'user_id' => Auth::id(),
                'sender_id' => $sender->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to test sender: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test SMTP configuration using Laravel's Mail facade
     */
    protected function testSmtpConfig(SmtpConfig $smtpConfig, Sender $sender, string $testEmail): array
    {
        try {
            // Configure mail settings for this test
            config([
                'mail.mailers.smtp.host' => $smtpConfig->host,
                'mail.mailers.smtp.port' => $smtpConfig->port,
                'mail.mailers.smtp.username' => $smtpConfig->username,
                'mail.mailers.smtp.password' => $smtpConfig->password,
                'mail.mailers.smtp.encryption' => $smtpConfig->encryption,
                'mail.from.address' => $sender->email,
                'mail.from.name' => $sender->name
            ]);

            $testData = [
                'to' => $testEmail,
                'from' => $sender->email,
                'subject' => 'Test Email from Campaign System',
                'html_body' => '<h1>Test Email</h1><p>This is a test email from the campaign system.</p><p>Sender: ' . $sender->name . '</p><p>Domain: ' . $sender->domain->domain . '</p>',
                'text_body' => "Test Email\n\nThis is a test email from the campaign system.\n\nSender: {$sender->name}\nDomain: {$sender->domain->domain}"
            ];

            // Send test email using Laravel's Mail facade
            Mail::to($testData['to'])
                ->send(new TestEmail($testData));

            return [
                'success' => true,
                'message' => 'Test email sent successfully',
                'smtp_config' => [
                    'host' => $smtpConfig->host,
                    'port' => $smtpConfig->port,
                    'encryption' => $smtpConfig->encryption
                ]
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'SMTP test failed: ' . $e->getMessage(),
                'smtp_config' => [
                    'host' => $smtpConfig->host,
                    'port' => $smtpConfig->port,
                    'encryption' => $smtpConfig->encryption
                ]
            ];
        }
    }
}