<?php

namespace App\Http\Controllers;

use App\Services\RedisSchedulerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MonitoringController extends BaseController
{
    protected $redisScheduler;

    public function __construct(RedisSchedulerService $redisScheduler)
    {
        $this->redisScheduler = $redisScheduler;
    }

    /**
     * Get monitoring status
     */
    public function getMonitoringStatus(Request $request): JsonResponse
    {
        $status = $this->redisScheduler->getMonitoringStatus();
        return $this->successResponse($status, 'Monitoring status retrieved successfully');
    }

    /**
     * Get all monitoring results
     */
    public function getAllMonitoringResults(Request $request): JsonResponse
    {
        $results = $this->redisScheduler->getAllMonitoringResults();
        return $this->successResponse($results, 'Monitoring results retrieved successfully');
    }

    /**
     * Get domain monitoring result
     */
    public function getDomainMonitoringResult(Request $request, $domainId): JsonResponse
    {
        $result = $this->redisScheduler->getDomainMonitoringResult($domainId);
        return $this->successResponse($result, 'Domain monitoring result retrieved successfully');
    }

    /**
     * Force run monitoring
     */
    public function forceRunMonitoring(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [],
            function () {
                $results = $this->redisScheduler->forceRunMonitoring();
                return $this->successResponse($results, 'Domain monitoring executed successfully');
            },
            'force_run_monitoring'
        );
    }

    /**
     * Schedule domain check
     */
    public function scheduleDomainCheck(Request $request, $domainId): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'delay_minutes' => 'nullable|integer|min:0|max:1440',
            ],
            function () use ($request, $domainId) {
                $delayMinutes = $request->input('validated_data.delay_minutes', 0);
                $this->redisScheduler->scheduleDomainCheck($domainId, $delayMinutes);
                
                return $this->successResponse([
                    'domain_id' => $domainId,
                    'delay_minutes' => $delayMinutes
                ], 'Domain check scheduled successfully');
            },
            'schedule_domain_check'
        );
    }

    /**
     * Process scheduled checks
     */
    public function processScheduledChecks(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [],
            function () {
                $this->redisScheduler->processScheduledChecks();
                return $this->successResponse([], 'Scheduled checks processed successfully');
            },
            'process_scheduled_checks'
        );
    }

    /**
     * Clear monitoring data
     */
    public function clearMonitoringData(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [],
            function () {
                $this->redisScheduler->clearMonitoringData();
                return $this->successResponse([], 'Monitoring data cleared successfully');
            },
            'clear_monitoring_data'
        );
    }
}
