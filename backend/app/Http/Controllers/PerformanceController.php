<?php

namespace App\Http\Controllers;

use App\Services\PerformanceMonitoringService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PerformanceController extends Controller
{
    private PerformanceMonitoringService $performanceService;

    public function __construct(PerformanceMonitoringService $performanceService)
    {
        $this->performanceService = $performanceService;
    }

    /**
     * Get system performance metrics
     */
    public function getSystemMetrics(): JsonResponse
    {
        return $this->validateAndExecute(
            request(),
            [],
            function () {
                $metrics = $this->performanceService->getSystemMetrics();
                
                return $this->successResponse($metrics, 'System performance metrics retrieved successfully');
            },
            'get_system_performance_metrics'
        );
    }

    /**
     * Get performance metrics for a specific operation
     */
    public function getOperationMetrics(Request $request, string $operation): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'hours' => 'nullable|integer|min:1|max:168' // Max 1 week
            ],
            function () use ($request, $operation) {
                $hours = $request->get('hours', 24);
                $metrics = $this->performanceService->getMetrics($operation, $hours);
                
                return $this->successResponse($metrics, "Performance metrics for {$operation} retrieved successfully");
            },
            'get_operation_performance_metrics'
        );
    }

    /**
     * Generate performance report
     */
    public function generateReport(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'hours' => 'nullable|integer|min:1|max:168' // Max 1 week
            ],
            function () use ($request) {
                $hours = $request->get('hours', 24);
                $report = $this->performanceService->generatePerformanceReport($hours);
                
                return $this->successResponse($report, 'Performance report generated successfully');
            },
            'generate_performance_report'
        );
    }

    /**
     * Record a custom performance metric (for testing)
     */
    public function recordMetric(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'operation' => 'required|string|max:255',
                'duration' => 'required|numeric|min:0',
                'metadata' => 'nullable|array'
            ],
            function () use ($request) {
                $data = $request->validated();
                
                $this->performanceService->recordMetric(
                    $data['operation'],
                    $data['duration'],
                    $data['metadata'] ?? []
                );
                
                return $this->successResponse([], 'Performance metric recorded successfully');
            },
            'record_performance_metric'
        );
    }
}
