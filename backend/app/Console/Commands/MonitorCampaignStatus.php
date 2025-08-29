<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Campaign;
use Carbon\Carbon;

class MonitorCampaignStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'campaign:monitor-status {--fix : Automatically fix issues found}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitor and fix campaign status inconsistencies';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Campaign Status Monitor ===');
        $this->info('Started at: ' . now()->toDateTimeString());
        
        $fixes = [];
        $totalChecked = 0;
        $fixedCount = 0;
        $shouldFix = $this->option('fix');

        // Check for campaigns that should be completed
        $this->info('1. Checking for campaigns that should be completed...');
        $processingCampaigns = Campaign::whereIn('status', ['processing', 'sending', 'running', 'active'])->get();

        foreach ($processingCampaigns as $campaign) {
            $totalChecked++;
            $totalProcessed = $campaign->total_sent + $campaign->total_failed;
            
            if ($campaign->recipient_count > 0 && $totalProcessed >= $campaign->recipient_count) {
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
                    $issue = "Campaign {$campaign->id} ({$campaign->name}): {$campaign->status} → completed";
                    $fixes[] = $issue;
                    
                    if ($shouldFix) {
                        $campaign->update([
                            'status' => 'completed',
                            'completed_at' => $campaign->completed_at ?? now(),
                        ]);
                        $this->info("   ✅ FIXED: {$issue}");
                        $fixedCount++;
                    } else {
                        $this->warn("   ⚠️  FOUND: {$issue}");
                    }
                }
            }
        }

        $this->info("   Found {$processingCampaigns->count()} campaigns in progress states");

        // Check for campaigns stuck in statuses for too long
        $this->info('2. Checking for campaigns stuck in statuses for too long...');
        $stuckCampaigns = Campaign::whereIn('status', ['processing', 'sending'])
            ->where('updated_at', '<', now()->subHours(2))
            ->get();

        foreach ($stuckCampaigns as $campaign) {
            $totalChecked++;
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
                    $issue = "Campaign {$campaign->id} ({$campaign->name}): stuck {$campaign->status} → completed";
                    $fixes[] = $issue;
                    
                    if ($shouldFix) {
                        $campaign->update([
                            'status' => 'completed',
                            'completed_at' => $campaign->completed_at ?? now(),
                        ]);
                        $this->info("   ✅ FIXED: {$issue}");
                        $fixedCount++;
                    } else {
                        $this->warn("   ⚠️  FOUND: {$issue}");
                    }
                } else {
                    $issue = "Campaign {$campaign->id} ({$campaign->name}): stuck {$campaign->status} → failed";
                    $fixes[] = $issue;
                    
                    if ($shouldFix) {
                        $campaign->update(['status' => 'failed']);
                        $this->info("   ✅ FIXED: {$issue}");
                        $fixedCount++;
                    } else {
                        $this->warn("   ⚠️  FOUND: {$issue}");
                    }
                }
            }
        }

        $this->info("   Found {$stuckCampaigns->count()} campaigns potentially stuck");

        // Check for completed campaigns without completed_at
        $this->info('3. Checking for campaigns with inconsistent data...');
        $inconsistentCampaigns = Campaign::where('status', 'completed')
            ->whereNull('completed_at')
            ->get();

        foreach ($inconsistentCampaigns as $campaign) {
            $totalChecked++;
            $issue = "Campaign {$campaign->id} ({$campaign->name}): Missing completed_at timestamp";
            $fixes[] = $issue;
            
            if ($shouldFix) {
                $campaign->update(['completed_at' => $campaign->updated_at]);
                $this->info("   ✅ FIXED: {$issue}");
                $fixedCount++;
            } else {
                $this->warn("   ⚠️  FOUND: {$issue}");
            }
        }

        $this->info("   Found {$inconsistentCampaigns->count()} campaigns with missing completed_at");

        // Summary
        $this->info('');
        $this->info('=== Summary ===');
        $this->info("Total campaigns checked: {$totalChecked}");
        
        if ($shouldFix) {
            $this->info("Campaigns fixed: {$fixedCount}");
        } else {
            $this->info("Issues found: " . count($fixes));
            if (!empty($fixes)) {
                $this->warn("Run with --fix to automatically resolve these issues");
            }
        }
        
        if (empty($fixes)) {
            $this->info('✅ No issues found - all campaigns have correct statuses');
        }

        // Show current status distribution
        $this->info('');
        $this->info('Current status distribution:');
        $statusDistribution = Campaign::select('status', \DB::raw('count(*) as count'))
            ->groupBy('status')
            ->orderBy('count', 'desc')
            ->get();

        foreach ($statusDistribution as $statusGroup) {
            $this->line("  {$statusGroup->status}: {$statusGroup->count} campaigns");
        }

        $this->info('');
        $this->info('=== Monitor completed at ' . now()->toDateTimeString() . ' ===');
        
        return 0;
    }
}
