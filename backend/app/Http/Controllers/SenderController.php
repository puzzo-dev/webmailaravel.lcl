<?php

namespace App\Http\Controllers;

use App\Models\Sender;
use App\Models\SmtpConfig;
use App\Mail\TestEmail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class SenderController extends Controller
{
    public function __construct()
    {
        // No parent constructor to call for base Controller
    }

    /**
     * Display a listing of the resource
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeControllerMethod(function () use ($request) {
            $query = Sender::where('user_id', Auth::id())
                ->with(['domain', 'domain.smtpConfig'])
                ->orderBy('created_at', 'desc');

            return $this->getPaginatedResults($query, $request, 'senders', ['domain', 'domain.smtpConfig']);
        }, 'list_senders');
    }

    /**
     * Store a newly created resource
     */
    public function store(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'domain_id' => 'required|exists:domains,id',
                'is_active' => 'boolean'
            ],
            function () use ($request) {
                $data = $request->input('validated_data');
                $data['user_id'] = Auth::id();

                $sender = Sender::create($data);
                
                return $this->createdResponse(
                    $sender->load(['domain', 'domain.smtpConfig']), 
                    'Sender created successfully'
                );
            },
            'create_sender',
            ['email' => $request->email]
        );
    }

    /**
     * Display the specified resource
     */
    public function show(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $sender = Sender::with(['domain', 'domain.smtpConfig'])->findOrFail($id);
            
            if ($sender->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }
            
            return $this->getResource($sender, 'sender', $id);
        }, 'view_sender');
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            $sender = Sender::findOrFail($id);
            
            if ($sender->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|max:255',
                'domain_id' => 'sometimes|exists:domains,id',
                'is_active' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $sender->update($validator->validated());
            return $this->successResponse($sender->load(['domain', 'domain.smtpConfig']), 'Sender updated successfully');
        }, 'update_sender');
    }

    /**
     * Remove the specified resource
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $sender = Sender::findOrFail($id);
            
            if ($sender->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $sender->delete();
            return $this->successResponse(null, 'Sender deleted successfully');
        }, 'delete_sender');
    }

    /**
     * Test sender connection
     */
    public function testConnection(Request $request, Sender $sender): JsonResponse
    {
        return $this->validateAuthorizeAndExecute(
            $request,
            [
                'test_email' => 'required|email'
            ],
            function () use ($sender) {
                if ($sender->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                    return $this->forbiddenResponse('Access denied');
                }
                return null;
            },
            function () use ($request, $sender) {
                $testEmail = $request->input('validated_data')['test_email'];
                
                $result = $this->callExternalService(
                    function () use ($sender, $testEmail) {
                        return $this->testSmtpConfig($sender->domain->smtpConfig, $sender, $testEmail);
                    },
                    'SMTP',
                    'test_connection',
                    ['sender_id' => $sender->id, 'test_email' => $testEmail]
                );

                if ($result['success']) {
                    return $this->actionResponse($result, 'Sender test completed successfully');
                } else {
                    return $this->errorResponse('Sender test failed', $result['error']);
                }
            },
            'test_sender',
            ['sender_id' => $sender->id]
        );
    }

    /**
     * Test SMTP configuration
     */
    protected function testSmtpConfig(SmtpConfig $smtpConfig, Sender $sender, string $testEmail): array
    {
        try {
            // Configure mail settings
            config([
                'mail.mailers.smtp.host' => $smtpConfig->host,
                'mail.mailers.smtp.port' => $smtpConfig->port,
                'mail.mailers.smtp.username' => $smtpConfig->username,
                'mail.mailers.smtp.password' => $smtpConfig->password,
                'mail.mailers.smtp.encryption' => $smtpConfig->encryption,
                'mail.from.address' => $sender->email,
                'mail.from.name' => $sender->name,
            ]);

            // Send test email
            Mail::to($testEmail)->send(new TestEmail($sender));

            return [
                'success' => true,
                'message' => 'Test email sent successfully',
                'sender' => $sender->email,
                'test_email' => $testEmail
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'sender' => $sender->email,
                'test_email' => $testEmail
            ];
        }
    }
}