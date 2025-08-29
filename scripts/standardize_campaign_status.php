<?php

require __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Campaign;

echo "=== Campaign Status Standardization ===\n\n";

try {
    // Get all campaigns with their current status
    $campaigns = Campaign::select('id', 'name', 'status')->get();
    
    echo "Found " . $campaigns->count() . " campaigns\n\n";
    
    $statusMapping = [
        'DRAFT' => 'draft',
        'RUNNING' => 'running', 
        'PAUSED' => 'paused',
        'STOPPED' => 'stopped',
        'COMPLETED' => 'completed',
        'SENDING' => 'sending',
        'PROCESSING' => 'processing',
        'ACTIVE' => 'active',
        'SCHEDULED' => 'scheduled',
        'FAILED' => 'failed'
    ];
    
    $updated = 0;
    $noChange = 0;
    
    foreach ($campaigns as $campaign) {
        $currentStatus = $campaign->status;
        $upperStatus = strtoupper($currentStatus);
        
        // Check if we need to update from uppercase to lowercase
        if (isset($statusMapping[$upperStatus]) && $currentStatus !== $statusMapping[$upperStatus]) {
            $newStatus = $statusMapping[$upperStatus];
            
            echo "Campaign {$campaign->id} ({$campaign->name}):\n";
            echo "  Current: '{$currentStatus}' -> New: '{$newStatus}'\n";
            
            $campaign->update(['status' => $newStatus]);
            $updated++;
        } else {
            $noChange++;
        }
    }
    
    echo "\n=== Summary ===\n";
    echo "Updated: {$updated} campaigns\n";
    echo "No change needed: {$noChange} campaigns\n";
    
    // Show final status distribution
    $finalStatuses = Campaign::select('status', \DB::raw('count(*) as count'))
        ->groupBy('status')
        ->get();
    
    echo "\nFinal status distribution:\n";
    foreach ($finalStatuses as $statusGroup) {
        echo "  {$statusGroup->status}: {$statusGroup->count} campaigns\n";
    }
    
    echo "\n=== Status standardization completed ===\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
