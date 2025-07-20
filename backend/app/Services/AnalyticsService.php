<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\User;
use App\Models\Domain;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\CacheManagementTrait;

class AnalyticsService
{
    use LoggingTrait, ValidationTrait, CacheManagementTrait;

    public function __construct()
    {
        // No dependencies needed
    }

    /**
     * Get dashboard analytics
     */
    public function getDashboardAnalytics(): array
    {
        $now = now();
        $lastMonth = $now->copy()->subMonth();
        $lastWeek = $now->copy()->subWeek();

        return [
            'campaigns' => $this->getCampaignAnalytics($now, $lastMonth),
            'users' => $this->getUserAnalytics($now, $lastMonth),
            'revenue' => $this->getRevenueAnalytics($now, $lastMonth),
            'deliverability' => $this->getDeliverabilityAnalytics($now, $lastWeek),
            'reputation' => $this->getReputationAnalytics(),
            'performance' => $this->getPerformanceMetrics($now, $lastMonth)
        ];
    }

    /**
     * Get campaign analytics
     */
    public function getCampaignAnalytics(Carbon $now, Carbon $lastMonth): array
    {
        $totalCampaigns = Campaign::count();
        $activeCampaigns = Campaign::where('status', 'active')->count();
        $completedCampaigns = Campaign::where('status', 'completed')->count();
        $failedCampaigns = Campaign::where('status', 'failed')->count();

        $monthlyCampaigns = Campaign::whereBetween('created_at', [$lastMonth, $now])->count();
        $weeklyCampaigns = Campaign::whereBetween('created_at', [$now->copy()->subWeek(), $now])->count();

        $totalEmailsSent = Campaign::sum('emails_sent');
        $totalEmailsDelivered = Campaign::sum('emails_delivered');
        $totalBounces = Campaign::sum('bounces');
        $totalComplaints = Campaign::sum('complaints');

        return [
            'total' => $totalCampaigns,
            'active' => $activeCampaigns,
            'completed' => $completedCampaigns,
            'failed' => $failedCampaigns,
            'monthly_created' => $monthlyCampaigns,
            'weekly_created' => $weeklyCampaigns,
            'emails_sent' => $totalEmailsSent,
            'emails_delivered' => $totalEmailsDelivered,
            'bounces' => $totalBounces,
            'complaints' => $totalComplaints,
            'delivery_rate' => $totalEmailsSent > 0 ? ($totalEmailsDelivered / $totalEmailsSent) * 100 : 0,
            'bounce_rate' => $totalEmailsSent > 0 ? ($totalBounces / $totalEmailsSent) * 100 : 0,
            'complaint_rate' => $totalEmailsSent > 0 ? ($totalComplaints / $totalEmailsSent) * 100 : 0
        ];
    }

    /**
     * Get performance metrics
     */
    public function getPerformanceMetrics(Carbon $now, Carbon $lastMonth): array
    {
        $campaigns = Campaign::whereBetween('created_at', [$lastMonth, $now])->get();
        
        $avgEmailsPerCampaign = $campaigns->count() > 0 ? $campaigns->avg('emails_sent') : 0;
        $avgDeliveryRate = $campaigns->count() > 0 ? $campaigns->avg('delivery_rate') : 0;
        $avgOpenRate = $campaigns->count() > 0 ? $campaigns->avg('open_rate') : 0;
        $avgClickRate = $campaigns->count() > 0 ? $campaigns->avg('click_rate') : 0;

        return [
            'avg_emails_per_campaign' => round($avgEmailsPerCampaign),
            'avg_delivery_rate' => round($avgDeliveryRate, 2),
            'avg_open_rate' => round($avgOpenRate, 2),
            'avg_click_rate' => round($avgClickRate, 2),
            'total_campaigns_analyzed' => $campaigns->count()
        ];
    }

    /**
     * Get campaign performance report
     */
    public function getCampaignPerformanceReport(int $campaignId): array
    {
        $campaign = Campaign::findOrFail($campaignId);
        
        $hourlyStats = $this->getHourlyStats($campaign);
        $dailyStats = $this->getDailyStats($campaign);
        $domainPerformance = $this->getDomainPerformance($campaign);
        $senderPerformance = $this->getSenderPerformance($campaign);

        return [
            'campaign' => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'status' => $campaign->status,
                'emails_sent' => $campaign->emails_sent,
                'emails_delivered' => $campaign->emails_delivered,
                'bounces' => $campaign->bounces,
                'complaints' => $campaign->complaints,
                'opens' => $campaign->opens,
                'clicks' => $campaign->clicks,
                'delivery_rate' => $campaign->delivery_rate,
                'bounce_rate' => $campaign->bounce_rate,
                'complaint_rate' => $campaign->complaint_rate,
                'open_rate' => $campaign->open_rate,
                'click_rate' => $campaign->click_rate
            ],
            'hourly_stats' => $hourlyStats,
            'daily_stats' => $dailyStats,
            'domain_performance' => $domainPerformance,
            'sender_performance' => $senderPerformance
        ];
    }

    /**
     * Get hourly statistics
     */
    public function getHourlyStats(Campaign $campaign): array
    {
        // TODO: Implement real hourly statistics from campaign logs
        // For now, return empty structure
        return [];
    }

    /**
     * Get daily statistics
     */
    public function getDailyStats(Campaign $campaign): array
    {
        // TODO: Implement real daily statistics from campaign logs
        // For now, return empty structure
        return [];
    }

    /**
     * Get domain performance
     */
    public function getDomainPerformance(Campaign $campaign): array
    {
        // TODO: Implement real domain performance analysis
        // For now, return empty structure
        return [];
    }

    /**
     * Get sender performance
     */
    public function getSenderPerformance(Campaign $campaign): array
    {
        // TODO: Implement real sender performance analysis
        // For now, return empty structure
        return [];
    }

    /**
     * Calculate growth rate
     */
    public function calculateGrowthRate(float $previous, float $current): float
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }

        return (($current - $previous) / $previous) * 100;
    }

    /**
     * Get trending metrics
     */
    public function getTrendingMetrics(int $days = 30): array
    {
        $now = now();
        $startDate = $now->copy()->subDays($days);

        $campaigns = Campaign::whereBetween('created_at', [$startDate, $now])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $users = User::whereBetween('created_at', [$startDate, $now])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'campaigns' => $campaigns,
            'users' => $users,
            'period' => $days
        ];
    }

    /**
     * Get user analytics
     */
    public function getUserAnalytics(Carbon $endDate = null, Carbon $startDate = null): array
    {
        $endDate = $endDate ?? now();
        $startDate = $startDate ?? now()->subMonth();
        
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $newUsersThisMonth = User::whereBetween('created_at', [$startDate, $endDate])->count();
        $newUsersThisWeek = User::whereBetween('created_at', [$endDate->copy()->subWeek(), $endDate])->count();

        $premiumUsers = User::whereHas('subscriptions', function($query) {
            $query->where('status', 'active');
        })->count();

        $userGrowth = $this->calculateGrowthRate(
            User::whereBetween('created_at', [$startDate->copy()->subMonth(), $startDate])->count(),
            $newUsersThisMonth
        );

        return [
            'total' => $totalUsers,
            'active' => $activeUsers,
            'premium' => $premiumUsers,
            'new_this_month' => $newUsersThisMonth,
            'new_this_week' => $newUsersThisWeek,
            'growth_rate' => $userGrowth,
            'activation_rate' => $totalUsers > 0 ? ($activeUsers / $totalUsers) * 100 : 0
        ];
    }

    /**
     * Get revenue analytics
     */
    public function getRevenueAnalytics(Carbon $endDate = null, Carbon $startDate = null): array
    {
        $endDate = $endDate ?? now();
        $startDate = $startDate ?? now()->subMonth();
        
        $totalRevenue = Subscription::where('status', 'active')
            ->sum('payment_amount');

        $monthlyRevenue = Subscription::where('status', 'active')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->sum('payment_amount');

        $weeklyRevenue = Subscription::where('status', 'active')
            ->whereBetween('paid_at', [$endDate->copy()->subWeek(), $endDate])
            ->sum('payment_amount');

        $activeSubscriptions = Subscription::where('status', 'active')->count();
        $totalSubscriptions = Subscription::count();

        $revenueGrowth = $this->calculateGrowthRate(
            Subscription::where('status', 'active')
                ->whereBetween('paid_at', [$startDate->copy()->subMonth(), $startDate])
                ->sum('payment_amount'),
            $monthlyRevenue
        );

        return [
            'total' => $totalRevenue,
            'monthly' => $monthlyRevenue,
            'weekly' => $weeklyRevenue,
            'active_subscriptions' => $activeSubscriptions,
            'total_subscriptions' => $totalSubscriptions,
            'growth_rate' => $revenueGrowth,
            'average_revenue_per_user' => $activeSubscriptions > 0 ? $totalRevenue / $activeSubscriptions : 0
        ];
    }

    /**
     * Get deliverability analytics
     */
    public function getDeliverabilityAnalytics(Carbon $endDate = null, Carbon $startDate = null): array
    {
        $endDate = $endDate ?? now();
        $startDate = $startDate ?? now()->subWeek();
        
        $recentCampaigns = Campaign::whereBetween('created_at', [$startDate, $endDate])->get();

        $totalSent = $recentCampaigns->sum('emails_sent');
        $totalDelivered = $recentCampaigns->sum('emails_delivered');
        $totalBounces = $recentCampaigns->sum('bounces');
        $totalComplaints = $recentCampaigns->sum('complaints');

        $deliveryRate = $totalSent > 0 ? ($totalDelivered / $totalSent) * 100 : 0;
        $bounceRate = $totalSent > 0 ? ($totalBounces / $totalSent) * 100 : 0;
        $complaintRate = $totalSent > 0 ? ($totalComplaints / $totalSent) * 100 : 0;

        return [
            'delivery_rate' => round($deliveryRate, 2),
            'bounce_rate' => round($bounceRate, 2),
            'complaint_rate' => round($complaintRate, 2),
            'total_sent' => $totalSent,
            'total_delivered' => $totalDelivered,
            'total_bounces' => $totalBounces,
            'total_complaints' => $totalComplaints
        ];
    }

    /**
     * Get reputation analytics
     */
    public function getReputationAnalytics(): array
    {
        $domains = Domain::all();
        $totalDomains = $domains->count();
        
        $lowRiskDomains = $domains->where('risk_level', 'low')->count();
        $mediumRiskDomains = $domains->where('risk_level', 'medium')->count();
        $highRiskDomains = $domains->where('risk_level', 'high')->count();

        $averageReputationScore = $domains->avg('reputation_score') ?? 0;
        $averageBounceRate = $domains->avg('bounce_rate') ?? 0;
        $averageComplaintRate = $domains->avg('complaint_rate') ?? 0;

        return [
            'total_domains' => $totalDomains,
            'low_risk' => $lowRiskDomains,
            'medium_risk' => $mediumRiskDomains,
            'high_risk' => $highRiskDomains,
            'average_reputation_score' => round($averageReputationScore, 2),
            'average_bounce_rate' => round($averageBounceRate, 2),
            'average_complaint_rate' => round($averageComplaintRate, 2),
            'risk_distribution' => [
                'low' => $totalDomains > 0 ? ($lowRiskDomains / $totalDomains) * 100 : 0,
                'medium' => $totalDomains > 0 ? ($mediumRiskDomains / $totalDomains) * 100 : 0,
                'high' => $totalDomains > 0 ? ($highRiskDomains / $totalDomains) * 100 : 0
            ]
        ];
    }

    /**
     * Get user growth analytics for admin dashboard
     * 
     * @param string $period Period for analysis (daily, weekly, monthly, yearly)
     * @param int $limit Number of periods to analyze
     * @return array
     */
    public function getUserGrowth(string $period = 'monthly', int $limit = 12): array
    {
        $now = now();
        $growthData = [];
        
        switch ($period) {
            case 'daily':
                $growthData = $this->getDailyUserGrowth($now, $limit);
                break;
            case 'weekly':
                $growthData = $this->getWeeklyUserGrowth($now, $limit);
                break;
            case 'monthly':
                $growthData = $this->getMonthlyUserGrowth($now, $limit);
                break;
            case 'yearly':
                $growthData = $this->getYearlyUserGrowth($now, $limit);
                break;
            default:
                $growthData = $this->getMonthlyUserGrowth($now, $limit);
        }

        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $premiumUsers = User::whereHas('subscriptions', function($query) {
            $query->where('status', 'active');
        })->count();

        // Calculate growth rates
        $currentPeriod = $growthData['periods'][count($growthData['periods']) - 1] ?? 0;
        $previousPeriod = $growthData['periods'][count($growthData['periods']) - 2] ?? 0;
        $growthRate = $this->calculateGrowthRate($previousPeriod, $currentPeriod);

        // Calculate average growth rate
        $totalGrowth = 0;
        $growthCount = 0;
        for ($i = 1; $i < count($growthData['periods']); $i++) {
            if ($growthData['periods'][$i - 1] > 0) {
                $periodGrowth = $this->calculateGrowthRate($growthData['periods'][$i - 1], $growthData['periods'][$i]);
                $totalGrowth += $periodGrowth;
                $growthCount++;
            }
        }
        $averageGrowthRate = $growthCount > 0 ? $totalGrowth / $growthCount : 0;

        return [
            'period' => $period,
            'limit' => $limit,
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'premium_users' => $premiumUsers,
            'current_period_signups' => $currentPeriod,
            'previous_period_signups' => $previousPeriod,
            'growth_rate' => round($growthRate, 2),
            'average_growth_rate' => round($averageGrowthRate, 2),
            'periods' => $growthData['periods'],
            'labels' => $growthData['labels'],
            'cumulative_users' => $growthData['cumulative'],
            'trend' => $growthRate > 0 ? 'up' : ($growthRate < 0 ? 'down' : 'stable'),
            'summary' => [
                'total_signups' => array_sum($growthData['periods']),
                'average_signups_per_period' => count($growthData['periods']) > 0 ? round(array_sum($growthData['periods']) / count($growthData['periods']), 2) : 0,
                'peak_signups' => max($growthData['periods']),
                'lowest_signups' => min($growthData['periods'])
            ]
        ];
    }

    /**
     * Get daily user growth data
     */
    private function getDailyUserGrowth(Carbon $endDate, int $limit): array
    {
        $startDate = $endDate->copy()->subDays($limit - 1);
        
        $dailySignups = User::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $periods = [];
        $labels = [];
        $cumulative = [];
        $totalCumulative = User::where('created_at', '<', $startDate)->count();

        for ($i = 0; $i < $limit; $i++) {
            $date = $startDate->copy()->addDays($i);
            $dateKey = $date->format('Y-m-d');
            $count = $dailySignups->get($dateKey)?->count ?? 0;
            
            $periods[] = $count;
            $labels[] = $date->format('M d');
            $totalCumulative += $count;
            $cumulative[] = $totalCumulative;
        }

        return [
            'periods' => $periods,
            'labels' => $labels,
            'cumulative' => $cumulative
        ];
    }

    /**
     * Get weekly user growth data
     */
    private function getWeeklyUserGrowth(Carbon $endDate, int $limit): array
    {
        $startDate = $endDate->copy()->subWeeks($limit - 1);
        
        $weeklySignups = User::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('strftime("%Y-%W", created_at) as week, COUNT(*) as count')
            ->groupBy('week')
            ->orderBy('week')
            ->get()
            ->keyBy('week');

        $periods = [];
        $labels = [];
        $cumulative = [];
        $totalCumulative = User::where('created_at', '<', $startDate)->count();

        for ($i = 0; $i < $limit; $i++) {
            $weekStart = $startDate->copy()->addWeeks($i);
            $weekKey = $weekStart->format('Y-W');
            $count = $weeklySignups->get($weekKey)?->count ?? 0;
            
            $periods[] = $count;
            $labels[] = $weekStart->format('M d');
            $totalCumulative += $count;
            $cumulative[] = $totalCumulative;
        }

        return [
            'periods' => $periods,
            'labels' => $labels,
            'cumulative' => $cumulative
        ];
    }

    /**
     * Get monthly user growth data
     */
    private function getMonthlyUserGrowth(Carbon $endDate, int $limit): array
    {
        $startDate = $endDate->copy()->subMonths($limit - 1);
        
        $monthlySignups = User::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('strftime("%Y-%m", created_at) as year_month, COUNT(*) as count')
            ->groupBy('year_month')
            ->orderBy('year_month')
            ->get()
            ->keyBy('year_month');

        $periods = [];
        $labels = [];
        $cumulative = [];
        $totalCumulative = User::where('created_at', '<', $startDate)->count();

        for ($i = 0; $i < $limit; $i++) {
            $monthStart = $startDate->copy()->addMonths($i);
            $yearMonthKey = $monthStart->format('Y-m');
            $count = $monthlySignups->get($yearMonthKey)?->count ?? 0;
            
            $periods[] = $count;
            $labels[] = $monthStart->format('M Y');
            $totalCumulative += $count;
            $cumulative[] = $totalCumulative;
        }

        return [
            'periods' => $periods,
            'labels' => $labels,
            'cumulative' => $cumulative
        ];
    }

    /**
     * Get yearly user growth data
     */
    private function getYearlyUserGrowth(Carbon $endDate, int $limit): array
    {
        $startDate = $endDate->copy()->subYears($limit - 1);
        
        $yearlySignups = User::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('strftime("%Y", created_at) as year, COUNT(*) as count')
            ->groupBy('year')
            ->orderBy('year')
            ->get()
            ->keyBy('year');

        $periods = [];
        $labels = [];
        $cumulative = [];
        $totalCumulative = User::where('created_at', '<', $startDate)->count();

        for ($i = 0; $i < $limit; $i++) {
            $yearStart = $startDate->copy()->addYears($i);
            $year = $yearStart->format('Y');
            $count = $yearlySignups->get($year)?->count ?? 0;
            
            $periods[] = $count;
            $labels[] = $yearStart->format('Y');
            $totalCumulative += $count;
            $cumulative[] = $totalCumulative;
        }

        return [
            'periods' => $periods,
            'labels' => $labels,
            'cumulative' => $cumulative
        ];
    }

    /**
     * Get campaign performance analytics for admin dashboard
     * 
     * @param array $params Query parameters (period, limit, campaign_id, etc.)
     * @return array
     */
    public function getCampaignPerformance(array $params = []): array
    {
        $period = $params['period'] ?? 'monthly';
        $limit = $params['limit'] ?? 12;
        $campaignId = $params['campaign_id'] ?? null;
        
        $now = now();
        $startDate = $now->copy()->subMonths($limit - 1);
        
        $query = Campaign::query();
        
        // Filter by specific campaign if provided
        if ($campaignId) {
            $query->where('id', $campaignId);
        }
        
        // Get campaigns within the date range
        $campaigns = $query->whereBetween('created_at', [$startDate, $now])
            ->with(['user', 'sender'])
            ->get();
        
        // Calculate performance metrics
        $totalCampaigns = $campaigns->count();
        $activeCampaigns = $campaigns->where('status', 'RUNNING')->count();
        $completedCampaigns = $campaigns->where('status', 'COMPLETED')->count();
        $failedCampaigns = $campaigns->where('status', 'FAILED')->count();
        
        $totalEmailsSent = $campaigns->sum('total_sent');
        $totalEmailsDelivered = $campaigns->sum('emails_delivered');
        $totalOpens = $campaigns->sum('opens');
        $totalClicks = $campaigns->sum('clicks');
        $totalBounces = $campaigns->sum('bounces');
        $totalComplaints = $campaigns->sum('complaints');
        
        // Calculate rates
        $deliveryRate = $totalEmailsSent > 0 ? ($totalEmailsDelivered / $totalEmailsSent) * 100 : 0;
        $openRate = $totalEmailsDelivered > 0 ? ($totalOpens / $totalEmailsDelivered) * 100 : 0;
        $clickRate = $totalEmailsDelivered > 0 ? ($totalClicks / $totalEmailsDelivered) * 100 : 0;
        $bounceRate = $totalEmailsSent > 0 ? ($totalBounces / $totalEmailsSent) * 100 : 0;
        $complaintRate = $totalEmailsSent > 0 ? ($totalComplaints / $totalEmailsSent) * 100 : 0;
        
        // Get performance by period
        $performanceByPeriod = $this->getCampaignPerformanceByPeriod($campaigns, $period, $limit);
        
        // Get top performing campaigns
        $topCampaigns = $campaigns->sortByDesc('opens')
            ->take(5)
            ->map(function ($campaign) {
                return [
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                    'user' => $campaign->user->name ?? 'Unknown',
                    'status' => $campaign->status,
                    'emails_sent' => $campaign->total_sent,
                    'opens' => $campaign->opens,
                    'clicks' => $campaign->clicks,
                    'open_rate' => $campaign->open_rate,
                    'click_rate' => $campaign->click_rate,
                    'created_at' => $campaign->created_at->format('Y-m-d H:i:s')
                ];
            });
        
        return [
            'summary' => [
                'total_campaigns' => $totalCampaigns,
                'active_campaigns' => $activeCampaigns,
                'completed_campaigns' => $completedCampaigns,
                'failed_campaigns' => $failedCampaigns,
                'total_emails_sent' => $totalEmailsSent,
                'total_emails_delivered' => $totalEmailsDelivered,
                'total_opens' => $totalOpens,
                'total_clicks' => $totalClicks,
                'total_bounces' => $totalBounces,
                'total_complaints' => $totalComplaints
            ],
            'rates' => [
                'delivery_rate' => round($deliveryRate, 2),
                'open_rate' => round($openRate, 2),
                'click_rate' => round($clickRate, 2),
                'bounce_rate' => round($bounceRate, 2),
                'complaint_rate' => round($complaintRate, 2)
            ],
            'performance_by_period' => $performanceByPeriod,
            'top_campaigns' => $topCampaigns,
            'period' => $period,
            'limit' => $limit
        ];
    }
    
    /**
     * Get campaign performance data by period
     */
    private function getCampaignPerformanceByPeriod($campaigns, string $period, int $limit): array
    {
        $now = now();
        $startDate = $now->copy()->subMonths($limit - 1);
        
        $periods = [];
        $labels = [];
        $emailsSent = [];
        $opens = [];
        $clicks = [];
        
        for ($i = 0; $i < $limit; $i++) {
            $periodStart = $startDate->copy()->addMonths($i);
            $periodEnd = $periodStart->copy()->addMonth();
            
            $periodCampaigns = $campaigns->filter(function ($campaign) use ($periodStart, $periodEnd) {
                return $campaign->created_at >= $periodStart && $campaign->created_at < $periodEnd;
            });
            
            $periods[] = $periodCampaigns->count();
            $labels[] = $periodStart->format('M Y');
            $emailsSent[] = $periodCampaigns->sum('total_sent');
            $opens[] = $periodCampaigns->sum('opens');
            $clicks[] = $periodCampaigns->sum('clicks');
        }
        
        return [
            'periods' => $periods,
            'labels' => $labels,
            'emails_sent' => $emailsSent,
            'opens' => $opens,
            'clicks' => $clicks
        ];
    }

    /**
     * Get deliverability stats (alias for getDeliverabilityAnalytics)
     */
    public function getDeliverabilityStats(string $timeRange = '7d'): array
    {
        return $this->getDeliverabilityAnalytics();
    }

    /**
     * Get revenue metrics (alias for getRevenueAnalytics)
     */
    public function getRevenueMetrics(string $timeRange = '30d'): array
    {
        return $this->getRevenueAnalytics();
    }
} 
 
 
 
 
 