<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Campaign;
use App\Models\EmailTracking;

echo "Checking for duplicate EmailTracking records...\n";

$campaign = Campaign::find(25);
if (!$campaign) {
    echo "Campaign 25 not found\n";
    exit;
}

echo "Campaign {$campaign->id}: {$campaign->name}\n";
echo "Recipients: {$campaign->recipient_count}\n";
echo "Campaign metrics: {$campaign->total_sent} sent, {$campaign->total_failed} failed\n\n";

// Check for duplicates by email
$duplicates = EmailTracking::where('campaign_id', 25)
    ->selectRaw('recipient_email, COUNT(*) as count')
    ->groupBy('recipient_email')
    ->having('count', '>', 1)
    ->get();

if ($duplicates->count() > 0) {
    echo "DUPLICATE RECORDS FOUND:\n";
    foreach ($duplicates as $dup) {
        echo "Email: {$dup->recipient_email} appears {$dup->count} times\n";
        
        // Show details for this email
        $records = EmailTracking::where('campaign_id', 25)
            ->where('recipient_email', $dup->recipient_email)
            ->get(['id', 'sent_at', 'opened_at', 'created_at']);
        
        foreach ($records as $record) {
            echo "  ID: {$record->id}, sent_at: {$record->sent_at}, created: {$record->created_at}\n";
        }
        echo "\n";
    }
} else {
    echo "No duplicate records found.\n";
}

// Check actual counts
$actualSent = EmailTracking::where('campaign_id', 25)->whereNotNull('sent_at')->count();
$actualFailed = EmailTracking::where('campaign_id', 25)->whereNull('sent_at')->whereNotNull('failed_at')->count();
$totalRecords = EmailTracking::where('campaign_id', 25)->count();

echo "\nEmailTracking actual counts:\n";
echo "Total records: {$totalRecords}\n";
echo "Actually sent: {$actualSent}\n";
echo "Actually failed: {$actualFailed}\n";

echo "\nDiscrepancy analysis:\n";
echo "Campaign total_sent ({$campaign->total_sent}) vs EmailTracking sent ({$actualSent}): " . ($campaign->total_sent - $actualSent) . " difference\n";
echo "Campaign total_failed ({$campaign->total_failed}) vs EmailTracking failed ({$actualFailed}): " . ($campaign->total_failed - $actualFailed) . " difference\n";
echo "\nCampaign Metrics:\n";
echo "Total sent: " . ($campaign->total_sent ?? 0) . "\n";
echo "Total failed: " . ($campaign->total_failed ?? 0) . "\n";
echo "Recipient count: " . ($campaign->recipient_count ?? 0) . "\n";
