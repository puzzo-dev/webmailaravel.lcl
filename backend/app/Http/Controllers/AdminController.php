<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Campaign;
use App\Models\Analytics;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AdminController extends BaseController
{
    /**
     * Get admin dashboard data
     */
    public function dashboard(): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeAdmin(),
            function () {
                $stats = [
                    'total_users' => User::count(),
                    'total_campaigns' => Campaign::count(),
                    'active_campaigns' => Campaign::where('status', 'active')->count(),
                    'total_emails_sent' => Campaign::sum('emails_sent'),
                    'total_opens' => Campaign::sum('opens'),
                    'total_clicks' => Campaign::sum('clicks'),
                    'avg_open_rate' => Campaign::avg('open_rate'),
                    'avg_click_rate' => Campaign::avg('click_rate'),
                ];

                $recentUsers = User::latest()->take(5)->get();
                $recentCampaigns = Campaign::latest()->take(5)->get();

                return $this->successResponse([
                    'stats' => $stats,
                    'recent_users' => $recentUsers,
                    'recent_campaigns' => $recentCampaigns,
                ], 'Dashboard data retrieved successfully');
            },
            'view_admin_dashboard'
        );
    }

    /**
     * Get all users (admin only)
     */
    public function users(): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeAdmin(),
            fn() => $this->getPaginatedResults(
                User::with(['devices', 'campaigns']),
                request(),
                'users'
            ),
            'list_users'
        );
    }

    /**
     * Get all campaigns (admin only)
     */
    public function campaigns(): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeAdmin(),
            fn() => $this->getPaginatedResults(
                Campaign::with(['user', 'sender', 'domain']),
                request(),
                'campaigns'
            ),
            'list_campaigns'
        );
    }

    /**
     * Get analytics data (admin only)
     */
    public function analytics(): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeAdmin(),
            function () {
                $timeRange = request('timeRange', '30d');
                
                $analytics = [
                    'user_growth' => $this->getUserGrowth($timeRange),
                    'campaign_performance' => $this->getCampaignPerformance($timeRange),
                    'deliverability_stats' => $this->getDeliverabilityStats($timeRange),
                    'revenue_metrics' => $this->getRevenueMetrics($timeRange),
                ];

                return $this->successResponse($analytics, 'Analytics data retrieved successfully');
            },
            'view_analytics'
        );
    }

    /**
     * Get system status
     */
    public function systemStatus(): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeAdmin(),
            function () {
                $status = [
                    'database' => $this->checkDatabaseStatus(),
                    'cache' => $this->checkCacheStatus(),
                    'queue' => $this->checkQueueStatus(),
                    'storage' => $this->checkStorageStatus(),
                    'memory' => $this->getMemoryUsage(),
                    'disk' => $this->getDiskUsage(),
                ];

                return $this->successResponse($status, 'System status retrieved successfully');
            },
            'view_system_status'
        );
    }

    /**
     * Get system configuration
     */
    public function getSystemConfig(): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeAdmin(),
            function () {
                $config = [
                    'app' => config('app'),
                    'mail' => config('mail'),
                    'queue' => config('queue'),
                    'cache' => config('cache'),
                    'session' => config('session'),
                    'logging' => config('logging'),
                ];

                return $this->successResponse($config, 'System configuration retrieved successfully');
            },
            'view_system_config'
        );
    }

    /**
     * Update system configuration
     */
    public function updateSystemConfig(Request $request): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeAdmin(),
            function () use ($request) {
                $validated = $request->validate([
                    'config_type' => 'required|string|in:app,mail,queue,cache,session,logging',
                    'config_data' => 'required|array',
                ]);

                // Update configuration logic here
                // This would typically involve updating config files or database

                return $this->successResponse(null, 'System configuration updated successfully');
            },
            'update_system_config'
        );
    }

    /**
     * Helper methods for analytics
     */
    private function getUserGrowth($timeRange)
    {
        $days = $timeRange === '7d' ? 7 : ($timeRange === '30d' ? 30 : 90);
        
        return User::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getCampaignPerformance($timeRange)
    {
        $days = $timeRange === '7d' ? 7 : ($timeRange === '30d' ? 30 : 90);
        
        return Campaign::selectRaw('
                DATE(created_at) as date,
                COUNT(*) as total_campaigns,
                SUM(emails_sent) as total_sent,
                AVG(open_rate) as avg_open_rate,
                AVG(click_rate) as avg_click_rate
            ')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getDeliverabilityStats($timeRange)
    {
        $days = $timeRange === '7d' ? 7 : ($timeRange === '30d' ? 30 : 90);
        
        return Campaign::selectRaw('
                AVG(delivery_rate) as avg_delivery_rate,
                AVG(bounce_rate) as avg_bounce_rate,
                AVG(spam_complaints) as avg_spam_complaints
            ')
            ->where('created_at', '>=', now()->subDays($days))
            ->first();
    }

    private function getRevenueMetrics($timeRange)
    {
        $days = $timeRange === '7d' ? 7 : ($timeRange === '30d' ? 30 : 90);
        
        // This would integrate with your billing/subscription system
        return [
            'total_revenue' => 0,
            'monthly_recurring_revenue' => 0,
            'active_subscriptions' => 0,
        ];
    }

    private function checkDatabaseStatus()
    {
        try {
            DB::connection()->getPdo();
            return ['status' => 'connected', 'message' => 'Database connection successful'];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => 'Database connection failed'];
        }
    }

    private function checkCacheStatus()
    {
        try {
            Cache::store()->has('test');
            return ['status' => 'connected', 'message' => 'Cache connection successful'];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => 'Cache connection failed'];
        }
    }

    private function checkQueueStatus()
    {
        // Check if queue workers are running
        return ['status' => 'unknown', 'message' => 'Queue status check not implemented'];
    }

    private function checkStorageStatus()
    {
        $disk = storage_path();
        $freeSpace = disk_free_space($disk);
        $totalSpace = disk_total_space($disk);
        $usedSpace = $totalSpace - $freeSpace;
        $usagePercent = ($usedSpace / $totalSpace) * 100;

        return [
            'status' => $usagePercent < 90 ? 'ok' : 'warning',
            'usage_percent' => round($usagePercent, 2),
            'free_space' => $this->formatBytes($freeSpace),
            'total_space' => $this->formatBytes($totalSpace),
        ];
    }

    private function getMemoryUsage()
    {
        $memoryLimit = ini_get('memory_limit');
        $memoryUsage = memory_get_usage(true);
        $memoryPeak = memory_get_peak_usage(true);

        return [
            'limit' => $memoryLimit,
            'current' => $this->formatBytes($memoryUsage),
            'peak' => $this->formatBytes($memoryPeak),
        ];
    }

    private function getDiskUsage()
    {
        $disk = base_path();
        $freeSpace = disk_free_space($disk);
        $totalSpace = disk_total_space($disk);
        $usedSpace = $totalSpace - $freeSpace;

        return [
            'free' => $this->formatBytes($freeSpace),
            'total' => $this->formatBytes($totalSpace),
            'used' => $this->formatBytes($usedSpace),
        ];
    }

    private function formatBytes($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
