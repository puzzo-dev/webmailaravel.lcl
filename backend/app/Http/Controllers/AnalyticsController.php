<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Services\AnalyticsService;
use App\Traits\ResponseTrait;
use App\Traits\LoggingTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    use ResponseTrait, LoggingTrait;

    protected $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get analytics overview (user or admin based on role)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // Check if user is admin for enhanced analytics
            if ($user->hasRole('admin')) {
                return $this->getAdminAnalytics($request);
            }
            
            // Get basic user analytics data
            $data = [
                'dashboard' => $this->analyticsService->getDashboardAnalytics(),
                'trending' => $this->analyticsService->getTrendingMetrics(7), // Last 7 days
                'summary' => [
                    'total_campaigns' => $user->campaigns()->count(),
                    'active_campaigns' => $user->campaigns()->where('status', 'active')->count(),
                    'total_emails_sent' => $user->campaigns()->sum('emails_sent'),
                    'total_opens' => $user->campaigns()->sum('opens'),
                    'total_clicks' => $user->campaigns()->sum('clicks'),
                ]
            ];

            $this->logInfo('analytics.index.accessed', [
                'user_id' => $user->id,
                'ip' => request()->ip()
            ]);

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get analytics overview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get analytics dashboard data
     */
    public function getDashboard(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $data = $this->analyticsService->getDashboardAnalytics();

            $this->logInfo('analytics.dashboard.accessed', [
                'user_id' => $user->id,
                'ip' => request()->ip()
            ]);

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get analytics data',
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

    /**
     * Get admin analytics (consolidated from AdminController)
     */
    public function getAdminAnalytics(Request $request): JsonResponse
    {
        try {
            $timeRange = $request->get('timeRange', '30d');
            $period = $request->get('period', 'monthly');
            $limit = (int) $request->get('limit', 12);
            
            $analytics = [
                'user_growth' => $this->analyticsService->getUserGrowth($period, $limit),
                'campaign_performance' => $this->analyticsService->getCampaignPerformance([
                    'period' => $period,
                    'limit' => $limit
                ]),
                'deliverability_stats' => $this->analyticsService->getDeliverabilityAnalytics(),
                'revenue_metrics' => $this->analyticsService->getRevenueAnalytics(),
            ];

            $this->logInfo('admin_analytics.accessed', [
                'user_id' => auth()->id(),
                'time_range' => $timeRange,
                'period' => $period
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Admin analytics data retrieved successfully',
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            $this->logError('admin_analytics.error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch admin analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}




