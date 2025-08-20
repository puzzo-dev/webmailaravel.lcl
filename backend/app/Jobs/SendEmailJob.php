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
            // Get fresh data
            $sender = $this->sender->fresh();
            $user = $this->campaign->user;
            $userLimits = $user->getPlanLimits();
            
            // PRIORITY CHECK 1: Verify user daily plan limit
            $userDailySent = $user->getDailySentCount();
            if ($userDailySent >= $userLimits['daily_sending_limit']) {
                Log::warning('User daily plan limit exceeded, rescheduling email', [
                    'campaign_id' => $this->campaign->id,
                    'user_id' => $user->id,
                    'recipient' => $this->recipient,
                    'daily_plan_limit' => $userLimits['daily_sending_limit'],
                    'current_daily_sent' => $userDailySent
                ]);
                
                // Reschedule for tomorrow
                $this->release(now()->addDay()->startOfDay()->diffInSeconds(now()));
                return;
            }
            
            // PRIORITY CHECK 2: Verify sender training limit
            if (!$sender->canSendToday()) {
                Log::warning('Sender training limit exceeded, rescheduling email', [
                    'campaign_id' => $this->campaign->id,
                    'recipient' => $this->recipient,
                    'sender_id' => $sender->id,
                    'sender_email' => $sender->email,
                    'training_limit' => $sender->daily_limit,
                    'current_daily_sent' => $sender->current_daily_sent,
                    'remaining_sends' => $sender->getRemainingDailySends()
                ]);
                
                // Try again in 1 hour with exponential backoff
                $delay = min(3600 * $this->attempts(), 86400); // Max 24 hours
                $this->release($delay);
                return;
            }

            Log::info('Sending campaign email', [
                'campaign_id' => $this->campaign->id,
                'recipient' => $this->recipient,
                'sender_id' => $this->sender->id,
                'sender_name' => $this->sender->name,
                'sender_email' => $this->sender->email,
                'remaining_daily_sends' => $sender->getRemainingDailySends()
            ]);

            // Get recipient data for template variables
            $campaignService = app(\App\Services\CampaignService::class);
            $recipientData = $campaignService->getRecipientData($this->campaign->id, $this->recipient);

            // Configure mail settings for this specific sender's domain
            $this->configureMailForSender();

            // Send email using Laravel's Mail facade
            Mail::to($this->recipient)
                ->send(new CampaignEmail($this->campaign, $this->content, $this->sender, $this->recipient, $recipientData));

            // INCREMENT SENDER COUNT AND CLEAR USER CACHE AFTER SUCCESSFUL SEND
            $sender->incrementDailySent();
            
            // Clear user daily cache to reflect new count
            $userCacheKey = "user_daily_sent:{$user->id}:" . now()->format('Y-m-d');
            // Increment sent count for this campaign
            $this->campaign->increment('total_sent');

            // Get updated campaign data for status logging
            $updatedCampaign = $this->campaign->fresh();
            
            Log::info('Campaign email sent successfully', [
                'campaign_id' => $this->campaign->id,
                'campaign_name' => $updatedCampaign->name,
                'campaign_status' => $updatedCampaign->status,
                'recipient' => $this->recipient,
                'sender_id' => $this->sender->id,
                'sender_email' => $this->sender->email,
                'remaining_daily_sends' => $sender->getRemainingDailySends(),
                'total_sent' => $updatedCampaign->total_sent,
                'total_failed' => $updatedCampaign->total_failed,
                'total_recipients' => $updatedCampaign->recipient_count,
                'progress_percentage' => $updatedCampaign->recipient_count > 0 ? 
                    round((($updatedCampaign->total_sent + $updatedCampaign->total_failed) / $updatedCampaign->recipient_count) * 100, 2) : 0
            ]);
            
            // Check if all emails have been processed (sent + failed)
            $this->checkCampaignCompletion();

        } catch (\Exception $e) {
            // Increment failed count for this campaign
            $this->campaign->increment('total_failed');
            
            // Get updated campaign data for status logging
            $updatedCampaign = $this->campaign->fresh();
            
            Log::error('Campaign email sending failed', [
                'campaign_id' => $this->campaign->id,
                'campaign_name' => $updatedCampaign->name,
                'campaign_status' => $updatedCampaign->status,
                'recipient' => $this->recipient,
                'sender_id' => $this->sender->id,
                'sender_email' => $this->sender->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'total_sent' => $updatedCampaign->total_sent,
                'total_failed' => $updatedCampaign->total_failed,
                'total_recipients' => $updatedCampaign->recipient_count,
                'progress_percentage' => $updatedCampaign->recipient_count > 0 ? 
                    round((($updatedCampaign->total_sent + $updatedCampaign->total_failed) / $updatedCampaign->recipient_count) * 100, 2) : 0
            ]);

            // Re-throw the exception to trigger job failure
            throw $e;
        }
    }

    /**
     * Configure mail settings for the sender's domain SMTP configuration
     */
    private function configureMailForSender(): void
    {
        // Get the sender's domain SMTP configuration
        $smtpConfig = $this->sender->domain->smtpConfig;
        
        if (!$smtpConfig) {
            Log::error('No SMTP configuration found for sender domain', [
                'sender_id' => $this->sender->id,
                'domain_id' => $this->sender->domain_id
            ]);
            throw new \Exception('No SMTP configuration found for sender domain');
        }

        // Store original mail configuration
        $originalConfig = config('mail');
        
        // Set the mail configuration for this specific sender
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp' => [
                'transport' => 'smtp',
                'host' => $smtpConfig->host,
                'port' => $smtpConfig->port,
                'username' => $smtpConfig->username,
                'password' => $smtpConfig->password,
                'encryption' => $smtpConfig->encryption,
                'timeout' => 30,
                'local_domain' => $smtpConfig->host,
            ],
            'mail.from.address' => $this->sender->email,
            'mail.from.name' => $this->sender->name,
        ]);

        // Clear the mail manager cache to force reload of configuration
        app('mail.manager')->purge('smtp');

        Log::info('Mail configured for sender', [
            'sender_id' => $this->sender->id,
            'sender_email' => $this->sender->email,
            'sender_name' => $this->sender->name,
            'smtp_host' => $smtpConfig->host,
            'smtp_port' => $smtpConfig->port,
            'smtp_username' => $smtpConfig->username,
            'smtp_encryption' => $smtpConfig->encryption
        ]);
    }



    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('SendEmailJob failed permanently', [
            'campaign_id' => $this->campaign->id,
            'recipient' => $this->recipient,
            'sender_id' => $this->sender->id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);

        // Only increment failed count, don't mark entire campaign as failed
        $this->campaign->increment('total_failed');
        
        Log::warning('Email job failed, incrementing campaign failed count', [
            'campaign_id' => $this->campaign->id,
            'recipient' => $this->recipient,
            'total_failed' => $this->campaign->fresh()->total_failed
        ]);
        
        // Check if all emails have been processed (sent + failed)
        $this->checkCampaignCompletion();
    }

    /**
     * Check if campaign should be marked as completed
     */
    private function checkCampaignCompletion(): void
    {
        $campaign = $this->campaign->fresh();
        $totalProcessed = ($campaign->total_sent ?? 0) + ($campaign->total_failed ?? 0);
        $totalRecipients = $campaign->recipient_count ?? 0;
        
        // Only check completion if we have recipient count and all are processed
        if ($totalRecipients > 0 && $totalProcessed >= $totalRecipients) {
            // Check if there are any remaining jobs for this campaign
            $pendingJobs = \DB::table('jobs')
                ->where('payload', 'LIKE', '%SendEmailJob%')
                ->where('payload', 'LIKE', '%"campaign_id":' . $campaign->id . '%')
                ->count();
                
            if ($pendingJobs == 0) {
                $campaign->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);
                
                // Send completion notification
                $campaign->user->notify(new \App\Notifications\CampaignCompleted($campaign));
                
                Log::info('Campaign marked as completed from SendEmailJob', [
                    'campaign_id' => $campaign->id,
                    'total_sent' => $campaign->total_sent,
                    'total_failed' => $campaign->total_failed,
                    'total_processed' => $totalProcessed,
                    'total_recipients' => $totalRecipients,
                ]);
            }
        }
    }
}