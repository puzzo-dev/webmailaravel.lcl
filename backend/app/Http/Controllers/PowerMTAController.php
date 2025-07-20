<?php

namespace App\Http\Controllers;

use App\Services\PowerMTAService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Domain;

class PowerMTAController extends Controller
{
    protected $powerMTAService;

    public function __construct(PowerMTAService $powerMTAService)
    {
        $this->powerMTAService = $powerMTAService;
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

    /**
     * Get FBL data for domain
     */
    public function getFBLData(Request $request, $domainId): JsonResponse
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
                $fblData = $this->powerMTAService->parseFBLFiles($domain->name, $hours);

                return $this->successResponse([
                    'total_complaints' => count($fblData),
                    'complaint_types' => array_count_values(array_column($fblData, 'feedback_type')),
                    'complaints' => $fblData
                ], 'FBL data retrieved successfully');
            },
            'get_fbl_data'
        );
    }

    /**
     * Get diagnostic data for domain
     */
    public function getDiagnosticData(Request $request, $domainId): JsonResponse
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
                $diagData = $this->powerMTAService->parseDiagFiles($domain->name, $hours);

                return $this->successResponse([
                    'total_diagnostics' => count($diagData),
                    'diagnostics' => $diagData
                ], 'Diagnostic data retrieved successfully');
            },
            'get_diagnostic_data'
        );
    }

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
     * Export domain analytics
     */
    public function exportDomainAnalytics(Request $request, $domainId): JsonResponse
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
                $csvData = $this->powerMTAService->exportDomainAnalytics($domain->name, $hours);

                return $this->successResponse([
                    'filename' => "domain_analytics_{$domain->name}_{$hours}h.csv",
                    'data' => $csvData
                ], 'Domain analytics exported successfully');
            },
            'export_domain_analytics'
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
}
