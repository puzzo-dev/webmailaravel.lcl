<?php

require __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Campaign;

echo "=== Campaign Status Check and Correction ===\n\n";

try {
    // Get all campaigns that might need status correction
    $campaigns = Campaign::whereIn('status', ['processing', 'sending', 'running', 'active'])
        ->get();
    
    echo "Found " . $campaigns->count() . " campaigns in progress states\n\n";
    
    $corrected = 0;
    
    foreach ($campaigns as $campaign) {
        echo "Checking Campaign {$campaign->id} ({$campaign->name}):\n";
        echo "  Current Status: {$campaign->status}\n";
        echo "  Total Recipients: {$campaign->recipient_count}\n";
        echo "  Total Sent: {$campaign->total_sent}\n";
        echo "  Total Failed: {$campaign->total_failed}\n";
        
        $totalProcessed = $campaign->total_sent + $campaign->total_failed;
        echo "  Total Processed: {$totalProcessed}\n";
        
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
            
            echo "  Pending Email Jobs: {$pendingJobs}\n";
            echo "  Pending Campaign Jobs: {$pendingCampaignJobs}\n";
            
            if ($pendingJobs == 0 && $pendingCampaignJobs == 0) {
                echo "  ✅ CORRECTING: All emails processed and no pending jobs - marking as completed\n";
                
                $campaign->update([
                    'status' => 'completed',
                    'completed_at' => $campaign->completed_at ?? now(),
                ]);
                
                $corrected++;
            } else {
                echo "  ⏳ KEEPING: Jobs still pending in queue\n";
            }
        } else {
            $remaining = $campaign->recipient_count - $totalProcessed;
            echo "  ⏳ KEEPING: Still {$remaining} recipients remaining to process\n";
        }
        
        echo "\n";
    }
    
    echo "=== Summary ===\n";
    echo "Campaigns corrected: {$corrected}\n";
    
    // Show final status distribution
    $statusDistribution = Campaign::select('status', \DB::raw('count(*) as count'))
        ->groupBy('status')
        ->get();
    
    echo "\nFinal status distribution:\n";
    foreach ($statusDistribution as $statusGroup) {
        echo "  {$statusGroup->status}: {$statusGroup->count} campaigns\n";
    }
    
    echo "\n=== Status check completed ===\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
