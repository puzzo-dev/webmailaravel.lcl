<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Campaign;
use App\Models\EmailTracking;

class FixCampaignMetrics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'campaigns:fix-metrics {--dry-run : Show what would be changed without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix campaign metrics by recalculating from email tracking data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->info('DRY RUN MODE - No changes will be made');
        }
        
        $campaigns = Campaign::where('total_sent', '>', 0)->get();
        $fixedCount = 0;
        
        foreach ($campaigns as $campaign) {
            $tracking = EmailTracking::where('campaign_id', $campaign->id);
            
            $actualSent = $tracking->count();
            $actualOpens = $tracking->whereNotNull('opened_at')->count();
            $actualClicks = $tracking->whereNotNull('clicked_at')->count();
            $actualBounces = $tracking->whereNotNull('bounced_at')->count();
            $actualComplaints = $tracking->whereNotNull('complained_at')->count();
            
            $needsUpdate = false;
            $changes = [];
            
            if ($campaign->total_sent != $actualSent) {
                $changes['total_sent'] = [$campaign->total_sent, $actualSent];
                $needsUpdate = true;
            }
            
            if ($campaign->opens != $actualOpens) {
                $changes['opens'] = [$campaign->opens, $actualOpens];
                $needsUpdate = true;
            }
            
            if ($campaign->clicks != $actualClicks) {
                $changes['clicks'] = [$campaign->clicks, $actualClicks];
                $needsUpdate = true;
            }
            
            if ($campaign->bounces != $actualBounces) {
                $changes['bounces'] = [$campaign->bounces, $actualBounces];
                $needsUpdate = true;
            }
            
            if ($campaign->complaints != $actualComplaints) {
                $changes['complaints'] = [$campaign->complaints, $actualComplaints];
                $needsUpdate = true;
            }
            
            if ($needsUpdate) {
                $this->info("Campaign {$campaign->id} ({$campaign->name}):");
                
                foreach ($changes as $field => [$old, $new]) {
                    $this->line("  {$field}: {$old} → {$new}");
                }
                
                if (!$isDryRun) {
                    // Calculate rates
                    $openRate = $actualSent > 0 ? round(($actualOpens / $actualSent) * 100, 2) : 0;
                    $clickRate = $actualSent > 0 ? round(($actualClicks / $actualSent) * 100, 2) : 0;
                    $bounceRate = $actualSent > 0 ? round(($actualBounces / $actualSent) * 100, 2) : 0;
                    $complaintRate = $actualSent > 0 ? round(($actualComplaints / $actualSent) * 100, 2) : 0;
                    
                    $campaign->update([
                        'total_sent' => $actualSent,
                        'opens' => $actualOpens,
                        'clicks' => $actualClicks,
                        'bounces' => $actualBounces,
                        'complaints' => $actualComplaints,
                        'open_rate' => $openRate,
                        'click_rate' => $clickRate,
                        'bounce_rate' => $bounceRate,
                        'complaint_rate' => $complaintRate,
                    ]);
                    
                    $this->line("  ✓ Updated");
                }
                
                $fixedCount++;
                $this->line('');
            }
        }
        
        if ($fixedCount === 0) {
            $this->info('All campaign metrics are correct!');
        } else {
            if ($isDryRun) {
                $this->info("Found {$fixedCount} campaigns that need fixing. Run without --dry-run to apply changes.");
            } else {
                $this->info("Fixed metrics for {$fixedCount} campaigns.");
            }
        }
    }
}
