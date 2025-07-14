<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
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
        // No dependencies needed - using Laravel's built-in features
    }

    /**
     * Display a listing of the resource
     */
    public function index(): JsonResponse
    {
        try {
            $domains = Domain::where('user_id', Auth::id())
                ->with(['smtpConfig', 'senders'])
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            Log::info('Domains listed', [
                'user_id' => Auth::id(),
                'count' => $domains->count()
            ]);

            return response()->json([
                'success' => true,
                'data' => $domains,
                'message' => 'Domains retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Domains list failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve domains'
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
                'domain' => 'required|string|max:255|unique:domains,domain',
                'is_active' => 'boolean',
                'verification_status' => 'string|in:pending,verified,failed'
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

            $domain = Domain::create($data);

            Log::info('Domain created', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'domain' => $domain->domain
            ]);

            return response()->json([
                'success' => true,
                'data' => $domain,
                'message' => 'Domain created successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Domain creation failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create domain'
            ], 500);
        }
    }

    /**
     * Display the specified resource
     */
    public function show(Domain $domain): JsonResponse
    {
        try {
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            Log::info('Domain viewed', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id
            ]);

            return response()->json([
                'success' => true,
                'data' => $domain->load(['smtpConfig', 'senders']),
                'message' => 'Domain retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Domain view failed', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve domain'
            ], 500);
        }
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, Domain $domain): JsonResponse
    {
        try {
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'domain' => 'sometimes|string|max:255|unique:domains,domain,' . $domain->id,
                'is_active' => 'boolean',
                'verification_status' => 'string|in:pending,verified,failed'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $domain->update($validator->validated());

            Log::info('Domain updated', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'updated_fields' => array_keys($validator->validated())
            ]);

            return response()->json([
                'success' => true,
                'data' => $domain->load(['smtpConfig', 'senders']),
                'message' => 'Domain updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Domain update failed', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update domain'
            ], 500);
        }
    }

    /**
     * Remove the specified resource
     */
    public function destroy(Domain $domain): JsonResponse
    {
        try {
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            $domain->delete();

            Log::info('Domain deleted', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Domain deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Domain deletion failed', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete domain'
            ], 500);
        }
    }

    /**
     * Verify domain
     */
    public function verifyDomain(Domain $domain): JsonResponse
    {
        try {
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
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

                return response()->json([
                    'success' => true,
                    'message' => 'Domain verified successfully',
                    'data' => $verificationResult
                ]);
            } else {
                $domain->update(['verification_status' => 'failed']);
                
                Log::error('Domain verification failed', [
                    'user_id' => Auth::id(),
                    'domain_id' => $domain->id,
                    'domain' => $domain->domain,
                    'error' => $verificationResult['error']
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Domain verification failed: ' . $verificationResult['error']
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Domain verification failed', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify domain: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add SMTP configuration to domain
     */
    public function addSmtpConfig(Request $request, Domain $domain): JsonResponse
    {
        try {
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
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
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $smtpConfig = $domain->smtpConfig()->create($validator->validated());

            Log::info('SMTP config added', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'smtp_config_id' => $smtpConfig->id
            ]);

            return response()->json([
                'success' => true,
                'data' => $smtpConfig,
                'message' => 'SMTP configuration added successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('SMTP config add failed', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to add SMTP configuration'
            ], 500);
        }
    }

    /**
     * Update SMTP configuration
     */
    public function updateSmtpConfig(Request $request, Domain $domain, SmtpConfig $smtpConfig): JsonResponse
    {
        try {
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            if ($smtpConfig->domain_id !== $domain->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'SMTP configuration does not belong to this domain'
                ], 400);
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
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $smtpConfig->update($validator->validated());

            Log::info('SMTP config updated', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'smtp_config_id' => $smtpConfig->id,
                'updated_fields' => array_keys($validator->validated())
            ]);

            return response()->json([
                'success' => true,
                'data' => $smtpConfig,
                'message' => 'SMTP configuration updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('SMTP config update failed', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'smtp_config_id' => $smtpConfig->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update SMTP configuration'
            ], 500);
        }
    }

    /**
     * Remove SMTP configuration
     */
    public function destroySmtpConfig(Domain $domain, SmtpConfig $smtpConfig): JsonResponse
    {
        try {
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            if ($smtpConfig->domain_id !== $domain->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'SMTP configuration does not belong to this domain'
                ], 400);
            }

            $smtpConfig->delete();

            Log::info('SMTP config deleted', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'smtp_config_id' => $smtpConfig->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'SMTP configuration deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('SMTP config deletion failed', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'smtp_config_id' => $smtpConfig->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete SMTP configuration'
            ], 500);
        }
    }

    /**
     * Update bounce processing settings
     */
    public function updateBounceProcessing(Request $request, Domain $domain): JsonResponse
    {
        try {
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
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
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
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

            return response()->json([
                'success' => true,
                'data' => $domain->fresh(),
                'message' => 'Bounce processing settings updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Domain bounce processing update failed', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update bounce processing settings'
            ], 500);
        }
    }

    /**
     * Test bounce processing connection
     */
    public function testBounceConnection(Domain $domain): JsonResponse
    {
        try {
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            if (!$domain->isBounceProcessingConfigured()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bounce processing not configured for this domain'
                ], 400);
            }

            $bounceService = app(\App\Services\BounceProcessingService::class);
            $result = $bounceService->testConnection($domain);

            Log::info('Bounce connection test', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'success' => $result['success']
            ]);

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => $result['success'] ? 'Connection test successful' : 'Connection test failed'
            ]);

        } catch (\Exception $e) {
            Log::error('Bounce connection test failed', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get bounce processing statistics
     */
    public function getBounceStatistics(Domain $domain): JsonResponse
    {
        try {
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            $bounceService = app(\App\Services\BounceProcessingService::class);
            $stats = $bounceService->getBounceStatistics($domain);

            Log::info('Bounce statistics retrieved', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id
            ]);

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Bounce statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Bounce statistics retrieval failed', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve bounce statistics'
            ], 500);
        }
    }

    /**
     * Process bounces for domain
     */
    public function processBounces(Domain $domain): JsonResponse
    {
        try {
            if ($domain->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied'
                ], 403);
            }

            if (!$domain->isBounceProcessingConfigured()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bounce processing not configured for this domain'
                ], 400);
            }

            // Dispatch job to process bounces
            \App\Jobs\ProcessBouncesJob::dispatch($domain->id);

            Log::info('Bounce processing job dispatched', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bounce processing job has been queued'
            ]);

        } catch (\Exception $e) {
            Log::error('Bounce processing job dispatch failed', [
                'user_id' => Auth::id(),
                'domain_id' => $domain->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to queue bounce processing job'
            ], 500);
        }
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