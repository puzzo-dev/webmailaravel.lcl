<?php

namespace App\Jobs;

use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 3;
    public $backoff = [60, 180, 360]; // Retry delays in seconds

    protected $campaignId;
    protected $batchSize;

    /**
     * Create a new job instance.
     */
    public function __construct($campaignId, $batchSize = 200)
    {
        $this->campaignId = $campaignId;
        $this->batchSize = $batchSize; // Increased batch size for better performance
    }

    /**
     * Execute the job.
     */
    public function handle(CampaignService $campaignService): void
    {
        try {
            $campaign = Campaign::findOrFail($this->campaignId);
            
            Log::info('Processing campaign job started', [
                'campaign_id' => $this->campaignId,
                'campaign_name' => $campaign->name,
                'batch_size' => $this->batchSize,
            ]);

            // Check if campaign is still running (use lowercase for consistency)
            if (!in_array(strtolower($campaign->status), ['sending', 'active', 'running', 'processing'])) {
                Log::info('Campaign is not running, skipping processing', [
                    'campaign_id' => $this->campaignId,
                    'status' => $campaign->status
                ]);
                return;
            }

            // Process campaign
            $result = $campaignService->processCampaign($campaign, $this->batchSize);

            Log::info('Campaign processed successfully', [
                'campaign_id' => $this->campaignId,
                'emails_sent' => $result['emails_sent'] ?? 0,
                'emails_failed' => $result['emails_failed'] ?? 0,
                'processing_time' => $result['processing_time'] ?? 0
            ]);

            // Schedule next batch if there are more recipients
            if (($result['emails_sent'] ?? 0) > 0 && ($result['remaining_recipients'] ?? 0) > 0) {
                $nextDelay = 30; // Reduced delay for faster processing
                
                self::dispatch($this->campaignId, $this->batchSize)
                    ->delay(now()->addSeconds($nextDelay))
                    ->onConnection('database');
                
                Log::info('Scheduled next campaign batch', [
                    'campaign_id' => $this->campaignId,
                    'next_delay' => $nextDelay,
                    'remaining_recipients' => $result['remaining_recipients']
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Campaign processing job failed', [
                'campaign_id' => $this->campaignId,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts()
            ]);

            // Only mark campaign as failed if this is a critical system error, not individual email failures
            if ($this->attempts() >= $this->tries) {
                $campaign = Campaign::find($this->campaignId);
                if ($campaign) {
                    // Only mark as failed if it's a system-level error (not individual email failures)
                    if (strpos($e->getMessage(), 'Recipient list') !== false || 
                        strpos($e->getMessage(), 'No senders found') !== false ||
                        strpos($e->getMessage(), 'No content found') !== false) {
                        $campaign->update(['status' => 'failed']);
                        
                        Log::error('Campaign marked as failed due to system error', [
                            'campaign_id' => $this->campaignId,
                            'error' => $e->getMessage(),
                            'attempts' => $this->attempts()
                        ]);
                    } else {
                        // For other errors, just log and let individual email jobs handle their own failures
                        Log::warning('Campaign processing encountered error but continuing', [
                            'campaign_id' => $this->campaignId,
                            'error' => $e->getMessage(),
                            'attempts' => $this->attempts()
                        ]);
                    }
                }
            }

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Campaign processing job failed permanently', [
            'campaign_id' => $this->campaignId,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);

        // Only mark campaign as failed for system-level errors
        $campaign = Campaign::find($this->campaignId);
        if ($campaign) {
            if (strpos($exception->getMessage(), 'Recipient list') !== false || 
                strpos($exception->getMessage(), 'No senders found') !== false ||
                strpos($exception->getMessage(), 'No content found') !== false) {
                $campaign->update(['status' => 'failed']);
                
                Log::error('Campaign marked as failed due to system error in failed handler', [
                    'campaign_id' => $this->campaignId,
                    'error' => $exception->getMessage()
                ]);
            }
        }
    }
}