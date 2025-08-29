<?php

namespace App\Services;

use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\SuppressionListTrait;
use App\Models\User;
use App\Models\Campaign;
use App\Models\Content;
use App\Models\Sender;
use App\Models\SuppressionList;
use App\Jobs\SendEmailJob;
use App\Services\PerformanceMonitoringService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UnifiedEmailSendingService
{
    use LoggingTrait, ValidationTrait, SuppressionListTrait;

    /**
     * Send single email with unified validation and processing
     */
    public function sendSingleEmail(array $data): array
    {
        $this->logInfo('Starting single email send', [
            'to' => $data['to'],
            'sender_id' => $data['sender_id'],
            'subject' => $data['subject']
        ]);

        try {
            DB::beginTransaction();

            // Validate and get sender
            $sender = $this->validateAndGetSender($data['sender_id']);

            // Prepare recipients list
            $recipients = $this->prepareRecipientsList($data);

            // Check suppression list for all recipients
            $this->validateRecipientsAgainstSuppression($recipients);

            // Create single send campaign
            $campaign = $this->createSingleSendCampaign($data, $recipients, $sender);

            // Create content for this single send
            $content = $this->createSingleSendContent($data);

            // Associate content with campaign
            $campaign->contents()->attach($content->id);
            $campaign->update(['content_ids' => [$content->id]]);

            // Dispatch email jobs for all recipients
            $this->dispatchEmailJobs($recipients, $sender, $content, $campaign);

            // Note: total_sent will be updated by SendEmailJob when emails are actually sent
            // Don't set total_sent here as it causes double counting

            DB::commit();

            $this->logInfo('Single email job dispatched successfully', [
                'campaign_id' => $campaign->id,
                'recipients_count' => count($recipients)
            ]);

            return [
                'success' => true,
                'campaign' => $campaign,
                'recipients_count' => count($recipients),
                'message' => 'Email sent successfully to ' . count($recipients) . ' recipient(s)'
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            $this->logError('Single email send failed', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Send campaign emails with unified processing
     */
    public function sendCampaignEmails(Campaign $campaign, int $batchSize = 100): array
    {
        $this->logInfo('Starting campaign email send', [
            'campaign_id' => $campaign->id,
            'batch_size' => $batchSize
        ]);

        try {
            // Validate campaign can be sent
            $this->validateCampaignForSending($campaign);

            // Get campaign recipients
            $recipients = $this->getCampaignRecipients($campaign);

            // Get campaign senders and contents
            $senders = $campaign->getSenders();
            $contents = $campaign->getContentVariations();

            if (empty($senders) || empty($contents)) {
                throw new \Exception('Campaign must have at least one sender and one content variation');
            }

            // Process recipients in batches
            $totalSent = 0;
            $batches = array_chunk($recipients, $batchSize);

            foreach ($batches as $batchIndex => $batch) {
                foreach ($batch as $recipientIndex => $recipient) {
                    // Get next sender and content for shuffling
                    $sender = $this->getNextSender($senders, $totalSent);
                    $content = $this->getNextContent($contents, $totalSent);

                    // Dispatch email job
                    SendEmailJob::dispatch(
                        $recipient['email'],
                        $sender,
                        $content,
                        $campaign,
                        $recipient
                    );

                    $totalSent++;
                }

                // Note: Campaign progress and total_sent will be updated by SendEmailJob 
                // when emails are actually sent. Don't update here to avoid double counting.
            }

            $this->logInfo('Campaign email jobs dispatched successfully', [
                'campaign_id' => $campaign->id,
                'jobs_dispatched' => $totalSent // Changed from total_sent to jobs_dispatched for clarity
            ]);

            return [
                'success' => true,
                'jobs_dispatched' => $totalSent, // Changed from total_sent to jobs_dispatched
                'batches_processed' => count($batches)
            ];

        } catch (\Exception $e) {
            $this->logError('Campaign email send failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Validate and get sender
     */
    private function validateAndGetSender(int $senderId): Sender
    {
        $sender = Sender::where('id', $senderId)
            ->where('user_id', Auth::id())
            ->where('is_active', true)
            ->first();

        if (!$sender) {
            throw new \Exception('Invalid sender selected or sender is not active');
        }

        return $sender;
    }

    /**
     * Prepare recipients list from request data
     */
    private function prepareRecipientsList(array $data): array
    {
        $recipients = [$data['to']];

        if (!empty($data['bcc'])) {
            $bccEmails = array_filter(array_map('trim', explode(',', $data['bcc'])));
            $recipients = array_merge($recipients, $bccEmails);
        }

        // Validate all email addresses
        foreach ($recipients as $email) {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new \Exception("Invalid email address: {$email}");
            }
        }

        return $recipients;
    }

    /**
     * Validate recipients against suppression list
     */
    private function validateRecipientsAgainstSuppression(array $recipients): void
    {
        $suppressedEmails = [];
        
        foreach ($recipients as $email) {
            if ($this->isEmailSuppressed($email)) {
                $suppressedEmails[] = $email;
            }
        }

        if (!empty($suppressedEmails)) {
            throw new \Exception(
                'The following recipients are in the suppression list: ' . implode(', ', $suppressedEmails)
            );
        }
    }

    /**
     * Create single send campaign
     */
    private function createSingleSendCampaign(array $data, array $recipients, Sender $sender): Campaign
    {
        return Campaign::create([
            'user_id' => Auth::id(),
            'name' => 'Single Send: ' . $data['subject'] . ' - ' . now()->format('Y-m-d H:i:s'),
            'type' => 'single',
            'subject' => $data['subject'],
            'single_recipient_email' => $data['to'],
            'bcc_recipients' => $data['bcc'] ?? null,
            'single_sender_id' => $sender->id,
            'recipient_count' => count($recipients),
            'status' => 'RUNNING',
            'enable_open_tracking' => $data['enable_open_tracking'] ?? true,
            'enable_click_tracking' => $data['enable_click_tracking'] ?? true,
            'enable_unsubscribe_link' => $data['enable_unsubscribe_link'] ?? true,
            'started_at' => now(),
        ]);
    }

    /**
     * Create single send content
     */
    private function createSingleSendContent(array $data): Content
    {
        return Content::create([
            'user_id' => Auth::id(),
            'name' => 'Single Send Content - ' . now()->format('Y-m-d H:i:s'),
            'subject' => $data['subject'],
            'html_body' => $data['content'],
            'text_body' => strip_tags($data['content']),
            'is_active' => true,
        ]);
    }

    /**
     * Dispatch email jobs for recipients
     */
    private function dispatchEmailJobs(array $recipients, Sender $sender, Content $content, Campaign $campaign): void
    {
        foreach ($recipients as $recipient) {
            SendEmailJob::dispatch(
                $recipient,
                $sender,
                $content,
                $campaign,
                ['email' => $recipient]
            );
        }
    }

    /**
     * Validate campaign for sending
     */
    private function validateCampaignForSending(Campaign $campaign): void
    {
        if (!in_array($campaign->status, ['DRAFT', 'PAUSED'])) {
            throw new \Exception('Campaign can only be sent from DRAFT or PAUSED status');
        }

        if (!$campaign->recipient_list_path) {
            throw new \Exception('Campaign must have a recipient list');
        }

        // Check user limits
        $user = $campaign->user;
        if (!$user->canCreateLiveCampaign()) {
            $limits = $user->getPlanLimits();
            throw new \Exception('Live campaign limit reached. Your plan allows ' . $limits['max_live_campaigns'] . ' live campaigns maximum.');
        }
    }

    /**
     * Get campaign recipients from file
     */
    private function getCampaignRecipients(Campaign $campaign): array
    {
        // This would read from the campaign's recipient list file
        // For now, return empty array - this should be implemented based on file processing logic
        return [];
    }

    /**
     * Get next sender for shuffling
     */
    private function getNextSender(array $senders, int $index): Sender
    {
        return $senders[$index % count($senders)];
    }

    /**
     * Get next content for switching
     */
    private function getNextContent(array $contents, int $index): Content
    {
        return $contents[$index % count($contents)];
    }

    /**
     * Check if email is suppressed (using trait)
     */
    private function isEmailSuppressed(string $email): bool
    {
        return $this->shouldSuppressEmail($email);
    }
}
