<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\ProcessBouncesJob;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule bounce processing every 30 minutes
Schedule::job(new ProcessBouncesJob())->everyThirtyMinutes()->name('process-bounces');

// Manual command to process bounces for specific credential
Artisan::command('bounces:process {credential_id?}', function ($credential_id = null) {
    $this->info('Processing bounces...');
    
    if ($credential_id) {
        ProcessBouncesJob::dispatch($credential_id);
        $this->info("Bounce processing job dispatched for credential ID: {$credential_id}");
    } else {
        ProcessBouncesJob::dispatch();
        $this->info('Bounce processing job dispatched for all credentials');
    }
})->purpose('Process email bounces for credentials');

// Register test tracking command
Artisan::command('test:tracking {campaign_id}', function ($campaign_id) {
    $campaign = \App\Models\Campaign::find($campaign_id);
    if (!$campaign) {
        $this->error("Campaign {$campaign_id} not found");
        return 1;
    }

    $this->info("Testing tracking for campaign: {$campaign->name}");
    $this->info("Tracking settings:");
    $this->info("- Open tracking: " . ($campaign->enable_open_tracking ? 'YES' : 'NO'));
    $this->info("- Click tracking: " . ($campaign->enable_click_tracking ? 'YES' : 'NO'));
    $this->info("- Unsubscribe link: " . ($campaign->enable_unsubscribe_link ? 'YES' : 'NO'));
    $this->info("- Is tracking enabled: " . ($campaign->isTrackingEnabled() ? 'YES' : 'NO'));

    // Get campaign content and sender
    $content = $campaign->getContentVariations()->first();
    $sender = $campaign->getSenders()->first();

    if (!$content || !$sender) {
        $this->error("Campaign missing content or sender");
        return 1;
    }

    $this->info("Content subject: {$content->subject}");
    $this->info("Sender: {$sender->name} <{$sender->email}>");

    // Create test email
    $testEmail = 'test@example.com';
    $campaignEmail = new \App\Mail\CampaignEmail($campaign, $content, $sender, $testEmail, []);

    // Get the processed content
    $mailContent = $campaignEmail->content();
    $htmlContent = $mailContent->htmlString;

    $this->info("Processed HTML content length: " . strlen($htmlContent));
    
    // Check for tracking elements
    $hasTrackingPixel = strpos($htmlContent, '/api/tracking/open/') !== false;
    $hasClickTracking = strpos($htmlContent, '/api/tracking/click/') !== false;
    $hasUnsubscribeLink = strpos($htmlContent, '/api/tracking/unsubscribe/') !== false;

    $this->info("Tracking elements found:");
    $this->info("- Tracking pixel: " . ($hasTrackingPixel ? 'YES' : 'NO'));
    $this->info("- Click tracking: " . ($hasClickTracking ? 'YES' : 'NO'));
    $this->info("- Unsubscribe link: " . ($hasUnsubscribeLink ? 'YES' : 'NO'));

    // Show a sample of the HTML content
    $this->info("\nHTML Content Sample (first 500 chars):");
    $this->info(substr($htmlContent, 0, 500));

    return 0;
})->purpose('Test email tracking for a specific campaign');
