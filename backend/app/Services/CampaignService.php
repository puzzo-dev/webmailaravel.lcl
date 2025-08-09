<?php

namespace App\Services;

use App\Events\CampaignStatusChanged;
use App\Jobs\ProcessCampaignJob;
use App\Models\Campaign;
use App\Models\Content;
use App\Models\Sender;
use App\Models\User;
use App\Notifications\CampaignCompleted;
use App\Notifications\CampaignCreated;
use App\Notifications\CampaignFailed;
use App\Notifications\CampaignMilestone;
use App\Notifications\CampaignStatusChanged as CampaignStatusNotification;
use App\Notifications\HighBounceRateAlert;
use App\Traits\CacheManagementTrait;
use App\Traits\FileProcessingTrait;
use App\Traits\LoggingTrait;
use App\Traits\SuppressionListTrait;
use App\Traits\ValidationTrait;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CampaignService
{
    use CacheManagementTrait, FileProcessingTrait, LoggingTrait, SuppressionListTrait, ValidationTrait;

    public function __construct(
        // FileUploadService $fileUploadService // This dependency is now handled by FileProcessingTrait
    ) {
        // $this->fileUploadService = $fileUploadService; // This dependency is now handled by FileProcessingTrait
    }

    /**
     * Create a new campaign with sender/content shuffling
     */
    public function createCampaign(array $data, $recipientFile = null): Campaign
    {
        $this->logMethodEntry(__METHOD__, [
            'campaign_name' => $data['name'] ?? 'unknown',
            'has_recipient_file' => $recipientFile !== null,
        ]);

        try {
            DB::beginTransaction();

            // Validate campaign data
            $this->validateCampaignData($data);

            // Check user's campaign limits
            $this->checkUserCampaignLimits(auth()->id());

            // Get user's senders and contents
            $user = User::find(auth()->id());
            $userSenders = $user->senders()->where('is_active', true)->get();
            $userContents = $user->contents()->where('is_active', true)->get();

            if ($userSenders->isEmpty()) {
                throw new \Exception('No active senders found for this user');
            }

            // Process content variations if content switching is enabled
            $processedData = $this->processContentVariations($data, $userContents);

            // Upload recipient list if provided using FileProcessingTrait
            $recipientPath = null;
            $recipientData = [];
            if ($recipientFile) {
                $uploadResult = $this->uploadRecipientList($recipientFile, $data['name']);

                if (! $uploadResult['success']) {
                    throw new \Exception($uploadResult['error']);
                }

                $recipientPath = $uploadResult['path'];
                $recipientData = $uploadResult['recipient_data'] ?? [];

                // Filter out suppressed emails from recipient list using trait
                $recipientPath = $this->filterSuppressedEmails($recipientPath, $data['name']);
            }

            // Create campaign
            $campaign = Campaign::create([
                'user_id' => auth()->id(),
                'name' => $data['name'],
                'subject' => $processedData['subject'],
                'sender_ids' => $userSenders->pluck('id')->toArray(), // All user's senders
                'content_ids' => $processedData['content_ids'],
                'recipient_list_path' => $recipientPath,
                'recipient_count' => $recipientPath ? $this->countRecipients($recipientPath) : 0,
                'enable_content_switching' => $processedData['enable_content_switching'],
                'template_variables' => $data['template_variables'] ?? null,
                'enable_template_variables' => $data['enable_template_variables'] ?? false,
                'enable_open_tracking' => $data['enable_open_tracking'] ?? true,
                'enable_click_tracking' => $data['enable_click_tracking'] ?? true,
                'enable_unsubscribe_link' => $data['enable_unsubscribe_link'] ?? true,
                'recipient_field_mapping' => $data['recipient_field_mapping'] ?? null,
                'status' => 'DRAFT',
            ]);

            // Store recipient data in cache for template variable processing
            if (! empty($recipientData)) {
                $this->storeRecipientData($campaign, $recipientData);
            }

            // Store content variations in cache for content switching
            if ($campaign->enable_content_switching && ! empty($processedData['content_ids'])) {
                $this->storeContentVariations($campaign, $processedData['content_variations']);
            }

            // Store sender list in cache for sender shuffling
            $this->storeSenderList($campaign, $userSenders);

            DB::commit();

            // Send campaign created notification
            $campaign->user->notify(new CampaignCreated($campaign));

            $this->logInfo('Campaign created', [
                'campaign_id' => $campaign->id,
                'user_id' => auth()->id(),
                'sender_count' => $userSenders->count(),
                'content_count' => count($processedData['content_ids']),
                'enable_content_switching' => $campaign->enable_content_switching,
            ]);

            $this->logMethodExit(__METHOD__, ['campaign_id' => $campaign->id]);

            return $campaign;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->logError('Campaign creation failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Filter suppressed emails from recipient list
     */
    private function filterSuppressedEmails(string $originalPath, string $campaignName): string
    {
        try {
            $originalContent = $this->readFile($originalPath, ['disk' => 'local']);
            $emails = array_filter(array_map('trim', explode("\n", $originalContent)));

            $filteredEmails = [];
            $suppressedCount = 0;

            foreach ($emails as $email) {
                if ($this->validateEmail($email)) {
                    if ($this->shouldSuppressEmail($email)) {
                        $suppressedCount++;

                        continue;
                    }
                    $filteredEmails[] = $email;
                }
            }

            // Create filtered file
            $filteredContent = implode("\n", $filteredEmails);
            $filteredPath = 'recipient_lists/filtered_'.$campaignName.'_'.time().'.txt';

            $this->writeFile($filteredPath, $filteredContent, ['disk' => 'local']);

            $this->logInfo('Recipient list filtered', [
                'original_count' => count($emails),
                'filtered_count' => count($filteredEmails),
                'suppressed_count' => $suppressedCount,
                'original_path' => $originalPath,
                'filtered_path' => $filteredPath,
            ]);

            return $filteredPath;

        } catch (\Exception $e) {
            $this->logError('Failed to filter suppressed emails', [
                'original_path' => $originalPath,
                'error' => $e,
            ]);

            // Return original path if filtering fails
            return $originalPath;
        }
    }

    /**
     * Validate campaign data
     */
    private function validateCampaignData(array $data): void
    {
        $requiredFields = ['name'];
        $validation = $this->validateRequiredFields($data, $requiredFields);

        if (! $validation['is_valid']) {
            throw new \Exception(implode(', ', $validation['errors']));
        }

        // Check if content switching is enabled
        $enableContentSwitching = $data['enable_content_switching'] ?? false;

        if ($enableContentSwitching) {
            // Content switching mode - validate content variations
            if (empty($data['content_variations'])) {
                throw new \Exception('Content variations are required when content switching is enabled');
            }

            foreach ($data['content_variations'] as $variation) {
                if (empty($variation['subject'])) {
                    throw new \Exception('Subject is required for each content variation');
                }

                // Check if content is actually empty (handle Quill empty states)
                $variationContent = $variation['content'] ?? '';
                $cleanVariationContent = trim(strip_tags(str_replace(['<p><br></p>', '<p></p>', '<br>', '&nbsp;'], '', $variationContent)));

                if (empty($variationContent) || $cleanVariationContent === '') {
                    throw new \Exception('Content is required for each content variation');
                }
            }
        } else {
            // Single content mode - validate subject and content
            if (empty($data['subject'])) {
                throw new \Exception('Subject is required when content switching is disabled');
            }
            // Check if content is actually empty (handle Quill empty states)
            $content = $data['content'] ?? '';
            $cleanContent = trim(strip_tags(str_replace(['<p><br></p>', '<p></p>', '<br>', '&nbsp;'], '', $content)));

            if (empty($content) || $cleanContent === '') {
                throw new \Exception('Content is required when content switching is disabled');
            }
        }
    }

    /**
     * Check user's campaign limits
     */
    private function checkUserCampaignLimits(int $userId): void
    {
        $user = User::find($userId);

        // Check total campaigns limit (100 per user)
        if (! $user->canCreateCampaign()) {
            $limits = $user->getPlanLimits();
            throw new \Exception('Total campaign limit reached. Your plan allows '.$limits['max_total_campaigns'].' campaigns maximum.');
        }

        // Check live campaigns limit (10 per user) - only when campaign status would be active
        $liveCampaigns = Campaign::where('user_id', $userId)
            ->whereIn('status', ['active', 'running', 'paused'])
            ->count();

        $limits = $user->getPlanLimits();

        if ($liveCampaigns >= $limits['max_live_campaigns']) {
            throw new \Exception('Live campaign limit reached. Your plan allows '.$limits['max_live_campaigns'].' live campaigns maximum.');
        }
    }

    /**
     * Process content variations for content switching
     */
    private function processContentVariations(array $data, $userContents): array
    {
        $processedData = $data;
        $contentIds = [];

        if (! empty($data['enable_content_switching']) && ! empty($data['content_variations'])) {
            // Content switching mode - create Content records for each variation
            $firstVariation = $data['content_variations'][0];
            $processedData['subject'] = $firstVariation['subject'] ?? $data['subject'];

            foreach ($data['content_variations'] as $index => $variation) {
                $content = Content::create([
                    'user_id' => auth()->id(),
                    'name' => $data['name'].' - Variation '.($index + 1),
                    'subject' => $variation['subject'] ?? $data['subject'],
                    'html_body' => $variation['content'],
                    'text_body' => strip_tags($variation['content']),
                    'is_active' => true,
                ]);
                $contentIds[] = $content->id;
            }

            $processedData['content_ids'] = $contentIds;
            $processedData['content_variations'] = $data['content_variations'];
            $processedData['enable_content_switching'] = true;
        } else {
            // Single content mode - create one Content record
            if (! empty($data['content'])) {
                $content = Content::create([
                    'user_id' => auth()->id(),
                    'name' => $data['name'].' - Content',
                    'subject' => $data['subject'],
                    'html_body' => $data['content'],
                    'text_body' => strip_tags($data['content']),
                    'is_active' => true,
                ]);
                $contentIds[] = $content->id;
            }

            $processedData['enable_content_switching'] = false;
            $processedData['content_ids'] = $contentIds;
            $processedData['content_variations'] = [];
        }

        return $processedData;
    }

    /**
     * Store content variations in cache for content switching
     */
    private function storeContentVariations(Campaign $campaign, array $contentVariations): void
    {
        $variations = [];
        foreach ($contentVariations as $variation) {
            $variations[] = [
                'subject' => $variation['subject'],
                'content' => $variation['content'],
                'html_body' => $variation['content'], // Use content as html_body
                'text_body' => strip_tags($variation['content']), // Strip HTML for text version
            ];
        }

        $cacheKey = "campaign:{$campaign->id}:content_variations";
        $this->cache($cacheKey, json_encode($variations), 3600); // 1 hour TTL
    }

    /**
     * Store recipient data in cache for template variable processing
     */
    private function storeRecipientData(Campaign $campaign, array $recipientData): void
    {
        $cacheKey = "campaign:{$campaign->id}:recipient_data";
        $this->cache($cacheKey, json_encode($recipientData), 3600); // 1 hour TTL

        $this->logInfo('Recipient data stored for template variables', [
            'campaign_id' => $campaign->id,
            'recipient_count' => count($recipientData),
        ]);
    }

    /**
     * Store sender list in cache for sender shuffling
     */
    private function storeSenderList(Campaign $campaign, $senders): void
    {
        $senderList = $senders->map(function ($sender) {
            return [
                'id' => $sender->id,
                'name' => $sender->name,
                'email' => $sender->email,
                'domain_id' => $sender->domain_id,
            ];
        })->toArray();

        $cacheKey = "campaign:{$campaign->id}:senders";
        $this->cache($cacheKey, function () use ($senderList) {
            return json_encode($senderList);
        }, 3600); // 1 hour TTL
    }

    /**
     * Upload recipient list file
     */
    private function uploadRecipientList($file, string $campaignName): array
    {
        try {
            $uploadResult = $this->uploadFile($file, 'campaigns/recipients', [
                'disk' => 'local',
                'visibility' => 'private',
                'max_size' => 10240, // 10MB
                'allowed_extensions' => ['txt', 'csv', 'xlsx', 'xls'],
                'generate_unique_name' => true,
                'preserve_original_name' => false,
            ]);

            if (! $uploadResult['success']) {
                return [
                    'success' => false,
                    'error' => $uploadResult['error'],
                ];
            }

            // Process recipient data
            $recipientData = $this->processRecipientData($uploadResult['processed_data']);

            return [
                'success' => true,
                'path' => $uploadResult['path'],
                'filename' => $uploadResult['filename'],
                'size' => $uploadResult['size'],
                'mime_type' => $uploadResult['mime_type'],
                'recipient_data' => $recipientData,
            ];

        } catch (\Exception $e) {
            $this->logError('Recipient list upload failed', [
                'campaign_name' => $campaignName,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Process recipient data from uploaded file
     */
    private function processRecipientData(array $processedData): array
    {
        if (! $processedData['processed']) {
            return [];
        }

        $recipients = [];

        switch ($processedData['type']) {
            case 'csv':
                $recipients = $processedData['sample_data'] ?? [];
                break;
            case 'excel':
                // For Excel files, we'll need to implement proper processing
                $recipients = [];
                break;
            case 'txt':
                // For text files, assume one email per line
                $recipients = array_map(function ($email) {
                    return ['email' => trim($email)];
                }, $processedData['sample_data'] ?? []);
                break;
        }

        return $recipients;
    }

    /**
     * Get recipient data for template variable processing
     */
    public function getRecipientData(int $campaignId, string $email): array
    {
        $cacheKey = "campaign:{$campaignId}:recipient_data";
        $recipientData = Cache::get($cacheKey);

        if ($recipientData) {
            $data = json_decode($recipientData, true);

            return $data[strtolower($email)] ?? [];
        }

        return [];
    }

    /**
     * Start campaign
     */
    public function startCampaign(Campaign $campaign): array
    {
        $this->logMethodEntry(__METHOD__, ['campaign_id' => $campaign->id]);

        try {
            // Validate campaign can be started
            if ($campaign->status !== 'DRAFT') {
                throw new \Exception('Campaign can only be started from DRAFT status');
            }

            // Check live campaign limits before starting
            $user = $campaign->user;
            if (! $user->canCreateLiveCampaign()) {
                $limits = $user->getPlanLimits();
                throw new \Exception('Live campaign limit reached. Your plan allows '.$limits['max_live_campaigns'].' live campaigns maximum.');
            }

            // Check if recipient list exists
            if (! $campaign->recipient_list_path || ! $this->fileExists($campaign->recipient_list_path, ['disk' => 'local'])) {
                throw new \Exception('Recipient list not found');
            }

            // Update campaign status
            $campaign->update([
                'status' => 'RUNNING',
                'started_at' => now(),
            ]);

            // Dispatch campaign processing job
            ProcessCampaignJob::dispatch($campaign->id);

            // Broadcast status change
            event(new CampaignStatusChanged($campaign));

            // Send notification
            $campaign->user->notify(new CampaignStatusNotification($campaign));

            $this->logInfo('Campaign started', [
                'campaign_id' => $campaign->id,
                'user_id' => $campaign->user_id,
                'recipient_count' => $campaign->recipient_count,
            ]);

            return [
                'success' => true,
                'message' => 'Campaign started successfully',
            ];

        } catch (\Exception $e) {
            $this->logError('Campaign start failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Pause campaign
     */
    public function pauseCampaign(Campaign $campaign): array
    {
        $this->logMethodEntry(__METHOD__, ['campaign_id' => $campaign->id]);

        try {
            // Validate campaign can be paused
            if (! in_array($campaign->status, ['RUNNING', 'SCHEDULED'])) {
                throw new \Exception('Campaign can only be paused from RUNNING or SCHEDULED status');
            }

            // Update campaign status
            $campaign->update([
                'status' => 'PAUSED',
                'paused_at' => now(),
            ]);

            // Cancel any running jobs for this campaign
            $this->cancelCampaignJobs($campaign->id);

            // Broadcast status change
            event(new CampaignStatusChanged($campaign));

            // Send notification
            $campaign->user->notify(new CampaignStatusNotification($campaign));

            $this->logInfo('Campaign paused', [
                'campaign_id' => $campaign->id,
                'user_id' => $campaign->user_id,
            ]);

            return ['success' => true, 'campaign' => $campaign];

        } catch (\Exception $e) {
            $this->logError('Campaign pause failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Resume campaign
     */
    public function resumeCampaign(Campaign $campaign): array
    {
        $this->logMethodEntry(__METHOD__, ['campaign_id' => $campaign->id]);

        try {
            // Validate campaign can be resumed
            if ($campaign->status !== 'PAUSED') {
                throw new \Exception('Campaign can only be resumed from PAUSED status');
            }

            // Update campaign status
            $campaign->update([
                'status' => 'RUNNING',
                'resumed_at' => now(),
            ]);

            // Dispatch campaign processing job
            ProcessCampaignJob::dispatch($campaign->id);

            // Broadcast status change
            event(new CampaignStatusChanged($campaign));

            // Send notification
            $campaign->user->notify(new CampaignStatusNotification($campaign));

            $this->logInfo('Campaign resumed', [
                'campaign_id' => $campaign->id,
                'user_id' => $campaign->user_id,
            ]);

            return ['success' => true, 'campaign' => $campaign];

        } catch (\Exception $e) {
            $this->logError('Campaign resume failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Stop campaign
     */
    public function stopCampaign(Campaign $campaign): array
    {
        $this->logMethodEntry(__METHOD__, ['campaign_id' => $campaign->id]);

        try {
            // Validate campaign can be stopped
            if (! in_array($campaign->status, ['RUNNING', 'PAUSED', 'SCHEDULED'])) {
                throw new \Exception('Campaign can only be stopped from RUNNING, PAUSED, or SCHEDULED status');
            }

            // Update campaign status
            $campaign->update([
                'status' => 'STOPPED',
                'stopped_at' => now(),
            ]);

            // Cancel any running jobs for this campaign
            $this->cancelCampaignJobs($campaign->id);

            // Broadcast status change
            event(new CampaignStatusChanged($campaign));

            // Send notification
            $campaign->user->notify(new CampaignStatusNotification($campaign));

            $this->logInfo('Campaign stopped', [
                'campaign_id' => $campaign->id,
                'user_id' => $campaign->user_id,
            ]);

            return ['success' => true, 'campaign' => $campaign];

        } catch (\Exception $e) {
            $this->logError('Campaign stop failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Duplicate campaign
     */
    public function duplicateCampaign(Campaign $originalCampaign): Campaign
    {
        $this->logMethodEntry(__METHOD__, ['original_campaign_id' => $originalCampaign->id]);

        DB::beginTransaction();
        try {
            // Copy recipient list file if it exists
            $newRecipientListPath = null;
            if ($originalCampaign->recipient_list_path && $this->fileExists($originalCampaign->recipient_list_path, ['disk' => 'local'])) {
                $originalFileContent = $this->readFile($originalCampaign->recipient_list_path, ['disk' => 'local']);
                $newFileName = 'recipient_lists/duplicated_'.time().'_'.basename($originalCampaign->recipient_list_path);
                $this->writeFile($newFileName, $originalFileContent, ['disk' => 'local']);
                $newRecipientListPath = $newFileName;
            }

            // Get current user's senders to use for the duplicate
            $user = User::find(Auth::id());
            $userSenders = $user->senders()->where('is_active', true)->get();

            if ($userSenders->isEmpty()) {
                throw new \Exception('No active senders found for user. Cannot duplicate campaign.');
            }

            // Create new campaign with duplicated data
            $duplicateData = [
                'user_id' => Auth::id(),
                'name' => $originalCampaign->name.' (Copy)',
                'subject' => $originalCampaign->subject,
                'sender_ids' => $userSenders->pluck('id')->toArray(), // Use current user's senders
                'content_ids' => $originalCampaign->content_ids,
                'recipient_list_path' => $newRecipientListPath,
                'recipient_count' => $originalCampaign->recipient_count,
                'enable_content_switching' => $originalCampaign->enable_content_switching,
                'template_variables' => $originalCampaign->template_variables,
                'enable_template_variables' => $originalCampaign->enable_template_variables,
                'enable_open_tracking' => $originalCampaign->enable_open_tracking,
                'enable_click_tracking' => $originalCampaign->enable_click_tracking,
                'enable_unsubscribe_link' => $originalCampaign->enable_unsubscribe_link,
                'recipient_field_mapping' => $originalCampaign->recipient_field_mapping,
                'status' => 'DRAFT',
            ];

            // Create the duplicated campaign
            $duplicatedCampaign = Campaign::create($duplicateData);

            // Copy recipient data to new cache keys
            $originalRecipientData = Cache::get("campaign:{$originalCampaign->id}:recipient_data");
            if ($originalRecipientData) {
                Cache::put("campaign:{$duplicatedCampaign->id}:recipient_data", $originalRecipientData, now()->addHours(24));
            }

            // Copy content variations if content switching is enabled
            if ($originalCampaign->enable_content_switching) {
                $originalContentVariations = Cache::get("campaign:{$originalCampaign->id}:content_variations");
                if ($originalContentVariations) {
                    Cache::put("campaign:{$duplicatedCampaign->id}:content_variations", $originalContentVariations, now()->addHours(24));
                }
            }

            // Store sender list in cache for the duplicated campaign
            $this->storeSenderList($duplicatedCampaign, $userSenders);

            DB::commit();

            $this->logInfo('Campaign duplicated successfully', [
                'original_campaign_id' => $originalCampaign->id,
                'duplicated_campaign_id' => $duplicatedCampaign->id,
                'user_id' => Auth::id(),
                'new_recipient_list_path' => $newRecipientListPath,
                'sender_count' => $userSenders->count(),
            ]);

            $this->logMethodExit(__METHOD__, ['duplicated_campaign_id' => $duplicatedCampaign->id]);

            return $duplicatedCampaign;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->logError('Campaign duplication failed', [
                'original_campaign_id' => $originalCampaign->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete campaign
     */
    public function deleteCampaign(Campaign $campaign): array
    {
        $this->logMethodEntry(__METHOD__, ['campaign_id' => $campaign->id]);

        try {
            // Check if campaign can be deleted
            if (in_array($campaign->status, ['RUNNING', 'SCHEDULED'])) {
                throw new \Exception('Cannot delete campaign while it is running or scheduled');
            }

            // Cancel any running jobs for this campaign
            $this->cancelCampaignJobs($campaign->id);

            // Clean up campaign files
            $this->cleanupCampaignFiles($campaign);

            // Delete campaign
            $campaign->delete();

            $this->logInfo('Campaign deleted', [
                'campaign_id' => $campaign->id,
                'user_id' => $campaign->user_id,
            ]);

            return ['success' => true];

        } catch (\Exception $e) {
            $this->logError('Campaign deletion failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Clean up campaign files
     */
    private function cleanupCampaignFiles(Campaign $campaign): void
    {
        try {
            // Delete recipient list file
            if ($campaign->recipient_list_path && $this->fileExists($campaign->recipient_list_path, ['disk' => 'local'])) {
                $this->deleteFile($campaign->recipient_list_path, 'local');
            }

            // Delete sent list file
            if ($campaign->sent_list_path && $this->fileExists($campaign->sent_list_path, ['disk' => 'local'])) {
                $this->deleteFile($campaign->sent_list_path, 'local');
            }

            // Clear cache entries
            $this->forgetCachedData("campaign:{$campaign->id}:content_variations");
            $this->forgetCachedData("campaign:{$campaign->id}:recipient_data");
            $this->forgetCachedData("campaign:{$campaign->id}:senders");
            $this->logInfo('Campaign files cleaned up', ['campaign_id' => $campaign->id]);

        } catch (\Exception $e) {
            $this->logError('Failed to cleanup campaign files', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Update campaign status
     */
    public function updateCampaignStatus(Campaign $campaign, string $status): void
    {
        $this->logMethodEntry(__METHOD__, [
            'campaign_id' => $campaign->id,
            'new_status' => $status,
        ]);

        $oldStatus = $campaign->status;
        $campaign->update(['status' => $status]);

        // Broadcast status change
        event(new CampaignStatusChanged($campaign));

        // Send notification
        $campaign->user->notify(new CampaignStatusNotification($campaign));

        $this->logInfo('Campaign status updated', [
            'campaign_id' => $campaign->id,
            'old_status' => $oldStatus,
            'new_status' => $status,
        ]);

        $this->logMethodExit(__METHOD__, ['success' => true]);
    }

    /**
     * Process campaign - send emails to recipients in batches
     */
    public function processCampaign(Campaign $campaign, int $batchSize = 100): array
    {
        $this->logMethodEntry(__METHOD__, [
            'campaign_id' => $campaign->id,
            'batch_size' => $batchSize,
        ]);

        $startTime = microtime(true);
        $emailsSent = 0;
        $emailsFailed = 0;
        $remainingRecipients = 0;

        try {
            // Check if campaign is still active/running
            if (! in_array($campaign->status, ['RUNNING', 'active'])) {
                $this->logInfo('Campaign is not in running state, skipping processing', [
                    'campaign_id' => $campaign->id,
                    'status' => $campaign->status,
                ]);

                return [
                    'emails_sent' => 0,
                    'emails_failed' => 0,
                    'remaining_recipients' => 0,
                    'processing_time' => 0,
                ];
            }

            // Check if recipient list exists
            if (! $campaign->recipient_list_path || ! $this->fileExists($campaign->recipient_list_path, ['disk' => 'local'])) {
                throw new \Exception('Recipient list file not found');
            }

            // Read recipient list
            $recipientContent = $this->readFile($campaign->recipient_list_path, ['disk' => 'local']);
            $recipients = array_filter(array_map('trim', explode("\n", $recipientContent)));

            if (empty($recipients)) {
                throw new \Exception('No recipients found in recipient list');
            }

            // Get campaign's senders for shuffling
            $senders = $campaign->getSenders();
            if ($senders->isEmpty()) {
                throw new \Exception('No senders found for campaign');
            }

            // Get campaign's content variations
            $contents = $campaign->getContentVariations();
            if ($contents->isEmpty()) {
                throw new \Exception('No content found for campaign');
            }

            // Process recipients in batches
            $processedCount = $campaign->total_sent ?? 0;
            $recipientsToProcess = array_slice($recipients, $processedCount, $batchSize);
            $remainingRecipients = count($recipients) - ($processedCount + count($recipientsToProcess));

            $this->logInfo('Processing campaign batch', [
                'campaign_id' => $campaign->id,
                'total_recipients' => count($recipients),
                'processed_count' => $processedCount,
                'batch_size' => count($recipientsToProcess),
                'remaining_recipients' => $remainingRecipients,
            ]);

            // Process each recipient in this batch
            foreach ($recipientsToProcess as $index => $recipient) {
                try {
                    // Validate email
                    if (! filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
                        $this->logWarning('Invalid email address skipped', [
                            'campaign_id' => $campaign->id,
                            'recipient' => $recipient,
                        ]);
                        $emailsFailed++;

                        continue;
                    }

                    // Get sender for this email (shuffling)
                    $currentIndex = $processedCount + $index;
                    $sender = $senders[$currentIndex % $senders->count()];

                    // Get content for this email (content switching if enabled)
                    if ($campaign->enable_content_switching && $contents->count() > 1) {
                        $content = $contents[$currentIndex % $contents->count()];
                    } else {
                        $content = $contents->first();
                    }

                    // Get recipient data for template variables
                    $recipientData = $this->getRecipientData($campaign->id, $recipient);

                    // Dispatch email sending job
                    \App\Jobs\SendEmailJob::dispatch($recipient, $sender, $content, $campaign, $recipientData);

                    $emailsSent++;

                    $this->logInfo('Email job dispatched', [
                        'campaign_id' => $campaign->id,
                        'recipient' => $recipient,
                        'sender_id' => $sender->id,
                        'sender_name' => $sender->name,
                        'sender_email' => $sender->email,
                        'content_id' => $content->id,
                    ]);

                } catch (\Exception $e) {
                    $this->logError('Failed to dispatch email job', [
                        'campaign_id' => $campaign->id,
                        'recipient' => $recipient,
                        'error' => $e->getMessage(),
                    ]);
                    $emailsFailed++;
                }
            }

            // Update campaign statistics
            $campaign->update([
                'total_sent' => ($campaign->total_sent ?? 0) + $emailsSent,
                'total_failed' => ($campaign->total_failed ?? 0) + $emailsFailed,
            ]);

            // Check for milestones and send notifications
            $this->checkCampaignMilestones($campaign);

            // Mark campaign as completed if all emails have been processed
            if ($remainingRecipients <= 0) {
                $campaign->update([
                    'status' => 'COMPLETED',
                    'completed_at' => now(),
                ]);

                // Send campaign completed notification
                $campaign->user->notify(new CampaignCompleted($campaign));

                $this->logInfo('Campaign completed', [
                    'campaign_id' => $campaign->id,
                    'total_sent' => $campaign->total_sent,
                    'total_failed' => $campaign->total_failed,
                ]);
            }

            $processingTime = microtime(true) - $startTime;

            $this->logInfo('Campaign batch processed successfully', [
                'campaign_id' => $campaign->id,
                'emails_sent' => $emailsSent,
                'emails_failed' => $emailsFailed,
                'remaining_recipients' => $remainingRecipients,
                'processing_time' => $processingTime,
            ]);

            $this->logMethodExit(__METHOD__, [
                'emails_sent' => $emailsSent,
                'emails_failed' => $emailsFailed,
                'remaining_recipients' => $remainingRecipients,
            ]);

            return [
                'emails_sent' => $emailsSent,
                'emails_failed' => $emailsFailed,
                'remaining_recipients' => $remainingRecipients,
                'processing_time' => $processingTime,
            ];

        } catch (\Exception $e) {
            $this->logError('Campaign processing failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
            ]);

            // Mark campaign as failed
            $campaign->update(['status' => 'FAILED']);

            // Send campaign failed notification
            $campaign->user->notify(new CampaignFailed($campaign, $e->getMessage()));

            throw $e;
        }
    }

    /**
     * Get next sender for shuffling
     */
    public function getNextSender(int $campaignId, int $index): ?array
    {
        $cacheKey = "campaign:{$campaignId}:senders";
        $senderList = Cache::get($cacheKey);

        if (! $senderList) {
            return null;
        }

        $senders = json_decode($senderList, true);

        return $senders[$index % count($senders)] ?? null;
    }

    /**
     * Get next content for switching
     */
    public function getNextContent(int $campaignId, int $index): ?array
    {
        $cacheKey = "campaign:{$campaignId}:content_variations";
        $contentList = Cache::get($cacheKey);

        if (! $contentList) {
            return null;
        }

        $contents = json_decode($contentList, true);

        return $contents[$index % count($contents)] ?? null;
    }

    /**
     * Update sent list
     */
    public function updateSentList(Campaign $campaign, string $recipient): void
    {
        $sentListPath = $this->createSentList($campaign->name, [$recipient]);

        // Update campaign with sent list path if not already set
        if (! $campaign->sent_list_path) {
            $campaign->update(['sent_list_path' => $sentListPath]);
        }
    }

    /**
     * Update campaign (admin functionality)
     */
    public function updateCampaign(Campaign $campaign, array $data): array
    {
        $this->logMethodEntry(__METHOD__, [
            'campaign_id' => $campaign->id,
            'update_data' => array_keys($data),
        ]);

        try {
            // Validate status transitions
            if (isset($data['status'])) {
                $this->validateStatusTransition($campaign, $data['status']);
            }

            // Update campaign
            $campaign->update($data);

            // Broadcast status change if status was updated
            if (isset($data['status'])) {
                event(new CampaignStatusChanged($campaign));
                $campaign->user->notify(new CampaignStatusNotification($campaign));
            }

            $this->logInfo('Campaign updated by admin', [
                'campaign_id' => $campaign->id,
                'updated_fields' => array_keys($data),
            ]);

            return ['success' => true, 'campaign' => $campaign];

        } catch (\Exception $e) {
            $this->logError('Campaign update failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Update multiple campaigns with common data (admin functionality)
     */
    public function updateCampaigns(array $campaignIds, array $data): array
    {
        $this->logMethodEntry(__METHOD__, [
            'campaign_ids' => $campaignIds,
            'update_data' => array_keys($data),
        ]);

        try {
            $campaigns = Campaign::whereIn('id', $campaignIds)->get();
            $updatedCount = 0;
            $errors = [];

            foreach ($campaigns as $campaign) {
                try {
                    // Validate status transitions if status is being updated
                    if (isset($data['status'])) {
                        $this->validateStatusTransition($campaign, $data['status']);
                    }

                    $campaign->update($data);
                    $updatedCount++;

                    // Broadcast status change if status was updated
                    if (isset($data['status'])) {
                        event(new CampaignStatusChanged($campaign));
                        $campaign->user->notify(new CampaignStatusNotification($campaign));
                    }

                } catch (\Exception $e) {
                    $errors[] = "Campaign {$campaign->id}: ".$e->getMessage();
                }
            }

            $this->logInfo('Bulk campaign update completed', [
                'total_campaigns' => count($campaignIds),
                'updated_count' => $updatedCount,
                'error_count' => count($errors),
            ]);

            return [
                'success' => true,
                'updated_count' => $updatedCount,
                'total_count' => count($campaignIds),
                'errors' => $errors,
            ];

        } catch (\Exception $e) {
            $this->logError('Bulk campaign update failed', [
                'campaign_ids' => $campaignIds,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Validate status transition
     */
    private function validateStatusTransition(Campaign $campaign, string $newStatus): void
    {
        $allowedTransitions = [
            'draft' => ['scheduled', 'sending'],
            'scheduled' => ['sending', 'draft'],
            'sending' => ['paused', 'completed', 'failed'],
            'paused' => ['sending', 'completed', 'failed'],
            'completed' => [],
            'failed' => ['draft'],
        ];

        $currentStatus = strtolower($campaign->status);
        $newStatus = strtolower($newStatus);

        if (! isset($allowedTransitions[$currentStatus]) ||
            ! in_array($newStatus, $allowedTransitions[$currentStatus])) {
            throw new \Exception("Invalid status transition from {$currentStatus} to {$newStatus}");
        }
    }

    /**
     * Cancel campaign jobs
     */
    private function cancelCampaignJobs(int $campaignId): void
    {
        try {
            $campaign = Campaign::find($campaignId);
            if (! $campaign) {
                return;
            }

            // Check if job_id column exists and has a value
            if (! isset($campaign->job_id) || ! $campaign->job_id) {
                $this->logInfo('No job to cancel for campaign', ['campaign_id' => $campaignId]);

                return;
            }

            // Get the queue connection
            $queue = app('queue');

            // Try to cancel the specific job
            try {
                // This is a simplified approach - in production you would implement proper job cancellation
                // Laravel doesn't have built-in job cancellation, so you'd need to:
                // 1. Store job IDs in the database
                // 2. Implement a custom job cancellation mechanism
                // 3. Use job tags or custom job handling

                $this->logInfo('Attempting to cancel job for campaign', [
                    'campaign_id' => $campaignId,
                    'job_id' => $campaign->job_id,
                ]);

                // Clear the job ID from the campaign
                try {
                    $campaign->update(['job_id' => null]);
                } catch (\Exception $e) {
                    // If job_id column doesnt exist yet, just log it
                    $this->logWarning('job_id column not available for update', [
                        'campaign_id' => $campaignId,
                        'job_id' => $campaign->job_id,
                    ]);
                }

            } catch (\Exception $e) {
                $this->logError('Failed to cancel specific job', [
                    'campaign_id' => $campaignId,
                    'job_id' => $campaign->job_id,
                    'error' => $e->getMessage(),
                ]);
            }

        } catch (\Exception $e) {
            $this->logError('Failed to cancel campaign jobs', [
                'campaign_id' => $campaignId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Count recipients in uploaded file
     */
    private function countRecipients(string $filePath): int
    {
        try {
            $content = $this->readFile($filePath, ['disk' => 'local']);
            $lines = array_filter(array_map('trim', explode("\n", $content)));

            $count = 0;
            foreach ($lines as $line) {
                if (! empty($line) && $this->validateEmail($line)) {
                    $count++;
                }
            }

            return $count;

        } catch (\Exception $e) {
            $this->logError('Failed to count recipients', [
                'file_path' => $filePath,
                'error' => $e->getMessage(),
            ]);

            return 0;
        }
    }

    /**
     * Validate email format - using ValidationTrait::validateEmail instead
     */
    // validateEmail method removed - using ValidationTrait::validateEmail

    /**
     * Check campaign milestones and send notifications
     */
    private function checkCampaignMilestones(Campaign $campaign): void
    {
        if ($campaign->recipient_count <= 0) {
            return;
        }

        $percentage = intval(($campaign->total_sent / $campaign->recipient_count) * 100);

        // Check for milestone percentages (25%, 50%, 75%, 90%)
        $milestones = [25, 50, 75, 90];

        foreach ($milestones as $milestone) {
            if ($percentage >= $milestone) {
                $cacheKey = "campaign:{$campaign->id}:milestone:{$milestone}";

                // Only send notification once per milestone
                if (! Cache::get($cacheKey)) {
                    $campaign->user->notify(new CampaignMilestone($campaign, $milestone));
                    Cache::put($cacheKey, true, now()->addDays(7)); // Cache for a week

                    $this->logInfo('Campaign milestone reached', [
                        'campaign_id' => $campaign->id,
                        'milestone' => $milestone,
                        'percentage' => $percentage,
                    ]);
                }
            }
        }

        // Check for high bounce rate
        $this->checkBounceRate($campaign);
    }

    /**
     * Check bounce rate and send alert if too high
     */
    private function checkBounceRate(Campaign $campaign): void
    {
        if ($campaign->total_sent <= 0) {
            return;
        }

        $bounceRate = ($campaign->bounces / $campaign->total_sent) * 100;
        $threshold = 10.0; // 10% bounce rate threshold

        if ($bounceRate >= $threshold) {
            $cacheKey = "campaign:{$campaign->id}:bounce_alert";

            // Only send alert once per campaign
            if (! Cache::get($cacheKey)) {
                $campaign->user->notify(new HighBounceRateAlert($campaign, $bounceRate, $threshold));
                Cache::put($cacheKey, true, now()->addDays(1)); // Cache for a day

                $this->logWarning('High bounce rate detected', [
                    'campaign_id' => $campaign->id,
                    'bounce_rate' => $bounceRate,
                    'threshold' => $threshold,
                    'bounces' => $campaign->bounces,
                    'total_sent' => $campaign->total_sent,
                ]);
            }
        }
    }
}
