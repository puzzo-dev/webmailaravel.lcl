<?php

/**
 * Campaign Status Monitor - Ensures campaign statuses are accurate
 * 
 * This script should be run periodically (e.g., every 5-10 minutes)
 * to check for campaigns with incorrect statuses and fix them.
 */

require __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Campaign;
use Carbon\Carbon;

echo "=== Campaign Status Monitor ===\n";
echo "Started at: " . now()->toDateTimeString() . "\n\n";

$fixes = [];
$totalCampaigns = 0;
$fixedCampaigns = 0;

try {
    // Check for campaigns that should be completed
    echo "1. Checking for campaigns that should be completed...\n";
    $processingCampaigns = Campaign::whereIn('status', ['processing', 'sending', 'running', 'active'])
        ->get();

    foreach ($processingCampaigns as $campaign) {
        $totalCampaigns++;
        $totalProcessed = $campaign->total_sent + $campaign->total_failed;
        
        // Check if all recipients have been processed
        if ($campaign->recipient_count > 0 && $totalProcessed >= $campaign->recipient_count) {
            // Check for pending jobs
            $pendingJobs = \DB::table('jobs')
                ->where('payload', 'LIKE', '%SendEmailJob%')
                ->where(function($query) use ($campaign) {
                    $query->where('payload', 'LIKE', '%"campaignId":' . $campaign->id . '%')
                          ->orWhere('payload', 'LIKE', '%"campaign_id":' . $campaign->id . '%');
                })
                ->count();
                
            $pendingCampaignJobs = \DB::table('jobs')
                ->where('payload', 'LIKE', '%ProcessCampaignJob%')
                ->where('payload', 'LIKE', '%' . $campaign->id . '%')
                ->count();
            
            if ($pendingJobs == 0 && $pendingCampaignJobs == 0) {
                $campaign->update([
                    'status' => 'completed',
                    'completed_at' => $campaign->completed_at ?? now(),
                ]);
                
                $fixes[] = "Campaign {$campaign->id} ({$campaign->name}): {$campaign->status} → completed";
                $fixedCampaigns++;
            }
        }
    }

    echo "   Found {$totalCampaigns} campaigns in progress states\n";
    
    // Check for campaigns stuck in old statuses for too long
    echo "\n2. Checking for campaigns stuck in statuses for too long...\n";
    $stuckCampaigns = Campaign::whereIn('status', ['processing', 'sending'])
        ->where('updated_at', '<', now()->subHours(2)) // 2 hours ago
        ->get();

    foreach ($stuckCampaigns as $campaign) {
        // Check if there are actually any pending jobs
        $pendingJobs = \DB::table('jobs')
            ->where('payload', 'LIKE', '%SendEmailJob%')
            ->where(function($query) use ($campaign) {
                $query->where('payload', 'LIKE', '%"campaignId":' . $campaign->id . '%')
                      ->orWhere('payload', 'LIKE', '%"campaign_id":' . $campaign->id . '%');
            })
            ->count();
            
        $pendingCampaignJobs = \DB::table('jobs')
            ->where('payload', 'LIKE', '%ProcessCampaignJob%')
            ->where('payload', 'LIKE', '%' . $campaign->id . '%')
            ->count();

        if ($pendingJobs == 0 && $pendingCampaignJobs == 0) {
            $totalProcessed = $campaign->total_sent + $campaign->total_failed;
            
            if ($campaign->recipient_count > 0 && $totalProcessed >= $campaign->recipient_count) {
                // Mark as completed
                $campaign->update([
                    'status' => 'completed',
                    'completed_at' => $campaign->completed_at ?? now(),
                ]);
                
                $fixes[] = "Campaign {$campaign->id} ({$campaign->name}): stuck {$campaign->status} → completed";
                $fixedCampaigns++;
            } else {
                // Mark as failed if stuck without progress
                $campaign->update(['status' => 'failed']);
                $fixes[] = "Campaign {$campaign->id} ({$campaign->name}): stuck {$campaign->status} → failed";
                $fixedCampaigns++;
            }
        }
    }

    echo "   Found {$stuckCampaigns->count()} campaigns potentially stuck\n";

    // Check for campaigns with inconsistent data
    echo "\n3. Checking for campaigns with inconsistent data...\n";
    $inconsistentCampaigns = Campaign::where('status', 'completed')
        ->whereNull('completed_at')
        ->get();

    foreach ($inconsistentCampaigns as $campaign) {
        $campaign->update(['completed_at' => $campaign->updated_at]);
        $fixes[] = "Campaign {$campaign->id} ({$campaign->name}): Added missing completed_at timestamp";
        $fixedCampaigns++;
    }

    echo "   Found {$inconsistentCampaigns->count()} campaigns with missing completed_at\n";

    // Summary
    echo "\n=== Summary ===\n";
    echo "Total campaigns checked: " . ($totalCampaigns + $stuckCampaigns->count() + $inconsistentCampaigns->count()) . "\n";
    echo "Campaigns fixed: {$fixedCampaigns}\n";
    
    if (!empty($fixes)) {
        echo "\nFixes applied:\n";
        foreach ($fixes as $fix) {
            echo "  ✅ {$fix}\n";
        }
    } else {
        echo "\n✅ No issues found - all campaigns have correct statuses\n";
    }

    // Show current status distribution
    echo "\nCurrent status distribution:\n";
    $statusDistribution = Campaign::select('status', \DB::raw('count(*) as count'))
        ->groupBy('status')
        ->orderBy('count', 'desc')
        ->get();

    foreach ($statusDistribution as $statusGroup) {
        echo "  {$statusGroup->status}: {$statusGroup->count} campaigns\n";
    }

    echo "\n=== Monitor completed at " . now()->toDateTimeString() . " ===\n";

} catch (Exception $e) {
    echo "\n❌ Error during monitoring: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
