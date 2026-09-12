<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function __construct(
        protected AnalyticsService $analyticsService
    ) {}

    /**
     * Get analytics overview (user or admin based on role)
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = $request->user();

            if ($user->hasRole('admin')) {
                return $this->getAdminAnalyticsData($request);
            }

            return [
                'dashboard' => $this->analyticsService->getUserDashboardAnalytics($user),
                'trending' => $this->analyticsService->getUserTrendingMetrics($user, 7),
                'summary' => [
                    'total_campaigns' => $user->campaigns()->count(),
                    'active_campaigns' => $user->campaigns()->where('status', 'active')->count(),
                    'total_emails_sent' => $user->campaigns()->sum('total_sent'),
                    'total_opens' => $user->campaigns()->sum('opens'),
                    'total_clicks' => $user->campaigns()->sum('clicks'),
                ],
            ];
        }, 'analytics_overview');
    }

    /**
     * Get analytics dashboard data
     */
    public function getDashboard(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = $request->user();

            if ($user->hasRole('admin')) {
                return $this->analyticsService->getDashboardAnalytics();
            }

            return $this->analyticsService->getUserDashboardAnalytics($user);
        }, 'analytics_dashboard');
    }

    /**
     * Get campaign analytics
     */
    public function getCampaignAnalytics(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            return $this->analyticsService->getCampaignAnalytics(
                $endDate ? now()->parse($endDate) : now(),
                $startDate ? now()->parse($startDate) : now()->subMonth()
            );
        }, 'campaign_analytics');
    }

    /**
     * Get user analytics
     */
    public function getUserAnalytics(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            return $this->analyticsService->getUserAnalytics(
                $endDate ? now()->parse($endDate) : now(),
                $startDate ? now()->parse($startDate) : now()->subMonth()
            );
        }, 'user_analytics');
    }

    /**
     * Get revenue analytics
     */
    public function getRevenueAnalytics(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            return $this->analyticsService->getRevenueAnalytics(
                $endDate ? now()->parse($endDate) : now(),
                $startDate ? now()->parse($startDate) : now()->subMonth()
            );
        }, 'revenue_analytics');
    }

    /**
     * Get deliverability analytics
     */
    public function getDeliverabilityAnalytics(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            return $this->analyticsService->getDeliverabilityAnalytics(
                $endDate ? now()->parse($endDate) : now(),
                $startDate ? now()->parse($startDate) : now()->subWeek()
            );
        }, 'deliverability_analytics');
    }

    /**
     * Get reputation analytics
     */
    public function getReputationAnalytics(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            return $this->analyticsService->getReputationAnalytics(
                $endDate ? now()->parse($endDate) : now(),
                $startDate ? now()->parse($startDate) : now()->subWeek()
            );
        }, 'reputation_analytics');
    }

    /**
     * Get trending metrics
     */
    public function getTrendingMetrics(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $days = (int) $request->input('days', 30);
            return $this->analyticsService->getTrendingMetrics($days);
        }, 'trending_metrics');
    }

    /**
     * Get campaign performance report
     */
    public function getCampaignPerformance(Request $request, int $campaignId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaignId) {
            return $this->analyticsService->getCampaignPerformanceReport($campaignId);
        }, 'campaign_performance');
    }

    /**
     * Get admin analytics (consolidated from AdminController)
     */
    public function getAdminAnalytics(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            return $this->getAdminAnalyticsData($request);
        }, 'admin_analytics');
    }

    /**
     * Shared admin analytics data builder.
     */
    private function getAdminAnalyticsData(Request $request): array
    {
        $period = $request->get('period', 'monthly');
        $limit = (int) $request->get('limit', 12);

        return [
            'user_growth' => $this->analyticsService->getUserGrowth($period, $limit),
            'campaign_performance' => $this->analyticsService->getCampaignPerformance([
                'period' => $period,
                'limit' => $limit,
            ]),
            'deliverability_stats' => $this->analyticsService->getDeliverabilityAnalytics(),
            'revenue_metrics' => $this->analyticsService->getRevenueAnalytics(),
        ];
    }

    /**
     * Get campaign hourly statistics
     */
    public function getCampaignHourlyStats(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            return $this->analyticsService->getHourlyStats($campaign);
        }, 'get_campaign_hourly_stats');
    }

    /**
     * Get campaign daily statistics
     */
    public function getCampaignDailyStats(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            return $this->analyticsService->getDailyStats($campaign);
        }, 'get_campaign_daily_stats');
    }

    /**
     * Get campaign domain performance
     */
    public function getCampaignDomainPerformance(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            return $this->analyticsService->getDomainPerformance($campaign);
        }, 'get_campaign_domain_performance');
    }

    /**
     * Get campaign sender performance
     */
    public function getCampaignSenderPerformance(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            return $this->analyticsService->getSenderPerformance($campaign);
        }, 'get_campaign_sender_performance');
    }
}
