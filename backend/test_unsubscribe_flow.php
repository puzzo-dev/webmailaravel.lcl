<?php

require __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Campaign;
use App\Models\EmailTracking;
use App\Mail\CampaignEmail;

echo "=== Testing Unsubscribe Flow ===\n\n";

try {
    // Find an existing campaign with unsubscribe enabled
    $campaign = Campaign::where('enable_unsubscribe_link', true)->first();
    
    if (!$campaign) {
        echo "No campaigns with unsubscribe enabled found. Creating test campaign...\n";
        
        // Create a test campaign
        $campaign = Campaign::create([
            'name' => 'Test Unsubscribe Campaign',
            'subject' => 'Test Email',
            'content' => 'Test email content with {{unsubscribelink}}',
            'enable_unsubscribe_link' => true,
            'status' => 'draft'
        ]);
        
        echo "Created test campaign with ID: {$campaign->id}\n";
    } else {
        echo "Using existing campaign: {$campaign->name} (ID: {$campaign->id})\n";
    }
    
    // Test email
    $testEmail = 'test@example.com';
    
    // Generate unsubscribe token
    $token = hash('sha256', $testEmail . $campaign->id . config('app.key'));
    echo "Generated token: {$token}\n";
    
    // Test frontend URL generation
    $frontendUrl = config('app.frontend_url', config('app.url'));
    $unsubscribeUrl = $frontendUrl . '/unsubscribe/' . $token;
    echo "Frontend unsubscribe URL: {$unsubscribeUrl}\n";
    
    // Test backend API endpoints
    echo "\nBackend API endpoints:\n";
    echo "Unsubscribe: " . config('app.url') . "/api/unsubscribe/{$token}\n";
    echo "Resubscribe: " . config('app.url') . "/api/resubscribe/{$token}\n";
    
    echo "\n=== Test completed successfully ===\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
