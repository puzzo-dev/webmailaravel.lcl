<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\EmailTracking;
use App\Models\Campaign;

echo "Cleaning up duplicate EmailTracking records...\n";

$campaignId = 43;

echo "Before cleanup:\n";
$totalRecords = EmailTracking::where('campaign_id', $campaignId)->count();
echo "Campaign {$campaignId} EmailTracking records: {$totalRecords}\n";

// Get IDs of duplicate records to delete (keep only the first one per email)
$duplicateIds = \DB::select("
    SELECT id FROM email_tracking 
    WHERE campaign_id = ? 
    AND id NOT IN (
        SELECT * FROM (
            SELECT MIN(id) 
            FROM email_tracking 
            WHERE campaign_id = ?
            GROUP BY recipient_email
        ) as temp
    )
", [$campaignId, $campaignId]);

$idsToDelete = array_column($duplicateIds, 'id');

if (!empty($idsToDelete)) {
    $deleted = EmailTracking::whereIn('id', $idsToDelete)->delete();
    echo "Deleted {$deleted} duplicate records\n";
} else {
    echo "No duplicates found\n";
}

echo "After cleanup:\n";
$totalRecordsAfter = EmailTracking::where('campaign_id', $campaignId)->count();
echo "Campaign {$campaignId} EmailTracking records: {$totalRecordsAfter}\n";

// Update campaign metrics to match actual tracking
$campaign = Campaign::find($campaignId);
$actualSent = EmailTracking::where('campaign_id', $campaignId)->whereNotNull('sent_at')->count();
$actualFailed = EmailTracking::where('campaign_id', $campaignId)->whereNull('sent_at')->whereNotNull('failed_at')->count();

echo "\nUpdating campaign metrics:\n";
echo "Old metrics: {$campaign->total_sent} sent, {$campaign->total_failed} failed\n";
echo "New metrics: {$actualSent} sent, {$actualFailed} failed\n";

$campaign->update([
    'total_sent' => $actualSent,
    'total_failed' => $actualFailed
]);

echo "Campaign metrics updated successfully!\n";
