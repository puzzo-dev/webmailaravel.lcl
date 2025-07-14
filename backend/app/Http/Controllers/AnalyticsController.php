<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use App\Services\LoggingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    protected $analyticsService;
    protected $loggingService;

    public function __construct(AnalyticsService $analyticsService, LoggingService $loggingService)
    {
        $this->analyticsService = $analyticsService;
        $this->loggingService = $loggingService;
    }

    /**
     * Get dashboard analytics
     */
    public function getDashboard(Request $request): JsonResponse
    {
        try {
            $analytics = $this->analyticsService->getDashboardAnalytics();

            $this->loggingService->log('analytics.dashboard.accessed', [
                'user_id' => auth()->id(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get dashboard analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get campaign analytics
     */
    public function getCampaignAnalytics(Request $request): JsonResponse
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $analytics = $this->analyticsService->getCampaignAnalytics(
                $endDate ? now()->parse($endDate) : now(),
                $startDate ? now()->parse($startDate) : now()->subMonth()
            );

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get campaign analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user analytics
     */
    public function getUserAnalytics(Request $request): JsonResponse
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $analytics = $this->analyticsService->getUserAnalytics(
                $endDate ? now()->parse($endDate) : now(),
                $startDate ? now()->parse($startDate) : now()->subMonth()
            );

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get user analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get revenue analytics
     */
    public function getRevenueAnalytics(Request $request): JsonResponse
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $analytics = $this->analyticsService->getRevenueAnalytics(
                $endDate ? now()->parse($endDate) : now(),
                $startDate ? now()->parse($startDate) : now()->subMonth()
            );

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get revenue analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get deliverability analytics
     */
    public function getDeliverabilityAnalytics(Request $request): JsonResponse
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $analytics = $this->analyticsService->getDeliverabilityAnalytics(
                $endDate ? now()->parse($endDate) : now(),
                $startDate ? now()->parse($startDate) : now()->subWeek()
            );

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get deliverability analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get reputation analytics
     */
    public function getReputationAnalytics(Request $request): JsonResponse
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $analytics = $this->analyticsService->getReputationAnalytics(
                $endDate ? now()->parse($endDate) : now(),
                $startDate ? now()->parse($startDate) : now()->subWeek()
            );

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get reputation analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trending metrics
     */
    public function getTrendingMetrics(Request $request): JsonResponse
    {
        try {
            $days = (int) $request->input('days', 30);
            $metrics = $this->analyticsService->getTrendingMetrics($days);

            return response()->json([
                'success' => true,
                'data' => $metrics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get trending metrics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get campaign performance report
     */
    public function getCampaignPerformance(Request $request, int $campaignId): JsonResponse
    {
        try {
            $report = $this->analyticsService->getCampaignPerformanceReport($campaignId);

            return response()->json([
                'success' => true,
                'data' => $report
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get campaign performance report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 
 
 
 
 
 