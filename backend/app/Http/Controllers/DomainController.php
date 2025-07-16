<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\SmtpConfig;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class DomainController extends Controller
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
        return $this->executeWithErrorHandling(function () use ($request) {
            $query = Domain::where('user_id', Auth::id())
                ->with(['smtpConfig', 'senders'])
                ->orderBy('created_at', 'desc');

            return $this->getPaginatedResults($query, $request, 'domains', ['smtpConfig', 'senders']);
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
                'domain' => 'required|string|max:255|unique:domains,domain',
                'is_active' => 'boolean',
                'verification_status' => 'string|in:pending,verified,failed'
            ],
            function () use ($request) {
                $data = $request->input('validated_data');
                $data['user_id'] = Auth::id();

                $domain = Domain::create($data);

                Log::info('Domain created', [
                    'user_id' => Auth::id(),
                    'domain_id' => $domain->id,
                    'domain' => $domain->domain
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
            
            return $this->getResource($domain, 'domain', $id);
        }, 'view_domain');
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            $domain = Domain::findOrFail($id);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $validator = Validator::make($request->all(), [
                'domain' => 'sometimes|string|max:255|unique:domains,domain,' . $domain->id,
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
                    'domain' => $domain->domain
                ]);

                return $this->successResponse($verificationResult, 'Domain verified successfully');
            } else {
                $domain->update(['verification_status' => 'failed']);
                
                Log::error('Domain verification failed', [
                    'user_id' => Auth::id(),
                    'domain_id' => $domain->id,
                    'domain' => $domain->domain,
                    'error' => $verificationResult['error']
                ]);

                return $this->errorResponse('Domain verification failed: ' . $verificationResult['error']);
            }
        }, 'verify_domain');
    }

    /**
     * Add SMTP configuration to domain
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
            
            $smtpConfig = $domain->smtpConfig()->create($validator->validated());

            Log::info('SMTP config added', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'smtp_config_id' => $smtpConfig->id
            ]);

            return $this->createdResponse($smtpConfig, 'SMTP configuration added successfully');
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
    public function destroySmtpConfig(string $domainId, string $smtpConfigId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($domainId, $smtpConfigId) {
            $domain = Domain::findOrFail($domainId);
            $smtpConfig = SmtpConfig::findOrFail($smtpConfigId);
            
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            if ($smtpConfig->domain_id !== $domain->id) {
                return $this->errorResponse('SMTP configuration does not belong to this domain');
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
}