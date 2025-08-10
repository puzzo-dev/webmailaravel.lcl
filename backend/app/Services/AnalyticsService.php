<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\User;
use App\Models\Domain;
use App\Models\Subscription;
use App\Models\EmailTracking;
use App\Models\ClickTracking;
use App\Models\BounceCredential;
use App\Models\BounceProcessingLog;
use App\Models\SuppressionList;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
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
     * Get dashboard analytics (admin-only - system-wide)
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
            'performance' => $this->getPerformanceMetrics($now, $lastMonth),
            'bounce_processing' => $this->getBounceProcessingAnalytics($now, $lastMonth),
            'suppression' => $this->getSuppressionAnalytics($now, $lastMonth),
            
            // Add time-series chart data for frontend
            'charts' => [
                'campaign_performance' => $this->getCampaignPerformanceChartData($now, $lastWeek),
                'user_growth' => $this->getUserGrowthChartData($now, $lastMonth),
                'email_volume' => $this->getEmailVolumeChartData($now, $lastWeek),
                'deliverability_trends' => $this->getDeliverabilityTrendsChartData($now, $lastWeek),
                'campaign_status_distribution' => $this->getCampaignStatusDistribution(),
                'bounce_trends' => $this->getBounceTrendsChartData($now, $lastWeek),
            ]
        ];
    }

    /**
     * Get user-specific dashboard analytics (filtered by user)
     */
    public function getUserDashboardAnalytics(User $user): array
    {
        $now = now();
        $lastMonth = $now->copy()->subMonth();
        $lastWeek = $now->copy()->subWeek();

        return [
            'campaigns' => $this->getUserCampaignAnalytics($user, $now, $lastMonth),
            'deliverability' => $this->getUserDeliverabilityAnalytics($user, $now, $lastWeek),
            'performance' => $this->getUserPerformanceMetrics($user, $now, $lastMonth),
            'engagement' => $this->getUserEngagementAnalytics($user, $now, $lastMonth),
            'recent_activity' => $this->getUserRecentActivity($user, 10),
            
            // Add time-series chart data for user dashboard
            'charts' => [
                'email_performance' => $this->getUserEmailPerformanceChartData($user, $now, $lastWeek),
                'campaign_trends' => $this->getUserCampaignTrendsChartData($user, $now, $lastMonth),
                'engagement_trends' => $this->getUserEngagementTrendsChartData($user, $now, $lastWeek),
            ]
        ];
    }

    /**
     * Get user-specific campaign analytics
     */
    public function getUserCampaignAnalytics(User $user, Carbon $now, Carbon $lastMonth): array
    {
        $userCampaigns = $user->campaigns();
        
        $totalCampaigns = $userCampaigns->count();
        $activeCampaigns = $userCampaigns->where('status', 'active')->count();
        $completedCampaigns = $userCampaigns->where('status', 'completed')->count();
        $failedCampaigns = $userCampaigns->where('status', 'failed')->count();

        $monthlyCampaigns = $userCampaigns->whereBetween('created_at', [$lastMonth, $now])->count();
        $weeklyCampaigns = $userCampaigns->whereBetween('created_at', [$now->copy()->subWeek(), $now])->count();

        $totalEmailsSent = $userCampaigns->sum('total_sent');
        $totalEmailsDelivered = $userCampaigns->sum('total_sent') - $userCampaigns->sum('total_failed');
        $totalBounces = $userCampaigns->sum('bounces');
        $totalComplaints = $userCampaigns->sum('complaints');
        $totalOpens = $userCampaigns->sum('opens');
        $totalClicks = $userCampaigns->sum('clicks');

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
            'opens' => $totalOpens,
            'clicks' => $totalClicks,
            'delivery_rate' => $totalEmailsSent > 0 ? ($totalEmailsDelivered / $totalEmailsSent) * 100 : 0,
            'bounce_rate' => $totalEmailsSent > 0 ? ($totalBounces / $totalEmailsSent) * 100 : 0,
            'complaint_rate' => $totalEmailsSent > 0 ? ($totalComplaints / $totalEmailsSent) * 100 : 0,
            'open_rate' => $totalEmailsSent > 0 ? ($totalOpens / $totalEmailsSent) * 100 : 0,
            'click_rate' => $totalEmailsSent > 0 ? ($totalClicks / $totalEmailsSent) * 100 : 0,
            'click_through_rate' => $totalOpens > 0 ? ($totalClicks / $totalOpens) * 100 : 0
        ];
    }

    /**
     * Get campaign analytics (admin-only - system-wide)
     */
    public function getCampaignAnalytics(Carbon $now, Carbon $lastMonth): array
    {
        $totalCampaigns = Campaign::count();
        $activeCampaigns = Campaign::where('status', 'active')->count();
        $completedCampaigns = Campaign::where('status', 'completed')->count();
        $failedCampaigns = Campaign::where('status', 'failed')->count();

        $monthlyCampaigns = Campaign::whereBetween('created_at', [$lastMonth, $now])->count();
        $weeklyCampaigns = Campaign::whereBetween('created_at', [$now->copy()->subWeek(), $now])->count();

        $totalEmailsSent = Campaign::sum('total_sent');
        $totalEmailsDelivered = Campaign::sum('total_sent') - Campaign::sum('total_failed');
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
     * Get user-specific deliverability analytics
     */
    public function getUserDeliverabilityAnalytics(User $user, Carbon $now, Carbon $lastWeek): array
    {
        $userCampaigns = $user->campaigns()->whereBetween('created_at', [$lastWeek, $now]);
        
        $totalSent = $userCampaigns->sum('total_sent');
        $totalDelivered = $totalSent - $userCampaigns->sum('total_failed');
        $totalBounces = $userCampaigns->sum('bounces');
        $totalComplaints = $userCampaigns->sum('complaints');

        return [
            'emails_sent' => $totalSent,
            'emails_delivered' => $totalDelivered,
            'bounces' => $totalBounces,
            'complaints' => $totalComplaints,
            'delivery_rate' => $totalSent > 0 ? ($totalDelivered / $totalSent) * 100 : 0,
            'bounce_rate' => $totalSent > 0 ? ($totalBounces / $totalSent) * 100 : 0,
            'complaint_rate' => $totalSent > 0 ? ($totalComplaints / $totalSent) * 100 : 0,
        ];
    }

    /**
     * Get user-specific performance metrics
     */
    public function getUserPerformanceMetrics(User $user, Carbon $now, Carbon $lastMonth): array
    {
        $campaigns = $user->campaigns()->whereBetween('created_at', [$lastMonth, $now])->get();
        
        $avgEmailsPerCampaign = $campaigns->count() > 0 ? $campaigns->avg('total_sent') : 0;
        $avgDeliveryRate = $campaigns->count() > 0 ? $campaigns->map(function($c) {
            return $c->total_sent > 0 ? (($c->total_sent - $c->total_failed) / $c->total_sent) * 100 : 0;
        })->avg() : 0;
        $avgOpenRate = $campaigns->count() > 0 ? $campaigns->avg('open_rate') : 0;
        $avgClickRate = $campaigns->count() > 0 ? $campaigns->avg('click_rate') : 0;

        return [
            'avg_emails_per_campaign' => round($avgEmailsPerCampaign ?: 0),
            'avg_delivery_rate' => round($avgDeliveryRate ?: 0, 2),
            'avg_open_rate' => round($avgOpenRate ?: 0, 2),
            'avg_click_rate' => round($avgClickRate ?: 0, 2),
            'total_campaigns_analyzed' => $campaigns->count()
        ];
    }

    /**
     * Get user-specific engagement analytics
     */
    public function getUserEngagementAnalytics(User $user, Carbon $now, Carbon $lastMonth): array
    {
        $userCampaigns = $user->campaigns()->whereBetween('created_at', [$lastMonth, $now]);
        
        $totalOpens = $userCampaigns->sum('opens');
        $totalClicks = $userCampaigns->sum('clicks');
        $totalSent = $userCampaigns->sum('total_sent');
        $uniqueOpens = $userCampaigns->sum('unique_opens');
        $uniqueClicks = $userCampaigns->sum('unique_clicks');

        return [
            'total_opens' => $totalOpens,
            'total_clicks' => $totalClicks,
            'unique_opens' => $uniqueOpens,
            'unique_clicks' => $uniqueClicks,
            'open_rate' => $totalSent > 0 ? ($totalOpens / $totalSent) * 100 : 0,
            'click_rate' => $totalSent > 0 ? ($totalClicks / $totalSent) * 100 : 0,
            'click_through_rate' => $totalOpens > 0 ? ($totalClicks / $totalOpens) * 100 : 0,
        ];
    }

    /**
     * Get user recent activity
     */
    public function getUserRecentActivity(User $user, int $limit = 10): array
    {
        $recentCampaigns = $user->campaigns()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get(['id', 'name', 'status', 'total_sent', 'opens', 'clicks', 'created_at'])
            ->map(function($campaign) {
                return [
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                    'status' => $campaign->status,
                    'emails_sent' => $campaign->total_sent,
                    'opens' => $campaign->opens,
                    'clicks' => $campaign->clicks,
                    'created_at' => $campaign->created_at->format('Y-m-d H:i:s'),
                    'type' => 'campaign'
                ];
            });

        return $recentCampaigns->toArray();
    }

    /**
     * Get user-specific trending metrics
     */
    public function getUserTrendingMetrics(User $user, int $days = 7): array
    {
        $now = now();
        $startDate = $now->copy()->subDays($days);
        
        $campaigns = $user->campaigns()
            ->whereBetween('created_at', [$startDate, $now])
            ->get();

        $totalSent = $campaigns->sum('total_sent');
        $totalOpens = $campaigns->sum('opens');
        $totalClicks = $campaigns->sum('clicks');
        $totalBounces = $campaigns->sum('bounces');

        // Calculate trends by comparing with previous period
        $previousStartDate = $startDate->copy()->subDays($days);
        $previousCampaigns = $user->campaigns()
            ->whereBetween('created_at', [$previousStartDate, $startDate])
            ->get();

        $previousSent = $previousCampaigns->sum('total_sent');
        $previousOpens = $previousCampaigns->sum('opens');
        $previousClicks = $previousCampaigns->sum('clicks');

        return [
            'current_period' => [
                'emails_sent' => $totalSent,
                'opens' => $totalOpens,
                'clicks' => $totalClicks,
                'bounces' => $totalBounces,
                'campaigns' => $campaigns->count(),
                'open_rate' => $totalSent > 0 ? ($totalOpens / $totalSent) * 100 : 0,
                'click_rate' => $totalSent > 0 ? ($totalClicks / $totalSent) * 100 : 0,
            ],
            'previous_period' => [
                'emails_sent' => $previousSent,
                'opens' => $previousOpens,
                'clicks' => $previousClicks,
                'campaigns' => $previousCampaigns->count(),
            ],
            'trends' => [
                'emails_sent_change' => $previousSent > 0 ? (($totalSent - $previousSent) / $previousSent) * 100 : 0,
                'opens_change' => $previousOpens > 0 ? (($totalOpens - $previousOpens) / $previousOpens) * 100 : 0,
                'clicks_change' => $previousClicks > 0 ? (($totalClicks - $previousClicks) / $previousClicks) * 100 : 0,
                'campaigns_change' => $previousCampaigns->count() > 0 ? (($campaigns->count() - $previousCampaigns->count()) / $previousCampaigns->count()) * 100 : 0,
            ],
            'period_days' => $days
        ];
    }

    /**
     * Get user email performance chart data
     */
    public function getUserEmailPerformanceChartData(User $user, Carbon $now, Carbon $lastWeek): array
    {
        $campaigns = $user->campaigns()
            ->whereBetween('created_at', [$lastWeek, $now])
            ->orderBy('created_at')
            ->get(['name', 'total_sent', 'opens', 'clicks', 'bounces', 'created_at']);

        return $campaigns->map(function($campaign) {
            return [
                'date' => $campaign->created_at->format('Y-m-d'),
                'campaign' => $campaign->name,
                'sent' => $campaign->total_sent,
                'opens' => $campaign->opens,
                'clicks' => $campaign->clicks,
                'bounces' => $campaign->bounces,
            ];
        })->toArray();
    }

    /**
     * Get user campaign trends chart data
     */
    public function getUserCampaignTrendsChartData(User $user, Carbon $now, Carbon $lastMonth): array
    {
        $campaigns = $user->campaigns()
            ->whereBetween('created_at', [$lastMonth, $now])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(total_sent) as emails_sent')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $campaigns->map(function($item) {
            return [
                'date' => $item->date,
                'campaigns' => $item->count,
                'emails_sent' => $item->emails_sent,
            ];
        })->toArray();
    }

    /**
     * Get user engagement trends chart data
     */
    public function getUserEngagementTrendsChartData(User $user, Carbon $now, Carbon $lastWeek): array
    {
        $campaigns = $user->campaigns()
            ->whereBetween('created_at', [$lastWeek, $now])
            ->selectRaw('DATE(created_at) as date, SUM(opens) as opens, SUM(clicks) as clicks, SUM(total_sent) as sent')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $campaigns->map(function($item) {
            return [
                'date' => $item->date,
                'opens' => $item->opens,
                'clicks' => $item->clicks,
                'open_rate' => $item->sent > 0 ? ($item->opens / $item->sent) * 100 : 0,
                'click_rate' => $item->sent > 0 ? ($item->clicks / $item->sent) * 100 : 0,
            ];
        })->toArray();
    }

    /**
     * Get performance metrics (admin-only - system-wide)
     */
    public function getPerformanceMetrics(Carbon $now, Carbon $lastMonth): array
    {
        $campaigns = Campaign::whereBetween('created_at', [$lastMonth, $now])->get();
        
        $avgEmailsPerCampaign = $campaigns->count() > 0 ? $campaigns->avg('total_sent') : 0;
        $avgDeliveryRate = $campaigns->count() > 0 ? $campaigns->map(function($c) {
            return $c->total_sent > 0 ? (($c->total_sent - $c->total_failed) / $c->total_sent) * 100 : 0;
        })->avg() : 0;
        $avgOpenRate = $campaigns->count() > 0 ? $campaigns->avg('open_rate') : 0;
        $avgClickRate = $campaigns->count() > 0 ? $campaigns->avg('click_rate') : 0;

        return [
            'avg_emails_per_campaign' => round($avgEmailsPerCampaign ?: 0),
            'avg_delivery_rate' => round($avgDeliveryRate ?: 0, 2),
            'avg_open_rate' => round($avgOpenRate ?: 0, 2),
            'avg_click_rate' => round($avgClickRate ?: 0, 2),
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
                'emails_sent' => $campaign->total_sent,
                'emails_delivered' => $campaign->total_sent - $campaign->total_failed,
                'bounces' => $campaign->bounces,
                'complaints' => $campaign->complaints,
                'opens' => $campaign->opens,
                'clicks' => $campaign->clicks,
                'delivery_rate' => $campaign->total_sent > 0 ? (($campaign->total_sent - $campaign->total_failed) / $campaign->total_sent) * 100 : 0,
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
        $hours = [];
        $now = now();
        
        // Get stats for last 24 hours
        for ($i = 23; $i >= 0; $i--) {
            $hour = $now->copy()->subHours($i);
            $hourStart = $hour->format('Y-m-d H:00:00');
            $hourEnd = $hour->format('Y-m-d H:59:59');
            
            // Get email statistics for this hour using EmailTracking model
            $sent = EmailTracking::where('campaign_id', $campaign->id)
                ->whereBetween('sent_at', [$hourStart, $hourEnd])
                ->count();
                
            $opened = EmailTracking::where('campaign_id', $campaign->id)
                ->whereNotNull('opened_at')
                ->whereBetween('opened_at', [$hourStart, $hourEnd])
                ->count();
                
            $clicked = EmailTracking::where('campaign_id', $campaign->id)
                ->whereNotNull('clicked_at')
                ->whereBetween('clicked_at', [$hourStart, $hourEnd])
                ->count();
                
            $bounced = EmailTracking::where('campaign_id', $campaign->id)
                ->whereNotNull('bounced_at')
                ->whereBetween('bounced_at', [$hourStart, $hourEnd])
                ->count();
            
            $hours[] = [
                'hour' => $hour->format('H:00'),
                'timestamp' => $hour->toISOString(),
                'sent' => $sent,
                'opened' => $opened,
                'clicked' => $clicked,
                'bounced' => $bounced,
                'open_rate' => $sent > 0 ? round(($opened / $sent) * 100, 2) : 0,
                'click_rate' => $sent > 0 ? round(($clicked / $sent) * 100, 2) : 0,
                'bounce_rate' => $sent > 0 ? round(($bounced / $sent) * 100, 2) : 0,
            ];
        }
        
        return $hours;
    }

    /**
     * Get daily statistics
     */
    public function getDailyStats(Campaign $campaign): array
    {
        $days = [];
        $now = now();
        
        // Get stats for last 30 days
        for ($i = 29; $i >= 0; $i--) {
            $day = $now->copy()->subDays($i);
            $dayStart = $day->format('Y-m-d 00:00:00');
            $dayEnd = $day->format('Y-m-d 23:59:59');
            
            // Get email statistics for this day
            $sent = EmailTracking::where('campaign_id', $campaign->id)
                ->whereBetween('sent_at', [$dayStart, $dayEnd])
                ->count();
                
            $opened = EmailTracking::where('campaign_id', $campaign->id)
                ->whereNotNull('opened_at')
                ->whereBetween('opened_at', [$dayStart, $dayEnd])
                ->count();
                
            $clicked = EmailTracking::where('campaign_id', $campaign->id)
                ->whereNotNull('clicked_at')
                ->whereBetween('clicked_at', [$dayStart, $dayEnd])
                ->count();
                
            $bounced = EmailTracking::where('campaign_id', $campaign->id)
                ->whereNotNull('bounced_at')
                ->whereBetween('bounced_at', [$dayStart, $dayEnd])
                ->count();
                
            $complained = EmailTracking::where('campaign_id', $campaign->id)
                ->whereNotNull('complained_at')
                ->whereBetween('complained_at', [$dayStart, $dayEnd])
                ->count();
            
            $days[] = [
                'date' => $day->format('Y-m-d'),
                'day' => $day->format('M j'),
                'timestamp' => $day->toISOString(),
                'sent' => $sent,
                'opened' => $opened,
                'clicked' => $clicked,
                'bounced' => $bounced,
                'complained' => $complained,
                'open_rate' => $sent > 0 ? round(($opened / $sent) * 100, 2) : 0,
                'click_rate' => $sent > 0 ? round(($clicked / $sent) * 100, 2) : 0,
                'bounce_rate' => $sent > 0 ? round(($bounced / $sent) * 100, 2) : 0,
                'complaint_rate' => $sent > 0 ? round(($complained / $sent) * 100, 2) : 0,
            ];
        }
        
        return $days;
    }

    /**
     * Get domain performance
     */
    public function getDomainPerformance(Campaign $campaign): array
    {
        // Get domain performance stats from email tracking
        $domains = DB::table('email_tracking')
            ->join('senders', 'senders.id', '=', 'email_tracking.sender_id')
            ->join('domains', 'domains.id', '=', 'senders.domain_id')
            ->where('email_tracking.campaign_id', $campaign->id)
            ->select(
                'domains.name as domain_name',
                'domains.id as domain_id',
                DB::raw('COUNT(*) as total_sent'),
                DB::raw('SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as total_opened'),
                DB::raw('SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as total_clicked'),
                DB::raw('SUM(CASE WHEN bounced_at IS NOT NULL THEN 1 ELSE 0 END) as total_bounced'),
                DB::raw('SUM(CASE WHEN complained_at IS NOT NULL THEN 1 ELSE 0 END) as total_complained')
            )
            ->groupBy('domains.id', 'domains.name')
            ->get()
            ->map(function ($domain) {
                $sent = $domain->total_sent;
                return [
                    'domain_id' => $domain->domain_id,
                    'domain_name' => $domain->domain_name,
                    'sent' => $sent,
                    'opened' => $domain->total_opened,
                    'clicked' => $domain->total_clicked,
                    'bounced' => $domain->total_bounced,
                    'complained' => $domain->total_complained,
                    'open_rate' => $sent > 0 ? round(($domain->total_opened / $sent) * 100, 2) : 0,
                    'click_rate' => $sent > 0 ? round(($domain->total_clicked / $sent) * 100, 2) : 0,
                    'bounce_rate' => $sent > 0 ? round(($domain->total_bounced / $sent) * 100, 2) : 0,
                    'complaint_rate' => $sent > 0 ? round(($domain->total_complained / $sent) * 100, 2) : 0,
                    'reputation_score' => $this->calculateDomainReputation($domain),
                ];
            })
            ->toArray();
        
        return $domains;
    }

    /**
     * Get sender performance
     */
    public function getSenderPerformance(Campaign $campaign): array
    {
        // Get campaign senders and their performance stats
        // Since email_tracking doesn't have sender_id, we'll aggregate by campaign level
        $campaignSenders = $campaign->senders()->get();
        
        if ($campaignSenders->isEmpty()) {
            return [];
        }
        
        // Get email tracking stats for this campaign
        $trackingStats = DB::table('email_tracking')
            ->where('campaign_id', $campaign->id)
            ->select(
                DB::raw('COUNT(*) as total_sent'),
                DB::raw('SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as total_opened'),
                DB::raw('SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as total_clicked'),
                DB::raw('SUM(CASE WHEN bounced_at IS NOT NULL THEN 1 ELSE 0 END) as total_bounced'),
                DB::raw('SUM(CASE WHEN complained_at IS NOT NULL THEN 1 ELSE 0 END) as total_complained')
            )
            ->first();
        
        $senders = $campaignSenders->map(function ($sender) use ($trackingStats, $campaignSenders) {
            // Distribute stats evenly among senders (simplified approach)
            $senderCount = $campaignSenders->count();
            $sent = $trackingStats ? intval($trackingStats->total_sent / $senderCount) : 0;
            $opened = $trackingStats ? intval($trackingStats->total_opened / $senderCount) : 0;
            $clicked = $trackingStats ? intval($trackingStats->total_clicked / $senderCount) : 0;
            $bounced = $trackingStats ? intval($trackingStats->total_bounced / $senderCount) : 0;
            $complained = $trackingStats ? intval($trackingStats->total_complained / $senderCount) : 0;
            
            return [
                'sender_id' => $sender->id,
                'sender_name' => $sender->name,
                'sender_email' => $sender->email,
                'sent' => $sent,
                'opened' => $opened,
                'clicked' => $clicked,
                'bounced' => $bounced,
                'complained' => $complained,
                'open_rate' => $sent > 0 ? round(($opened / $sent) * 100, 2) : 0,
                'click_rate' => $sent > 0 ? round(($clicked / $sent) * 100, 2) : 0,
                'bounce_rate' => $sent > 0 ? round(($bounced / $sent) * 100, 2) : 0,
                'complaint_rate' => $sent > 0 ? round(($complained / $sent) * 100, 2) : 0,
                'reputation_score' => $this->calculateSenderReputationFromStats($sent, $bounced, $complained, $opened),
                'deliverability_rating' => $this->getSenderDeliverabilityRatingFromStats($sent, $bounced, $complained),
            ];
        })->toArray();
        
        return $senders;
    }

    /**
     * Calculate sender reputation from stats
     */
    private function calculateSenderReputationFromStats(int $sent, int $bounced, int $complained, int $opened): int
    {
        $bounceRate = $sent > 0 ? ($bounced / $sent) * 100 : 0;
        $complaintRate = $sent > 0 ? ($complained / $sent) * 100 : 0;
        $openRate = $sent > 0 ? ($opened / $sent) * 100 : 0;
        
        // Calculate reputation score (0-100)
        $score = 100;
        $score -= ($bounceRate * 2); // Bounce rate penalty
        $score -= ($complaintRate * 5); // Complaint rate penalty
        $score += ($openRate * 0.5); // Open rate bonus
        
        return max(0, min(100, round($score)));
    }
    
    /**
     * Get sender deliverability rating from stats
     */
    private function getSenderDeliverabilityRatingFromStats(int $sent, int $bounced, int $complained): string
    {
        $reputationScore = $this->calculateSenderReputationFromStats($sent, $bounced, $complained, 0);
        
        if ($reputationScore >= 90) return 'Excellent';
        if ($reputationScore >= 80) return 'Good';
        if ($reputationScore >= 70) return 'Fair';
        if ($reputationScore >= 60) return 'Poor';
        return 'Critical';
    }

    /**
     * Calculate domain reputation score
     */
    private function calculateDomainReputation($domain): int
    {
        $bounceRate = $domain->total_sent > 0 ? ($domain->total_bounced / $domain->total_sent) * 100 : 0;
        $complaintRate = $domain->total_sent > 0 ? ($domain->total_complained / $domain->total_sent) * 100 : 0;
        $openRate = $domain->total_sent > 0 ? ($domain->total_opened / $domain->total_sent) * 100 : 0;
        
        // Calculate reputation score (0-100)
        $score = 100;
        $score -= ($bounceRate * 2); // Bounce rate penalty
        $score -= ($complaintRate * 5); // Complaint rate penalty
        $score += ($openRate * 0.5); // Open rate bonus
        
        return max(0, min(100, round($score)));
    }
    
    /**
     * Calculate sender reputation score
     */
    private function calculateSenderReputation($sender): int
    {
        $bounceRate = $sender->total_sent > 0 ? ($sender->total_bounced / $sender->total_sent) * 100 : 0;
        $complaintRate = $sender->total_sent > 0 ? ($sender->total_complained / $sender->total_sent) * 100 : 0;
        $openRate = $sender->total_sent > 0 ? ($sender->total_opened / $sender->total_sent) * 100 : 0;
        
        // Calculate reputation score (0-100)
        $score = 100;
        $score -= ($bounceRate * 2); // Bounce rate penalty
        $score -= ($complaintRate * 5); // Complaint rate penalty
        $score += ($openRate * 0.5); // Open rate bonus
        
        return max(0, min(100, round($score)));
    }
    
    /**
     * Get sender deliverability rating
     */
    private function getSenderDeliverabilityRating($sender): string
    {
        $reputationScore = $this->calculateSenderReputation($sender);
        
        if ($reputationScore >= 90) return 'Excellent';
        if ($reputationScore >= 80) return 'Good';
        if ($reputationScore >= 70) return 'Fair';
        if ($reputationScore >= 60) return 'Poor';
        return 'Critical';
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

        $totalSent = $recentCampaigns->sum('total_sent');
        $totalDelivered = $recentCampaigns->sum('total_sent') - $recentCampaigns->sum('total_failed');
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
            ->with(['user'])
            ->get();
        
        // Calculate performance metrics
        $totalCampaigns = $campaigns->count();
        $activeCampaigns = $campaigns->where('status', 'RUNNING')->count();
        $completedCampaigns = $campaigns->where('status', 'COMPLETED')->count();
        $failedCampaigns = $campaigns->where('status', 'FAILED')->count();
        
        $totalEmailsSent = $campaigns->sum('total_sent');
        $totalEmailsDelivered = $campaigns->sum('total_sent') - $campaigns->sum('total_failed');
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

    /**
     * Get bounce processing analytics
     */
    public function getBounceProcessingAnalytics(Carbon $now, Carbon $lastMonth): array
    {
        $user = auth()->user();
        
        $query = BounceCredential::query();
        if ($user && !$user->hasRole('admin')) {
            $query->where('user_id', $user->id);
        }
        
        $totalCredentials = $query->count();
        $activeCredentials = $query->where('is_active', true)->count();
        $defaultCredentials = $query->where('is_default', true)->count();
        
        // Bounce processing logs analytics
        $logsQuery = BounceProcessingLog::whereBetween('created_at', [$lastMonth, $now]);
        if ($user && !$user->hasRole('admin')) {
            $logsQuery->where('user_id', $user->id);
        }
        
        $totalProcessed = $logsQuery->count();
        $hardBounces = $logsQuery->where('bounce_type', 'hard')->count();
        $softBounces = $logsQuery->where('bounce_type', 'soft')->count();
        $complaints = $logsQuery->where('bounce_type', 'complaint')->count();
        $unsubscribes = $logsQuery->where('bounce_type', 'unsubscribe')->count();
        $addedToSuppression = $logsQuery->where('added_to_suppression', true)->count();
        
        // Recent activity (last 7 days)
        $recentActivity = BounceProcessingLog::whereBetween('created_at', [$now->copy()->subWeek(), $now]);
        if ($user && !$user->hasRole('admin')) {
            $recentActivity->where('user_id', $user->id);
        }
        $recentProcessed = $recentActivity->count();
        
        // Get daily bounce processing trend
        $dailyTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $dayStart = $date->startOfDay();
            $dayEnd = $date->endOfDay();
            
            $trendQuery = BounceProcessingLog::whereBetween('created_at', [$dayStart, $dayEnd]);
            if ($user && !$user->hasRole('admin')) {
                $trendQuery->where('user_id', $user->id);
            }
            
            $dailyTrend[] = [
                'date' => $date->format('M j'),
                'processed' => $trendQuery->count(),
                'hard_bounces' => $trendQuery->where('bounce_type', 'hard')->count(),
                'soft_bounces' => $trendQuery->where('bounce_type', 'soft')->count(),
            ];
        }
        
        return [
            'credentials' => [
                'total' => $totalCredentials,
                'active' => $activeCredentials,
                'default' => $defaultCredentials,
                'inactive' => $totalCredentials - $activeCredentials,
            ],
            'processing' => [
                'total_processed' => $totalProcessed,
                'recent_processed' => $recentProcessed,
                'hard_bounces' => $hardBounces,
                'soft_bounces' => $softBounces,
                'complaints' => $complaints,
                'unsubscribes' => $unsubscribes,
                'added_to_suppression' => $addedToSuppression,
                'suppression_rate' => $totalProcessed > 0 ? round(($addedToSuppression / $totalProcessed) * 100, 2) : 0,
            ],
            'trends' => [
                'daily' => $dailyTrend,
            ]
        ];
    }

    /**
     * Get suppression list analytics
     */
    public function getSuppressionAnalytics(Carbon $now, Carbon $lastMonth): array
    {
        $user = auth()->user();
        
        $query = SuppressionList::query();
        if ($user && !$user->hasRole('admin')) {
            // For regular users, we might want to show system-wide suppression stats
            // since suppression is typically global, but we can filter if needed
        }
        
        $totalSuppressed = $query->count();
        $recentlySuppressed = $query->whereBetween('created_at', [$lastMonth, $now])->count();
        $thisWeekSuppressed = $query->whereBetween('created_at', [$now->copy()->subWeek(), $now])->count();
        
        // Group by reason if available
        $byReason = $query->select('reason', DB::raw('count(*) as count'))
            ->groupBy('reason')
            ->get()
            ->pluck('count', 'reason')
            ->toArray();
        
        // Daily suppression trend
        $dailyTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $dayStart = $date->startOfDay();
            $dayEnd = $date->endOfDay();
            
            $dailyCount = SuppressionList::whereBetween('created_at', [$dayStart, $dayEnd])->count();
            
            $dailyTrend[] = [
                'date' => $date->format('M j'),
                'count' => $dailyCount,
            ];
        }
        
        return [
            'summary' => [
                'total' => $totalSuppressed,
                'recent' => $recentlySuppressed,
                'this_week' => $thisWeekSuppressed,
            ],
            'by_reason' => $byReason,
            'trends' => [
                'daily' => $dailyTrend,
            ]
        ];
    }

    /**
     * Get campaign performance chart data (time-series)
     */
    public function getCampaignPerformanceChartData(Carbon $endDate, Carbon $startDate): array
    {
        $campaigns = Campaign::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, 
                        SUM(total_sent) as sent, 
                        SUM(total_sent - total_failed) as delivered,
                        SUM(opens) as opened,
                        SUM(clicks) as clicked')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $campaigns->map(function ($campaign) {
            return [
                'date' => Carbon::parse($campaign->date)->format('M j'),
                'sent' => (int) $campaign->sent,
                'delivered' => (int) $campaign->delivered,
                'opened' => (int) $campaign->opened,
                'clicked' => (int) $campaign->clicked,
            ];
        })->toArray();
    }

    /**
     * Get user growth chart data (time-series)
     */
    public function getUserGrowthChartData(Carbon $endDate, Carbon $startDate): array
    {
        $users = User::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $cumulativeCount = 0;
        return $users->map(function ($user) use (&$cumulativeCount) {
            $cumulativeCount += (int) $user->count;
            return [
                'date' => Carbon::parse($user->date)->format('M j'),
                'value' => $cumulativeCount,
            ];
        })->toArray();
    }

    /**
     * Get email volume chart data (time-series)
     */
    public function getEmailVolumeChartData(Carbon $endDate, Carbon $startDate): array
    {
        $emailVolume = Campaign::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, SUM(total_sent) as volume')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $emailVolume->map(function ($volume) {
            return [
                'date' => Carbon::parse($volume->date)->format('M j'),
                'value' => (int) $volume->volume,
            ];
        })->toArray();
    }

    /**
     * Get deliverability trends chart data (time-series)
     */
    public function getDeliverabilityTrendsChartData(Carbon $endDate, Carbon $startDate): array
    {
        $deliverability = Campaign::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, 
                        AVG(CASE WHEN total_sent > 0 THEN ((total_sent - total_failed) / total_sent) * 100 ELSE 0 END) as delivery_rate,
                        AVG(bounce_rate) as bounce_rate,
                        AVG(open_rate) as open_rate,
                        AVG(click_rate) as click_rate')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $deliverability->map(function ($data) {
            return [
                'date' => Carbon::parse($data->date)->format('M j'),
                'delivery_rate' => round((float) $data->delivery_rate, 2),
                'bounce_rate' => round((float) $data->bounce_rate, 2),
                'open_rate' => round((float) $data->open_rate, 2),
                'click_rate' => round((float) $data->click_rate, 2),
            ];
        })->toArray();
    }

    /**
     * Get campaign status distribution for pie chart
     */
    public function getCampaignStatusDistribution(): array
    {
        $statusCounts = Campaign::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get();

        $colors = [
            'active' => '#10B981',
            'completed' => '#3B82F6',
            'failed' => '#EF4444',
            'paused' => '#F59E0B',
            'draft' => '#6B7280',
        ];

        return $statusCounts->map(function ($status) use ($colors) {
            return [
                'name' => ucfirst($status->status),
                'value' => (int) $status->count,
                'color' => $colors[$status->status] ?? '#6B7280',
            ];
        })->toArray();
    }

    /**
     * Get bounce trends chart data (time-series)
     */
    public function getBounceTrendsChartData(Carbon $endDate, Carbon $startDate): array
    {
        $bounces = Campaign::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, 
                        SUM(bounces) as hard_bounces,
                        0 as soft_bounces,
                        AVG(bounce_rate) as bounce_rate')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $bounces->map(function ($bounce) {
            return [
                'date' => Carbon::parse($bounce->date)->format('M j'),
                'hard_bounces' => (int) $bounce->hard_bounces,
                'soft_bounces' => (int) ($bounce->soft_bounces ?? 0),
                'bounce_rate' => round((float) $bounce->bounce_rate, 2),
            ];
        })->toArray();
    }
} 
 
 
 
 
 