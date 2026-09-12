<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Campaign;
use App\Models\Sender;
use App\Models\EmailTracking;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Render the Inertia dashboard with summary stats and chart data.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user->role === 'admin';

        // Base query: admin sees all, user sees own
        $campaignQuery = $isAdmin ? Campaign::query() : Campaign::where('user_id', $user->id);
        $trackingBase = $isAdmin
            ? EmailTracking::query()
            : EmailTracking::whereHas('campaign', fn ($q) => $q->where('user_id', $user->id));

        // Campaign stats
        $totalCampaigns = (clone $campaignQuery)->count();
        $activeCampaigns = (clone $campaignQuery)->whereIn('status', ['running', 'scheduled'])->count();
        $completedCampaigns = (clone $campaignQuery)->where('status', 'completed')->count();
        $failedCampaigns = (clone $campaignQuery)->where('status', 'failed')->count();
        $weeklyCreated = (clone $campaignQuery)->where('created_at', '>=', now()->subDays(7))->count();

        // Email tracking stats (use timestamp columns, not a status column)
        $emailsSent = (clone $trackingBase)->whereNotNull('sent_at')->count();
        $emailsDelivered = (clone $trackingBase)->whereNotNull('sent_at')->whereNull('bounced_at')->count();
        $opens = (clone $trackingBase)->whereNotNull('opened_at')->count();
        $clicks = (clone $trackingBase)->whereNotNull('clicked_at')->count();

        // Sender count
        $totalSenders = $isAdmin
            ? Sender::count()
            : Sender::where('user_id', $user->id)->count();

        // Recent campaigns (last 5)
        $recentCampaigns = (clone $campaignQuery)
            ->select('id', 'name', 'status', 'created_at')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($c) {
                $tracking = EmailTracking::where('campaign_id', $c->id);
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'status' => $c->status,
                    'created_at' => $c->created_at,
                    'emails_sent' => (clone $tracking)->whereNotNull('sent_at')->count(),
                    'opens' => (clone $tracking)->whereNotNull('opened_at')->count(),
                    'clicks' => (clone $tracking)->whereNotNull('clicked_at')->count(),
                ];
            })
            ->toArray();

        // Chart data: campaign performance over last 7 days
        $performanceData = (clone $trackingBase)
            ->select(
                DB::raw('DATE(sent_at) as date'),
                DB::raw('COUNT(*) as sent'),
                DB::raw('SUM(CASE WHEN bounced_at IS NULL THEN 1 ELSE 0 END) as delivered'),
                DB::raw('SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened'),
                DB::raw('SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked')
            )
            ->whereNotNull('sent_at')
            ->where('sent_at', '>=', now()->subDays(7))
            ->groupBy(DB::raw('DATE(sent_at)'))
            ->orderBy(DB::raw('DATE(sent_at)'))
            ->get()
            ->toArray();

        // Campaign status distribution for pie chart
        $statusDistribution = (clone $campaignQuery)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                $colors = [
                    'running' => '#10b981',
                    'completed' => '#6366f1',
                    'failed' => '#ef4444',
                    'draft' => '#9ca3af',
                    'scheduled' => '#f59e0b',
                    'paused' => '#8b5cf6',
                ];
                return [
                    'name' => ucfirst($item->status),
                    'value' => $item->count,
                    'color' => $colors[$item->status] ?? '#6b7280',
                ];
            })
            ->toArray();

        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'total_campaigns' => $totalCampaigns,
                'active_campaigns' => $activeCampaigns,
                'completed_campaigns' => $completedCampaigns,
                'failed_campaigns' => $failedCampaigns,
                'weekly_created' => $weeklyCreated,
                'emails_sent' => $emailsSent,
                'emails_delivered' => $emailsDelivered,
                'opens' => $opens,
                'clicks' => $clicks,
                'total_senders' => $totalSenders,
                'recent_campaigns' => $recentCampaigns,
            ],
            'charts' => [
                'campaign_performance' => $performanceData,
                'campaign_status_distribution' => $statusDistribution,
            ],
        ]);
    }
}
