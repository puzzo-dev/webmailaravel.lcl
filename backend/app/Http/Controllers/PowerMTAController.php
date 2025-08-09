<?php

namespace App\Http\Controllers;

use App\Services\PowerMTAService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Domain;
use App\Traits\ResponseTrait;
use App\Traits\LoggingTrait;

class PowerMTAController extends Controller
{
    use ResponseTrait, LoggingTrait;
    protected $powerMTAService;
    protected $unifiedTrainingService;
    protected $bounceProcessingService;

    public function __construct(
        PowerMTAService $powerMTAService, 
        \App\Services\UnifiedTrainingService $unifiedTrainingService,
        \App\Services\BounceProcessingService $bounceProcessingService
    ) {
        $this->powerMTAService = $powerMTAService;
        $this->unifiedTrainingService = $unifiedTrainingService;
        $this->bounceProcessingService = $bounceProcessingService;
    }

    /**
     * Get PowerMTA status and health information
     */
    public function getStatus(): JsonResponse
    {
        try {
            $status = $this->powerMTAService->getStatus();
            return $this->successResponse($status, 'PowerMTA status retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve PowerMTA status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get PowerMTA FBL accounts
     */
    public function getFBLAccounts(): JsonResponse
    {
        try {
            $accounts = $this->powerMTAService->getFBLAccounts();
            return $this->successResponse($accounts, 'FBL accounts retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve FBL accounts: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get PowerMTA diagnostic files
     */
    public function getDiagnosticFiles(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date');
            $files = $this->powerMTAService->getDiagnosticFiles($date);
            return $this->successResponse($files, 'Diagnostic files retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve diagnostic files: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get PowerMTA reputation summary
     */
    public function getReputationSummary(): JsonResponse
    {
        try {
            $summary = $this->powerMTAService->analyzeSenderReputation('all');
            return $this->successResponse($summary, 'Reputation summary retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve reputation summary: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Analyze PowerMTA reputation for a specific domain
     */
    public function analyzeSenderReputation(Request $request): JsonResponse
    {
        try {
            $domain = $request->input('domain');
            if (!$domain) {
                return $this->errorResponse('Domain parameter is required', 400);
            }
            
            $analysis = $this->powerMTAService->analyzeSenderReputation($domain);
            return $this->successResponse($analysis, 'Domain reputation analyzed successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to analyze reputation: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Parse PowerMTA diagnostic file
     */
    public function parseDiagnosticFile(Request $request): JsonResponse
    {
        try {
            $filename = $request->input('filename');
            if (!$filename) {
                return $this->errorResponse('Filename parameter is required', 400);
            }
            
            $parsed = $this->powerMTAService->parseDiagnosticFile($filename);
            return $this->successResponse($parsed, 'Diagnostic file parsed successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to parse diagnostic file: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Download PowerMTA diagnostic file
     */
    public function downloadDiagnosticFile(Request $request, $filename): JsonResponse
    {
        try {
            // For now, return file info - actual file download would need different implementation
            $fileInfo = $this->powerMTAService->getDiagnosticFiles();
            $file = collect($fileInfo['files'] ?? [])->firstWhere('name', $filename);
            
            if (!$file) {
                return $this->errorResponse('File not found', 404);
            }
            
            return $this->successResponse($file, 'File information retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to download diagnostic file: ' . $e->getMessage(), 500);
        }
    }

    // PowerMTA configuration is handled by AdminController at /admin/system-config/powermta
    // Removed duplicate getConfig() and updateConfig() methods to avoid redundancy

    /**
     * Process bounce files from PowerMTA
     */
    public function processBounceFiles(Request $request): JsonResponse
    {
        try {
            // Use the bounce processing service that's already injected
            $result = $this->bounceProcessingService->processBounceFiles();
            return $this->successResponse($result, 'Bounce files processed successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to process bounce files: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get domain analytics from PowerMTA files
     */
    public function getDomainAnalytics(Request $request, $domainId): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'hours' => 'nullable|integer|min:1|max:168',
            ],
            function () use ($request, $domainId) {
                $domain = Domain::where('id', $domainId)
                    ->where('user_id', auth()->id())
                    ->firstOrFail();

                $hours = $request->input('validated_data.hours', 24);
                $analytics = $this->powerMTAService->getComprehensiveDomainAnalytics($domain->name, $hours);

                return $this->successResponse($analytics, 'Domain analytics retrieved successfully');
            },
            'get_domain_analytics'
        );
    }

    /**
     * Get accounting metrics for domain
     */
    public function getAccountingMetrics(Request $request, $domainId): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'hours' => 'nullable|integer|min:1|max:168',
            ],
            function () use ($request, $domainId) {
                $domain = Domain::where('id', $domainId)
                    ->where('user_id', auth()->id())
                    ->firstOrFail();

                $hours = $request->input('validated_data.hours', 24);
                $metrics = $this->powerMTAService->parseAccountingFiles($domain->name, $hours);

                return $this->successResponse($metrics, 'Accounting metrics retrieved successfully');
            },
            'get_accounting_metrics'
        );
    }

    // Removed getFBLData() - redundant with getFBLAccounts()
    // Domain-specific FBL data can be retrieved via getFBLAccounts() with domain filtering

    /**
     * Apply training configuration to domain
     */
    public function applyTrainingConfig(Request $request, $domainId): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [],
            function () use ($domainId) {
                $domain = Domain::where('id', $domainId)
                    ->where('user_id', auth()->id())
                    ->firstOrFail();

                $result = $this->powerMTAService->applyTrainingConfig($domainId);

                if ($result['success']) {
                    return $this->successResponse($result, 'Training configuration applied successfully');
                } else {
                    return $this->errorResponse($result['error'], 'Failed to apply training configuration');
                }
            },
            'apply_training_config'
        );
    }

    /**
     * Get domain status
     */
    public function getDomainStatus(Request $request, $domainId): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [],
            function () use ($domainId) {
                $domain = Domain::where('id', $domainId)
                    ->where('user_id', auth()->id())
                    ->firstOrFail();

                $status = $this->powerMTAService->getDomainStatus($domainId);

                return $this->successResponse($status, 'Domain status retrieved successfully');
            },
            'get_domain_status'
        );
    }

    /**
     * Get training configuration
     */
    public function getTrainingConfig(Request $request): JsonResponse
    {
        $config = $this->powerMTAService->getTrainingConfig();
        return $this->successResponse($config, 'Training configuration retrieved successfully');
    }

    /**
     * Update domain configuration
     */
    public function updateDomainConfig(Request $request, $domainId): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'max_msg_rate' => 'required|integer|min:1|max:10000',
            ],
            function () use ($request, $domainId) {
                $domain = Domain::where('id', $domainId)
                    ->where('user_id', auth()->id())
                    ->firstOrFail();

                $maxMsgRate = $request->input('validated_data.max_msg_rate');
                $result = $this->powerMTAService->updateDomainConfig($domain->name, $maxMsgRate);

                if ($result) {
                    // Update database
                    $domain->update(['max_msg_rate' => $maxMsgRate]);
                    
                    return $this->successResponse([
                        'domain' => $domain->name,
                        'max_msg_rate' => $maxMsgRate
                    ], 'Domain configuration updated successfully');
                } else {
                    return $this->errorResponse('Failed to update PowerMTA configuration', 'Configuration update failed');
                }
            },
            'update_domain_config'
        );
    }

    /**
     * Get all domains analytics summary
     */
    public function getAllDomainsAnalytics(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'hours' => 'nullable|integer|min:1|max:168',
            ],
            function () use ($request) {
                $hours = $request->input('validated_data.hours', 24);
                $domains = Domain::where('user_id', auth()->id())->get();

                $analytics = [];
                foreach ($domains as $domain) {
                    $domainAnalytics = $this->powerMTAService->getComprehensiveDomainAnalytics($domain->name, $hours);
                    $analytics[] = [
                        'domain_id' => $domain->id,
                        'domain' => $domain->name,
                        'provider' => $domain->provider,
                        'max_msg_rate' => $domain->max_msg_rate,
                        'analytics' => $domainAnalytics
                    ];
                }

                return $this->successResponse($analytics, 'All domains analytics retrieved successfully');
            },
            'get_all_domains_analytics'
        );
    }

    /**
     * Manual training check for all domains
     */
    public function manualTrainingCheck(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [],
            function () {
                $domains = Domain::where('user_id', auth()->id())->get();
                $results = [];

                foreach ($domains as $domain) {
                    $result = $this->powerMTAService->applyTrainingConfig($domain->id);
                    $results[] = [
                        'domain_id' => $domain->id,
                        'domain' => $domain->name,
                        'result' => $result
                    ];
                }

                return $this->successResponse($results, 'Manual training check completed for all domains');
            },
            'manual_training_check'
        );
    }

    // Training methods moved to TrainingController for consolidation
}
