<?php

namespace App\Http\Controllers;

use App\Models\Sender;
use App\Models\SmtpConfig;
use App\Mail\TestEmail;
use App\Services\CampaignService;
use App\Traits\ResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class SenderController extends Controller
{
    use ResponseTrait;
    
    protected $campaignService;
    
    public function __construct(CampaignService $campaignService)
    {
        $this->campaignService = $campaignService;
    }

    /**
     * Display a listing of the resource
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $perPage = $request->input('per_page', 15);
            $page = $request->input('page', 1);
            
            // Check if user is admin
            if (Auth::user()->hasRole('admin')) {
                // Admin sees all senders
                $query = Sender::with(['domain', 'domain.smtpConfig', 'user']);
                $results = $query->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);
            } else {
                // Regular users see only their senders
                $query = Sender::with(['domain', 'domain.smtpConfig'])
                    ->where('user_id', Auth::id());
                $results = $query->paginate($perPage, ['*'], 'page', $page);
            }
            
            // Add calculated statistics to each sender
            $results->getCollection()->transform(function ($sender) {
                $senderArray = $sender->toArray();
                
                // Get calculated statistics
                try {
                    $stats = $this->campaignService->getSenderStatistics($sender->id);
                    $senderArray['statistics'] = $stats;
                } catch (\Exception $e) {
                    // If statistics calculation fails, provide default values
                    $senderArray['statistics'] = [
                        'total_sent' => 0,
                        'total_delivered' => 0,
                        'success_rate' => 0,
                        'open_rate' => 0,
                        'click_rate' => 0,
                        'campaigns_count' => 0,
                    ];
                }
                
                return $senderArray;
            });
            
            if (Auth::user()->hasRole('admin')) {
                return $this->paginatedResponse($results, 'All senders retrieved successfully');
            } else {
                return $this->paginatedResponse($results, 'Senders retrieved successfully');
            }
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
                $user = Auth::user();
                $data = $request->input('validated_data');
                
                // Check if domain belongs to user
                $domain = \App\Models\Domain::findOrFail($data['domain_id']);
                if ($domain->user_id !== Auth::id() && !$user->hasRole('admin')) {
                    return $this->forbiddenResponse('You can only add senders to your own domains');
                }
                
                // Check if domain can have more senders (5 per domain limit)
                if (!$user->canAddSenderToDomain($domain)) {
                    $limits = $user->getPlanLimits();
                    return $this->errorResponse(
                        'Sender limit reached for this domain. Each domain allows ' . $limits['max_senders_per_domain'] . ' senders maximum.',
                        422
                    );
                }
                
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
            
            return $this->successResponse($sender, 'Sender retrieved successfully');
        }, 'view_sender');
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            $sender = Sender::findOrFail($id);
            
            // Admin can update any sender, regular users can only update their own
            if (!Auth::user()->hasRole('admin') && $sender->user_id !== Auth::id()) {
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
     * Update sender (admin functionality)
     */
    public function updateSender(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }
            
            $sender = Sender::findOrFail($id);
            
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
     * Update multiple senders with common data (admin functionality)
     */
    public function updateSenders(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }
            
            $validator = Validator::make($request->all(), [
                'sender_ids' => 'required|array',
                'sender_ids.*' => 'exists:senders,id',
                'is_active' => 'sometimes|boolean'
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $senderIds = $request->input('sender_ids');
            $updateData = $request->only(['is_active']);
            $updatedCount = Sender::whereIn('id', $senderIds)->update($updateData);
            
            return $this->successResponse([
                'updated_count' => $updatedCount,
                'sender_ids' => $senderIds
            ], "Successfully updated {$updatedCount} senders");
        }, 'update_senders');
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
        return $this->validateAndExecute(
            $request,
            [
                'test_email' => 'required|email'
            ],
            function () use ($request, $sender) {
                if ($sender->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                    return $this->forbiddenResponse('Access denied');
                }
                
                $testEmail = $request->input('validated_data')['test_email'];
                
                $result = $this->testSmtpConfig($sender->domain->smtpConfig, $sender, $testEmail);

                if ($result['success']) {
                    return $this->successResponse($result, 'Sender test completed successfully');
                } else {
                    return $this->errorResponse($result['error'], 400);
                }
            },
            'test_sender'
        );
    }

    /**
     * Test SMTP configuration
     */
    protected function testSmtpConfig(SmtpConfig $smtpConfig, Sender $sender, string $testEmail): array
    {
        try {
            // Store original mail configuration
            $originalConfig = config('mail');
            
            // Set the mail configuration for this specific test
            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp' => [
                    'transport' => 'smtp',
                    'host' => $smtpConfig->host,
                    'port' => $smtpConfig->port,
                    'username' => $smtpConfig->username,
                    'password' => $smtpConfig->password,
                    'encryption' => $smtpConfig->encryption,
                    'timeout' => 30,
                    'local_domain' => $smtpConfig->host,
                ],
                'mail.from.address' => $sender->email,
                'mail.from.name' => $sender->name,
            ]);

            // Clear the mail manager cache to force reload of configuration
            app('mail.manager')->purge('smtp');

            // Send test email
            Mail::to($testEmail)->send(new TestEmail($sender));

            // Restore original configuration
            config(['mail' => $originalConfig]);

            return [
                'success' => true,
                'message' => 'Test email sent successfully',
                'sender' => $sender->email,
                'test_email' => $testEmail,
                'smtp_config' => [
                    'host' => $smtpConfig->host,
                    'port' => $smtpConfig->port,
                    'username' => $smtpConfig->username,
                    'encryption' => $smtpConfig->encryption
                ]
            ];

        } catch (\Exception $e) {
            // Restore original configuration in case of error
            if (isset($originalConfig)) {
                config(['mail' => $originalConfig]);
            }
            
            // Get the actual error message, not the email content
            $errorMessage = $e->getMessage();
            
            // If the error message contains the email content, extract the real error
            if (str_contains($errorMessage, 'Test Email - SMTP Configuration Test')) {
                // This means Laravel is still trying to interpret the content as a view
                $errorMessage = 'Failed to send test email: Invalid email template configuration';
            }
            
            return [
                'success' => false,
                'error' => $errorMessage,
                'sender' => $sender->email,
                'test_email' => $testEmail,
                'smtp_config' => [
                    'host' => $smtpConfig->host,
                    'port' => $smtpConfig->port,
                    'username' => $smtpConfig->username,
                    'encryption' => $smtpConfig->encryption
                ]
            ];
        }
    }
}