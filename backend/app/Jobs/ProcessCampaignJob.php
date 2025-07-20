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
    public function __construct(int $campaignId, int $batchSize = 100)
    {
        $this->campaignId = $campaignId;
        $this->batchSize = $batchSize;
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

            // Check if campaign is still active
            if ($campaign->status !== 'active') {
                Log::info('Campaign is not active, skipping processing', [
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
                $nextDelay = $this->delay + 60; // Add 1 minute delay between batches
                
                self::dispatch($this->campaignId, $this->batchSize, $nextDelay)
                    ->delay(now()->addSeconds($nextDelay));
                
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

            // Mark campaign as failed if this is the last attempt
            if ($this->attempts() >= $this->tries) {
                $campaign = Campaign::find($this->campaignId);
                if ($campaign) {
                    $campaign->update(['status' => 'failed']);
                    
                    Log::error('Campaign marked as failed after all retry attempts', [
                        'campaign_id' => $this->campaignId,
                        'attempts' => $this->attempts()
                    ]);
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

        // Mark campaign as failed
        $campaign = Campaign::find($this->campaignId);
        if ($campaign) {
            $campaign->update(['status' => 'failed']);
        }
    }
}