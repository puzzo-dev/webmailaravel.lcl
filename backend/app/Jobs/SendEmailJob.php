<?php

namespace App\Jobs;

use App\Mail\CampaignEmail;
use App\Models\Campaign;
use App\Models\Content;
use App\Models\Sender;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 60; // 1 minute
    public $tries = 3;
    public $backoff = [30, 60, 120]; // Retry delays in seconds

    protected $recipient;
    protected $sender;
    protected $content;
    protected $campaign;
    protected $recipientData;

    /**
     * Create a new job instance.
     */
    public function __construct(string $recipient, Sender $sender, Content $content, Campaign $campaign, array $recipientData = [])
    {
        $this->recipient = $recipient;
        $this->sender = $sender;
        $this->content = $content;
        $this->campaign = $campaign;
        $this->recipientData = $recipientData;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Sending campaign email', [
                'campaign_id' => $this->campaign->id,
                'recipient' => $this->recipient,
                'sender_id' => $this->sender->id
            ]);

            // Get recipient data for template variables
            $campaignService = app(\App\Services\CampaignService::class);
            $recipientData = $campaignService->getRecipientData($this->campaign->id, $this->recipient);

            // Send email using Laravel's Mail facade
            Mail::to($this->recipient)
                ->send(new CampaignEmail($this->campaign, $this->content, $this->sender, $this->recipient, $recipientData));

            Log::info('Campaign email sent successfully', [
                'campaign_id' => $this->campaign->id,
                'recipient' => $this->recipient,
                'sender_id' => $this->sender->id
            ]);

        } catch (\Exception $e) {
            Log::error('Campaign email sending failed', [
                'campaign_id' => $this->campaign->id,
                'recipient' => $this->recipient,
                'sender_id' => $this->sender->id,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts()
            ]);

            // Mark campaign as failed if this is the last attempt
            if ($this->attempts() >= $this->tries) {
                $this->campaign->update(['status' => 'failed']);
                
                Log::error('Campaign marked as failed after all retry attempts', [
                    'campaign_id' => $this->campaign->id,
                    'attempts' => $this->attempts()
                ]);
            }

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Campaign email job failed permanently', [
            'campaign_id' => $this->campaign->id,
            'recipient' => $this->recipient,
            'sender_id' => $this->sender->id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);

        // Mark campaign as failed
        $this->campaign->update(['status' => 'failed']);
    }
}