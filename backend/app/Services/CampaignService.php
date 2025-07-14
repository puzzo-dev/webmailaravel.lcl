<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\Content;
use App\Models\Sender;
use App\Models\User;
use App\Events\CampaignStatusChanged;
use App\Notifications\CampaignStatusChanged as CampaignStatusNotification;
use App\Jobs\ProcessCampaignJob;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\CacheServiceTrait;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\DB;

class CampaignService
{
    use LoggingTrait, ValidationTrait, CacheServiceTrait;

    private FileUploadService $fileUploadService;
    private SuppressionListService $suppressionListService;

    public function __construct(
        FileUploadService $fileUploadService,
        SuppressionListService $suppressionListService
    ) {
        $this->fileUploadService = $fileUploadService;
        $this->suppressionListService = $suppressionListService;
    }

    /**
     * Create a new campaign with sender/content shuffling
     */
    public function createCampaign(array $data, $recipientFile = null): Campaign
    {
        $this->logMethodEntry(__METHOD__, [
            'campaign_name' => $data['name'] ?? 'unknown',
            'has_recipient_file' => $recipientFile !== null
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

            // Upload recipient list if provided using FileUploadService
            $recipientPath = null;
            $recipientData = [];
            if ($recipientFile) {
                $uploadResult = $this->fileUploadService->uploadRecipientList($recipientFile, $data['name']);
                
                if (!$uploadResult['success']) {
                    throw new \Exception($uploadResult['error']);
                }
                
                $recipientPath = $uploadResult['path'];
                $recipientData = $uploadResult['recipient_data'] ?? [];
                
                // Filter out suppressed emails from recipient list
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
                'recipient_count' => $recipientPath ? $this->fileUploadService->countRecipients($recipientPath) : 0,
                'enable_content_switching' => $processedData['enable_content_switching'],
                'template_variables' => $data['template_variables'] ?? null,
                'enable_template_variables' => $data['enable_template_variables'] ?? false,
                'enable_open_tracking' => $data['enable_open_tracking'] ?? true,
                'enable_click_tracking' => $data['enable_click_tracking'] ?? true,
                'enable_unsubscribe_link' => $data['enable_unsubscribe_link'] ?? true,
                'recipient_field_mapping' => $data['recipient_field_mapping'] ?? null,
                'status' => 'DRAFT',
            ]);

            // Store recipient data in Redis for template variable processing
            if (!empty($recipientData)) {
                $this->storeRecipientData($campaign, $recipientData);
            }

            // Store content variations in Redis for content switching
            if ($campaign->enable_content_switching && !empty($processedData['content_ids'])) {
                $this->storeContentVariations($campaign, $processedData['content_variations']);
            }

            // Store sender list in Redis for sender shuffling
            $this->storeSenderList($campaign, $userSenders);

            DB::commit();

            $this->logInfo('Campaign created', [
                'campaign_id' => $campaign->id, 
                'user_id' => auth()->id(),
                'sender_count' => $userSenders->count(),
                'content_count' => count($processedData['content_ids']),
                'enable_content_switching' => $campaign->enable_content_switching
            ]);

            $this->logMethodExit(__METHOD__, ['campaign_id' => $campaign->id]);
            return $campaign;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->logError('Campaign creation failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
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
            $originalContent = Storage::disk('local')->get($originalPath);
            $emails = array_filter(array_map('trim', explode("\n", $originalContent)));
            
            $filteredEmails = [];
            $suppressedCount = 0;
            
            foreach ($emails as $email) {
                if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    if ($this->suppressionListService->shouldSuppressEmail($email)) {
                        $suppressedCount++;
                        continue;
                    }
                    $filteredEmails[] = $email;
                }
            }
            
            // Create filtered file
            $filteredContent = implode("\n", $filteredEmails);
            $filteredPath = 'recipient_lists/filtered_' . $campaignName . '_' . time() . '.txt';
            
            Storage::disk('local')->put($filteredPath, $filteredContent);
            
            $this->logInfo('Recipient list filtered', [
                'original_count' => count($emails),
                'filtered_count' => count($filteredEmails),
                'suppressed_count' => $suppressedCount,
                'original_path' => $originalPath,
                'filtered_path' => $filteredPath
            ]);
            
            return $filteredPath;
            
        } catch (\Exception $e) {
            $this->logError('Failed to filter suppressed emails', [
                'original_path' => $originalPath,
                'error' => $e->getMessage()
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
        $requiredFields = ['name', 'subject'];
        $validation = $this->validateRequiredFields($data, $requiredFields);
        
        if (!$validation['is_valid']) {
            throw new \Exception(implode(', ', $validation['errors']));
        }

        // Validate content variations if content switching is enabled
        if (!empty($data['enable_content_switching']) && empty($data['content_variations'])) {
            throw new \Exception('Content variations are required when content switching is enabled');
        }

        if (!empty($data['content_variations'])) {
            foreach ($data['content_variations'] as $contentId) {
                $content = Content::where('id', $contentId)
                    ->where('user_id', auth()->id())
                    ->where('is_active', true)
                    ->first();
                
                if (!$content) {
                    throw new \Exception("Invalid content ID: {$contentId}");
                }
            }
        }
    }

    /**
     * Check user's campaign limits
     */
    private function checkUserCampaignLimits(int $userId): void
    {
        $activeCampaigns = Campaign::where('user_id', $userId)
            ->whereIn('status', ['DRAFT', 'RUNNING', 'PAUSED'])
            ->count();

        // Get user's subscription limits
        $user = User::find($userId);
        $subscription = $user->subscriptions()->where('status', 'active')->first();
        
        $maxCampaigns = $subscription ? $subscription->plan->max_campaigns : 1;
        
        if ($activeCampaigns >= $maxCampaigns) {
            throw new \Exception('Campaign limit reached for your current plan');
        }
    }

    /**
     * Process content variations for content switching
     */
    private function processContentVariations(array $data, $userContents): array
    {
        $processedData = $data;

        if (!empty($data['enable_content_switching']) && !empty($data['content_variations'])) {
            // Use the first variation as the main content/subject
            $firstContent = Content::find($data['content_variations'][0]);
            $processedData['subject'] = $firstContent->subject ?? $data['subject'];
            $processedData['content_ids'] = $data['content_variations'];
            $processedData['content_variations'] = $userContents->whereIn('id', $data['content_variations'])->toArray();
            $processedData['enable_content_switching'] = true;
        } else {
            // Disable content switching if no variations provided
            $processedData['enable_content_switching'] = false;
            $processedData['content_ids'] = !empty($data['content_id']) ? [$data['content_id']] : [];
            $processedData['content_variations'] = [];
        }

        return $processedData;
    }

    /**
     * Store content variations in Redis for content switching
     */
    private function storeContentVariations(Campaign $campaign, array $contentVariations): void
    {
        $variations = [];
        foreach ($contentVariations as $content) {
            $variations[] = [
                'id' => $content['id'],
                'subject' => $content['subject'],
                'html_body' => $content['html_body'],
                'text_body' => $content['text_body'],
            ];
        }

        $cacheKey = "campaign:{$campaign->id}:content_variations";
        $this->cache($cacheKey, json_encode($variations), 3600); // 1 hour TTL
    }

    /**
     * Store recipient data in Redis for template variable processing
     */
    private function storeRecipientData(Campaign $campaign, array $recipientData): void
    {
        $cacheKey = "campaign:{$campaign->id}:recipient_data";
        $this->cache($cacheKey, json_encode($recipientData), 3600); // 1 hour TTL
        
        $this->logInfo('Recipient data stored for template variables', [
            'campaign_id' => $campaign->id,
            'recipient_count' => count($recipientData)
        ]);
    }

    /**
     * Store sender list in Redis for sender shuffling
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
        $this->cache($cacheKey, json_encode($senderList), 3600); // 1 hour TTL
    }

    /**
     * Get recipient data for template variable processing
     */
    public function getRecipientData(int $campaignId, string $email): array
    {
        $cacheKey = "campaign:{$campaignId}:recipient_data";
        $recipientData = $this->cache($cacheKey);
        
        if ($recipientData) {
            $data = json_decode($recipientData, true);
            return $data[strtolower($email)] ?? [];
        }
        
        return [];
    }

    /**
     * Start campaign
     */
    public function startCampaign(Campaign $campaign): void
    {
        $this->logMethodEntry(__METHOD__, ['campaign_id' => $campaign->id]);

        try {
            // Validate campaign can be started
            if ($campaign->status !== 'DRAFT') {
                throw new \Exception('Campaign can only be started from DRAFT status');
            }

            // Check if recipient list exists
            if (!$campaign->recipient_list_path || !Storage::disk('local')->exists($campaign->recipient_list_path)) {
                throw new \Exception('Recipient list not found');
            }

            // Update campaign status
            $campaign->update([
                'status' => 'RUNNING',
                'started_at' => now()
            ]);

            // Dispatch campaign processing job
            ProcessCampaignJob::dispatch($campaign);

            // Broadcast status change
            event(new CampaignStatusChanged($campaign));

            // Send notification
            $campaign->user->notify(new CampaignStatusNotification($campaign));

            $this->logInfo('Campaign started', [
                'campaign_id' => $campaign->id,
                'user_id' => $campaign->user_id,
                'recipient_count' => $campaign->recipient_count
            ]);

            $this->logMethodExit(__METHOD__, ['success' => true]);

        } catch (\Exception $e) {
            $this->logError('Campaign start failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Update campaign status
     */
    public function updateCampaignStatus(Campaign $campaign, string $status): void
    {
        $this->logMethodEntry(__METHOD__, [
            'campaign_id' => $campaign->id,
            'new_status' => $status
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
            'new_status' => $status
        ]);

        $this->logMethodExit(__METHOD__, ['success' => true]);
    }

    /**
     * Get next sender for shuffling
     */
    public function getNextSender(int $campaignId, int $index): ?array
    {
        $cacheKey = "campaign:{$campaignId}:senders";
        $senderList = $this->getCache($cacheKey);
        
        if (!$senderList) {
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
        $contentList = $this->getCache($cacheKey);
        
        if (!$contentList) {
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
        $sentListPath = $this->fileUploadService->createSentList($campaign->name, [$recipient]);
        
        // Update campaign with sent list path if not already set
        if (!$campaign->sent_list_path) {
            $campaign->update(['sent_list_path' => $sentListPath]);
        }
    }
} 