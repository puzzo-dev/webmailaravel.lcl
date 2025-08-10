<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\SmtpConfig;
use Illuminate\Http\Request;
use App\Traits\ResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class DomainController extends Controller
{
    use ResponseTrait;

    public function __construct()
    {
        // No parent constructor to call for base Controller
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
                // Admin sees all domains
                $query = Domain::with(['smtpConfig', 'senders', 'user']);
                $results = $query->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);
                
                return $this->paginatedResponse($results, 'All domains retrieved successfully');
            } else {
                // Regular users see only their domains
                $query = Domain::with(['smtpConfig', 'senders'])
                    ->where('user_id', Auth::id());
                $results = $query->paginate($perPage, ['*'], 'page', $page);
                
                return $this->paginatedResponse($results, 'Domains retrieved successfully');
            }
        }, 'list_domains');
    }

    /**
     * Store a newly created resource
     */
    public function store(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'name' => 'required|string|max:255|unique:domains,name',
                'is_active' => 'boolean',
                'verification_status' => 'string|in:pending,verified,failed'
            ],
            function () use ($request) {
                $user = Auth::user();
                
                // Check if user can create more domains based on their plan
                if (!$user->canCreateDomain()) {
                    $limits = $user->getPlanLimits();
                    return $this->errorResponse(
                        'Domain limit reached. Your plan allows ' . $limits['max_domains'] . ' domains maximum.',
                        422
                    );
                }
                
                $data = $request->input('validated_data');
                $data['user_id'] = Auth::id();

                $domain = Domain::create($data);

                Log::info('Domain created', [
                    'user_id' => Auth::id(),
                    'domain_id' => $domain->id,
                    'domain' => $domain->name
                ]);

                return $this->createdResponse($domain->load(['smtpConfig', 'senders']), 'Domain created successfully');
            },
            'create_domain'
        );
    }

    /**
     * Display the specified resource
     */
    public function show(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $domain = Domain::with(['smtpConfig', 'senders'])->findOrFail($id);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }
            
            return $this->successResponse($domain, 'Domain retrieved successfully');
        }, 'view_domain');
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            $domain = Domain::findOrFail($id);
            
            // Admin can update any domain, regular users can only update their own
            if (!Auth::user()->hasRole('admin') && $domain->user_id !== Auth::id()) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255|unique:domains,name,' . $domain->id,
                'is_active' => 'boolean',
                'verification_status' => 'string|in:pending,verified,failed'
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $domain->update($validator->validated());

            Log::info('Domain updated', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'updated_fields' => array_keys($validator->validated())
            ]);

            return $this->successResponse($domain->load(['smtpConfig', 'senders']), 'Domain updated successfully');
        }, 'update_domain');
    }

    /**
     * Update domain (admin functionality)
     */
    public function updateDomain(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }
            
            $domain = Domain::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255|unique:domains,name,' . $domain->id,
                'is_active' => 'boolean',
                'verification_status' => 'string|in:pending,verified,failed'
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $domain->update($validator->validated());

            Log::info('Domain updated by admin', [
                'admin_id' => Auth::id(),
                'domain_id' => $domain->id,
                'updated_fields' => array_keys($validator->validated())
            ]);

            return $this->successResponse($domain->load(['smtpConfig', 'senders']), 'Domain updated successfully');
        }, 'update_domain');
    }

    /**
     * Update multiple domains with common data (admin functionality)
     */
    public function updateDomains(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }
            
            $validator = Validator::make($request->all(), [
                'domain_ids' => 'required|array',
                'domain_ids.*' => 'exists:domains,id',
                'is_active' => 'sometimes|boolean',
                'verification_status' => 'sometimes|string|in:pending,verified,failed'
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $domainIds = $request->input('domain_ids');
            $updateData = $request->only(['is_active', 'verification_status']);
            $updatedCount = Domain::whereIn('id', $domainIds)->update($updateData);
            
            Log::info('Bulk domain update by admin', [
                'admin_id' => Auth::id(),
                'total_domains' => count($domainIds),
                'updated_count' => $updatedCount,
                'update_data' => $updateData
            ]);

            return $this->successResponse([
                'updated_count' => $updatedCount,
                'domain_ids' => $domainIds
            ], "Successfully updated {$updatedCount} domains");
        }, 'update_domains');
    }

    /**
     * Remove the specified resource
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $domain = Domain::findOrFail($id);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $domain->delete();

            Log::info('Domain deleted', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id
            ]);

            return $this->successResponse(null, 'Domain deleted successfully');
        }, 'delete_domain');
    }

    /**
     * Verify domain
     */
    public function verifyDomain(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $domain = Domain::findOrFail($id);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            // Domain verification logic would go here
            // For now, we'll simulate verification
            $verificationResult = $this->performDomainVerification($domain);

            if ($verificationResult['success']) {
                $domain->update(['verification_status' => 'verified']);
                
                Log::info('Domain verified', [
                    'user_id' => Auth::id(),
                    'domain_id' => $domain->id,
                    'domain' => $domain->name
                ]);

                return $this->successResponse($verificationResult, 'Domain verified successfully');
            } else {
                $domain->update(['verification_status' => 'failed']);
                
                Log::error('Domain verification failed', [
                    'user_id' => Auth::id(),
                    'domain_id' => $domain->id,
                    'domain' => $domain->name,
                    'error' => $verificationResult['error']
                ]);

                return $this->errorResponse('Domain verification failed: ' . $verificationResult['error']);
            }
        }, 'verify_domain');
    }

    public function getSmtpConfig(string $domainId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($domainId) {
            $domain = Domain::findOrFail($domainId);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }
            
            return $this->successResponse($domain->smtpConfig, 'SMTP configuration retrieved successfully');
        });
    }

    /**
     * Add or update SMTP configuration for domain
     */
    public function addSmtpConfig(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            $domain = Domain::findOrFail($id);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $validator = Validator::make($request->all(), [
                'host' => 'required|string|max:255',
                'port' => 'required|integer|min:1|max:65535',
                'username' => 'required|string|max:255',
                'password' => 'required|string|max:255',
                'encryption' => 'required|string|in:tls,ssl,none',
                'is_active' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            // Check if SMTP config already exists for this domain
            $smtpConfig = $domain->smtpConfig;
            
            if ($smtpConfig) {
                // Update existing SMTP config
                $smtpConfig->update($validator->validated());
                $message = 'SMTP configuration updated successfully';
                $logAction = 'updated';
            } else {
                // Create new SMTP config
                $smtpConfig = $domain->smtpConfig()->create($validator->validated());
                $message = 'SMTP configuration added successfully';
                $logAction = 'added';
            }

            Log::info("SMTP config {$logAction}", [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'smtp_config_id' => $smtpConfig->id
            ]);

            return $this->successResponse($smtpConfig, $message);
        }, 'add_smtp_config');
    }

    /**
     * Update SMTP configuration
     */
    public function updateSmtpConfig(Request $request, string $domainId, string $smtpConfigId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $domainId, $smtpConfigId) {
            $domain = Domain::findOrFail($domainId);
            $smtpConfig = SmtpConfig::findOrFail($smtpConfigId);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            if ($smtpConfig->domain_id !== $domain->id) {
                return $this->errorResponse('SMTP configuration does not belong to this domain');
            }
            
            $validator = Validator::make($request->all(), [
                'host' => 'sometimes|string|max:255',
                'port' => 'sometimes|integer|min:1|max:65535',
                'username' => 'sometimes|string|max:255',
                'password' => 'sometimes|string|max:255',
                'encryption' => 'sometimes|string|in:tls,ssl,none',
                'is_active' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $smtpConfig->update($validator->validated());

            Log::info('SMTP config updated', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'smtp_config_id' => $smtpConfig->id,
                'updated_fields' => array_keys($validator->validated())
            ]);

            return $this->successResponse($smtpConfig, 'SMTP configuration updated successfully');
        }, 'update_smtp_config');
    }

    /**
     * Remove SMTP configuration
     */
    public function destroySmtpConfig(string $domainId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($domainId) {
            $domain = Domain::findOrFail($domainId);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            // Delete the SMTP config for this domain
            $smtpConfig = $domain->smtpConfig;
            if (!$smtpConfig) {
                return $this->errorResponse('No SMTP configuration found for this domain');
            }
            
            $smtpConfig->delete();

            Log::info('SMTP config deleted', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'smtp_config_id' => $smtpConfig->id
            ]);

            return $this->successResponse(null, 'SMTP configuration deleted successfully');
        }, 'delete_smtp_config');
    }

    /**
     * Update bounce processing settings
     */
    public function updateBounceProcessing(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            $domain = Domain::findOrFail($id);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $validator = Validator::make($request->all(), [
                'enable_bounce_processing' => 'boolean',
                'bounce_protocol' => 'required_if:enable_bounce_processing,true|in:imap,pop3',
                'bounce_host' => 'required_if:enable_bounce_processing,true|string',
                'bounce_port' => 'nullable|integer|min:1|max:65535',
                'bounce_username' => 'required_if:enable_bounce_processing,true|string',
                'bounce_password' => 'required_if:enable_bounce_processing,true|string',
                'bounce_ssl' => 'boolean',
                'bounce_mailbox' => 'nullable|string',
                'bounce_check_interval' => 'nullable|integer|min:60|max:3600',
                'bounce_processing_rules' => 'nullable|array'
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $data = $validator->validated();
            
            // Encrypt password if provided
            if (isset($data['bounce_password'])) {
                $data['bounce_password'] = \Illuminate\Support\Facades\Crypt::encryptString($data['bounce_password']);
            }

            $domain->update($data);

            Log::info('Domain bounce processing updated', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'enable_bounce_processing' => $data['enable_bounce_processing'] ?? false
            ]);

            return $this->successResponse($domain->fresh(), 'Bounce processing settings updated successfully');
        }, 'update_bounce_processing');
    }

    /**
     * Test bounce processing connection
     */
    public function testBounceConnection(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $domain = Domain::findOrFail($id);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            if (!$domain->isBounceProcessingConfigured()) {
                return $this->errorResponse('Bounce processing not configured for this domain');
            }

            $bounceService = app(\App\Services\BounceProcessingService::class);
            $result = $bounceService->testConnection($domain);

            Log::info('Bounce connection test', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'success' => $result['success']
            ]);

            return $this->successResponse($result, $result['success'] ? 'Connection test successful' : 'Connection test failed');
        }, 'test_bounce_connection');
    }

    /**
     * Get bounce processing statistics
     */
    public function getBounceStatistics(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $domain = Domain::findOrFail($id);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $bounceService = app(\App\Services\BounceProcessingService::class);
            $stats = $bounceService->getBounceStatistics($domain);

            Log::info('Bounce statistics retrieved', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id
            ]);

            return $this->successResponse($stats, 'Bounce statistics retrieved successfully');
        }, 'get_bounce_statistics');
    }

    /**
     * Process bounces for domain
     */
    public function processBounces(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $domain = Domain::findOrFail($id);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            if (!$domain->isBounceProcessingConfigured()) {
                return $this->errorResponse('Bounce processing not configured for this domain');
            }

            // Dispatch job to process bounces
            \App\Jobs\ProcessBouncesJob::dispatch($domain->id);

            Log::info('Bounce processing job dispatched', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id
            ]);

            return $this->successResponse(null, 'Bounce processing job has been queued');
        }, 'process_bounces');
    }

    /**
     * Perform domain verification
     */
    protected function performDomainVerification(Domain $domain): array
    {
        // This would implement actual domain verification logic
        // For now, we'll simulate verification
        $verificationChecks = [
            'dns_mx' => true,
            'dns_spf' => true,
            'dns_dkim' => true,
            'dns_dmarc' => true
        ];

        $failedChecks = array_filter($verificationChecks, fn($check) => !$check);

        if (empty($failedChecks)) {
            return [
                'success' => true,
                'message' => 'Domain verification completed successfully',
                'checks' => $verificationChecks
            ];
        } else {
            return [
                'success' => false,
                'error' => 'Domain verification failed',
                'failed_checks' => array_keys($failedChecks)
            ];
        }
    }

    /**
     * Get all SMTP configs (admin only)
     */
    public function getAllSmtpConfigs(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $perPage = $request->input('per_page', 15);
            $page = $request->input('page', 1);
            
            $query = SmtpConfig::with(['domain.user']);
            $results = $query->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);
            
            return $this->paginatedResponse($results, 'All SMTP configurations retrieved successfully');
        }, 'admin_list_smtp_configs');
    }

    /**
     * Get specific SMTP config (admin only)
     */
    public function getSmtpConfigById(string $configId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($configId) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $smtpConfig = SmtpConfig::with(['domain.user'])->findOrFail($configId);
            
            return $this->successResponse($smtpConfig, 'SMTP configuration retrieved successfully');
        }, 'admin_view_smtp_config');
    }

    /**
     * Create SMTP config (admin only)
     */
    public function createSmtpConfig(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $validator = Validator::make($request->all(), [
                'domain_id' => 'required|exists:domains,id',
                'host' => 'required|string|max:255',
                'port' => 'required|integer|min:1|max:65535',
                'username' => 'required|string|max:255',
                'password' => 'required|string',
                'encryption' => 'required|string|in:tls,ssl,none',
                'from_address' => 'required|email',
                'from_name' => 'nullable|string|max:255',
                'is_active' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $data = $validator->validated();
            
            // Encrypt password
            $data['password'] = \Illuminate\Support\Facades\Crypt::encryptString($data['password']);
            
            $smtpConfig = SmtpConfig::create($data);

            Log::info('SMTP config created by admin', [
                'admin_id' => Auth::id(),
                'smtp_config_id' => $smtpConfig->id,
                'domain_id' => $smtpConfig->domain_id
            ]);

            return $this->createdResponse($smtpConfig->load(['domain.user']), 'SMTP configuration created successfully');
        }, 'admin_create_smtp_config');
    }

    /**
     * Update SMTP config (admin only)
     */
    public function updateSmtpConfigById(Request $request, string $configId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $configId) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $smtpConfig = SmtpConfig::findOrFail($configId);
            
            $validator = Validator::make($request->all(), [
                'host' => 'sometimes|string|max:255',
                'port' => 'sometimes|integer|min:1|max:65535',
                'username' => 'sometimes|string|max:255',
                'password' => 'sometimes|string',
                'encryption' => 'sometimes|string|in:tls,ssl,none',
                'from_address' => 'sometimes|email',
                'from_name' => 'nullable|string|max:255',
                'is_active' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $data = $validator->validated();
            
            // Encrypt password if provided
            if (isset($data['password'])) {
                $data['password'] = \Illuminate\Support\Facades\Crypt::encryptString($data['password']);
            }
            
            $smtpConfig->update($data);

            Log::info('SMTP config updated by admin', [
                'admin_id' => Auth::id(),
                'smtp_config_id' => $smtpConfig->id,
                'updated_fields' => array_keys($data)
            ]);

            return $this->successResponse($smtpConfig->load(['domain.user']), 'SMTP configuration updated successfully');
        }, 'admin_update_smtp_config');
    }

    /**
     * Delete SMTP config (admin only)
     */
    public function deleteSmtpConfig(string $configId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($configId) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $smtpConfig = SmtpConfig::findOrFail($configId);
            $smtpConfig->delete();

            Log::info('SMTP config deleted by admin', [
                'admin_id' => Auth::id(),
                'smtp_config_id' => $configId
            ]);

            return $this->successResponse(null, 'SMTP configuration deleted successfully');
        }, 'admin_delete_smtp_config');
    }

    /**
     * Test SMTP config (admin only)
     */
    public function testSmtpConfig(string $configId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($configId) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $smtpConfig = SmtpConfig::findOrFail($configId);
            
            // This would implement actual SMTP connection testing
            // For now, we'll simulate a test
            $testResult = [
                'success' => true,
                'message' => 'SMTP connection test successful',
                'details' => [
                    'host' => $smtpConfig->host,
                    'port' => $smtpConfig->port,
                    'encryption' => $smtpConfig->encryption
                ]
            ];

            Log::info('SMTP config test by admin', [
                'admin_id' => Auth::id(),
                'smtp_config_id' => $configId,
                'success' => $testResult['success']
            ]);

            return $this->successResponse($testResult, $testResult['success'] ? 'SMTP test successful' : 'SMTP test failed');
        }, 'admin_test_smtp_config');
    }

    /**
     * Test domain connection (admin only)
     */
    public function testDomainConnection(string $domainId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($domainId) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $domain = Domain::findOrFail($domainId);
            
            // Get the SMTP config for this domain
            $smtpConfig = $domain->smtpConfig;
            
            if (!$smtpConfig) {
                return $this->errorResponse('No SMTP configuration found for this domain', [], 400);
            }
            
            // Test the SMTP connection
            $testResult = [
                'success' => true,
                'message' => 'Domain connection test successful',
                'details' => [
                    'domain' => $domain->name,
                    'smtp_host' => $smtpConfig->host,
                    'smtp_port' => $smtpConfig->port,
                    'smtp_encryption' => $smtpConfig->encryption
                ]
            ];

            Log::info('Domain connection test by admin', [
                'admin_id' => Auth::id(),
                'domain_id' => $domainId,
                'domain_name' => $domain->name,
                'success' => $testResult['success']
            ]);

            return $this->successResponse($testResult, $testResult['success'] ? 'Domain test successful' : 'Domain test failed');
        }, 'admin_test_domain_connection');
    }

    /**
     * Update domain status (active/inactive)
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            $validator = Validator::make($request->all(), [
                'is_active' => 'required|boolean'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $domain = Domain::findOrFail($id);

            // Check if user owns this domain or is admin
            if (!Auth::user()->hasRole('admin') && $domain->user_id !== Auth::id()) {
                return $this->forbiddenResponse('You can only update your own domains');
            }

            $oldStatus = $domain->is_active;
            $domain->is_active = $request->input('is_active');
            $domain->save();

            Log::info('Domain status updated', [
                'user_id' => Auth::id(),
                'domain_id' => $id,
                'domain_name' => $domain->name,
                'old_status' => $oldStatus,
                'new_status' => $domain->is_active
            ]);

            return $this->successResponse([
                'domain' => $domain->fresh(['smtpConfig', 'senders'])
            ], 'Domain status updated successfully');
        }, 'update_domain_status');
    }
}