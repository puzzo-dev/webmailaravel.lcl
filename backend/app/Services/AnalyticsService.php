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
} 
 
 
 
 
 