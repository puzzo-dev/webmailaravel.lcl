<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Campaign;

echo "Checking campaigns with template variables disabled..." . PHP_EOL;

$campaigns = Campaign::where('enable_template_variables', false)->get();

echo "Found " . $campaigns->count() . " campaigns with template variables disabled." . PHP_EOL;

if ($campaigns->count() > 0) {
    echo "Enabling template variables for these campaigns:" . PHP_EOL;
    
    foreach ($campaigns as $campaign) {
        echo "- Campaign ID: {$campaign->id}, Name: {$campaign->name}" . PHP_EOL;
        $campaign->enable_template_variables = true;
        $campaign->save();
    }
    
    echo "Template variables enabled for all campaigns." . PHP_EOL;
} else {
    echo "All campaigns already have template variables enabled." . PHP_EOL;
}

// Also check if any campaign content contains literal {{unsubscribelink}}
echo PHP_EOL . "Checking for literal {{unsubscribelink}} in campaign content..." . PHP_EOL;

$campaignsWithLiteralLinks = Campaign::where('content', 'LIKE', '%{{unsubscribelink}}%')->get();

if ($campaignsWithLiteralLinks->count() > 0) {
    echo "Found " . $campaignsWithLiteralLinks->count() . " campaigns with literal {{unsubscribelink}} placeholders:" . PHP_EOL;
    
    foreach ($campaignsWithLiteralLinks as $campaign) {
        echo "- Campaign ID: {$campaign->id}, Name: {$campaign->name}" . PHP_EOL;
        echo "  Template variables enabled: " . ($campaign->enable_template_variables ? 'Yes' : 'No') . PHP_EOL;
    }
} else {
    echo "No campaigns found with literal {{unsubscribelink}} placeholders." . PHP_EOL;
}

echo PHP_EOL . "Script completed." . PHP_EOL;
