<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$campaigns = \App\Models\Campaign::select('id', 'name', 'enable_template_variables', 'enable_unsubscribe_link')->get();

echo "Campaign Settings Check:\n";
echo "========================\n";

$problematicCount = 0;

foreach ($campaigns as $campaign) {
    $templateVars = $campaign->enable_template_variables ? 'ON' : 'OFF';
    $unsubscribe = $campaign->enable_unsubscribe_link ? 'ON' : 'OFF';
    
    echo "ID: {$campaign->id} | Template Variables: {$templateVars} | Unsubscribe: {$unsubscribe}\n";
    echo "  Name: {$campaign->name}\n";
    
    if ($campaign->enable_unsubscribe_link && !$campaign->enable_template_variables) {
        echo "  ⚠️  WARNING: Unsubscribe enabled but template variables disabled!\n";
        echo "      This will cause {{unsubscribelink}} to appear as literal text in emails.\n";
        $problematicCount++;
    }
    echo "\n";
}

echo "Summary:\n";
echo "========\n";
echo "Total campaigns: " . $campaigns->count() . "\n";
echo "Campaigns with potential unsubscribe link issues: {$problematicCount}\n";

if ($problematicCount > 0) {
    echo "\nTo fix the issues, either:\n";
    echo "1. Enable template variables for campaigns that need unsubscribe links\n";
    echo "2. Or add unsubscribe links manually in the email content instead of using {{unsubscribelink}}\n";
}
