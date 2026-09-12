<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\User;
use App\Services\AdminService;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    public function __construct(
        private AnalyticsService $analyticsService,
        private AdminService $adminService
    ) {}

    /**
     * Get admin dashboard data
     */
    public function dashboard(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $stats = [
                'total_users' => User::count(),
                'total_campaigns' => Campaign::count(),
                'active_campaigns' => Campaign::whereIn('status', ['running', 'scheduled'])->count(),
                'total_emails_sent' => Campaign::sum('total_sent'),
                'total_opens' => Campaign::sum('opens'),
                'total_clicks' => Campaign::sum('clicks'),
                'avg_open_rate' => Campaign::avg('open_rate'),
                'avg_click_rate' => Campaign::avg('click_rate'),
            ];

            $recentUsers = User::latest()->take(5)->get();
            $recentCampaigns = Campaign::latest()->take(5)->get();

            return [
                'stats' => $stats,
                'recent_users' => $recentUsers,
                'recent_campaigns' => $recentCampaigns,
            ];
        }, 'view_admin_dashboard');
    }

    /**
     * Get analytics data (admin only) - delegates to AnalyticsService
     */
    public function analytics(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
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
        }, 'view_admin_analytics');
    }

    /**
     * Get system status
     */
    public function systemStatus(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            return $this->adminService->getSystemStatus();
        }, 'view_system_status');
    }
}
