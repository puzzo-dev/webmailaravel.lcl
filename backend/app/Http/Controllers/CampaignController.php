<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\Sender;
use App\Models\User;
use App\Services\CampaignService;
use App\Services\UnifiedEmailSendingService;
use App\Services\NotificationService;
use App\Traits\LoggingTrait;
use App\Traits\ResponseTrait;
use App\Traits\ValidationTrait;
use App\Traits\FileProcessingTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CampaignController extends Controller
{
    use ResponseTrait,
        LoggingTrait,
        ValidationTrait,
        FileProcessingTrait;

    public function __construct(
        private CampaignService $campaignService,
        private UnifiedEmailSendingService $emailSendingService,
        private NotificationService $notificationService
    ) {}

    /**
     * Display a listing of the resource
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $perPage = $request->input('per_page', 15);
            $page = $request->input('page', 1);
            
            // Check if user is admin
            if (Auth::user()->hasRole('admin')) {
                // Admin sees all campaigns
                $query = Campaign::with(['user']);
                $results = $query->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);
                
                // Load related data for each campaign
                $results->getCollection()->transform(function ($campaign) {
                    $campaign->senders = $campaign->getSenders();
                    $campaign->contents = $campaign->getContentVariations();
                    
                    // Calculate progress based on campaign status and stats
                    $campaign->progress = $this->calculateCampaignProgress($campaign);
                    
                    return $campaign;
                });
                
                return $this->paginatedResponse($results, 'All campaigns retrieved successfully');
            } else {
                // Regular users see only their campaigns
                $query = Campaign::query()->where('user_id', Auth::id());
                $results = $query->paginate($perPage, ['*'], 'page', $page);
                
                // Load related data for each campaign  
                $results->getCollection()->transform(function ($campaign) {
                    $campaign->senders = $campaign->getSenders();
                    $campaign->contents = $campaign->getContentVariations();
                    
                    // Calculate progress based on campaign status and stats
                    $campaign->progress = $this->calculateCampaignProgress($campaign);
                    
                    return $campaign;
                });
                
                return $this->paginatedResponse($results, 'Campaigns retrieved successfully');
            }
        }, 'list_campaigns');
    }

    /**
     * Send single email - direct dispatch without queue
     */
    public function sendSingle(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'to' => 'required|email',
                'bcc' => 'nullable|string',
                'sender_id' => 'required|exists:senders,id',
                'subject' => 'required|string|max:255',
                'content' => 'required|string',
                'attachments' => 'nullable|array',
                'attachments.*' => 'file|max:10240|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif,zip',
                'enable_open_tracking' => 'boolean',
                'enable_click_tracking' => 'boolean',
                'enable_unsubscribe_link' => 'boolean',
            ],
            function () use ($request) {
                $data = $request->input('validated_data');
                
                // Handle file attachments using unified method
                $attachmentPaths = [];
                if ($request->hasFile('attachments')) {
                    foreach ($request->file('attachments') as $file) {
                        $uploadResult = $this->uploadFile($file, 'attachments', [
                            'allowed_extensions' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip'],
                            'max_size' => 10240, // 10MB
                            'generate_unique_name' => true,
                            'preserve_original_name' => false
                        ]);
                        
                        if ($uploadResult['success']) {
                            $attachmentPaths[] = [
                                'path' => $uploadResult['path'],
                                'original_name' => $file->getClientOriginalName(),
                                'name' => $uploadResult['filename'],
                                'size' => $uploadResult['size'],
                                'mime_type' => $uploadResult['mime_type'],
                                'checksum' => hash_file('md5', storage_path('app/' . $uploadResult['path']))
                            ];
                        } else {
                            throw new \Exception('Failed to upload attachment: ' . $uploadResult['error']);
                        }
                    }
                }
                $data['attachments'] = $attachmentPaths;
                
                // Send email directly without queue for immediate dispatch
                $result = $this->campaignService->sendSingleEmailDirect($data);
                
                if (!$result['success']) {
                    return $this->errorResponse($result['error'], 400);
                }

                return $this->successResponse([
                    'campaign' => $result['campaign'],
                    'message' => $result['message']
                ], 'Single email sent successfully');
            },
            'send_single_email'
        );
    }

    /**
     * Download campaign attachment
     */
    public function downloadAttachment(Request $request, $campaignId, $attachmentIndex)
    {
        $campaign = Campaign::findOrFail($campaignId);
        
        // Check authorization
        if (!$this->canAccessResource($campaign)) {
            abort(403, 'Unauthorized access to campaign attachments');
        }
        
        // Get attachments
        $attachments = $campaign->attachments ?: [];
        
        if (!isset($attachments[$attachmentIndex])) {
            abort(404, 'Attachment not found');
        }
        
        $attachment = $attachments[$attachmentIndex];
        $filePath = storage_path('app/' . $attachment['path']);
        
        if (!file_exists($filePath)) {
            abort(404, 'Attachment file not found on disk');
        }
        
        // Verify file integrity if checksum is available
        if (isset($attachment['checksum'])) {
            $currentChecksum = hash_file('md5', $filePath);
            if ($currentChecksum !== $attachment['checksum']) {
                Log::error('Attachment file corruption detected', [
                    'campaign_id' => $campaignId,
                    'attachment_index' => $attachmentIndex,
                    'expected_checksum' => $attachment['checksum'],
                    'actual_checksum' => $currentChecksum,
                    'file_path' => $filePath
                ]);
                abort(422, 'Attachment file appears to be corrupted');
            }
        }
        
        // Use original_name if available, fallback to name
        $downloadName = $attachment['original_name'] ?? $attachment['name'];
        
        // Get the file's MIME type
        $mimeType = $attachment['mime_type'] ?? mime_content_type($filePath) ?? 'application/octet-stream';
        
        // Use streaming for large files to prevent memory issues
        if (filesize($filePath) > (5 * 1024 * 1024)) { // 5MB threshold
            return $this->streamFile($filePath, $downloadName);
        }
        
        return response()->download($filePath, $downloadName, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="' . $downloadName . '"',
        ]);
    }

    /**
     * Store a newly created resource.
     */
    public function store(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'name' => 'required|string|max:255',
                'subject' => 'nullable|string|max:255',
                'content' => 'nullable|string',
                'recipient_file' => 'required|file|mimes:txt,csv,xls,xlsx|max:10240',
                'attachments' => 'nullable|array',
                'attachments.*' => 'file|max:10240|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif,zip',
                'enable_content_switching' => 'nullable|string',
                'content_variations' => 'nullable|string',
                'template_variables' => 'nullable|string',
                'enable_template_variables' => 'nullable|string',
                'enable_open_tracking' => 'nullable|string',
                'enable_click_tracking' => 'nullable|string',
                'enable_unsubscribe_link' => 'nullable|string',
                'recipient_field_mapping' => 'nullable|array',
                'recipient_field_mapping.*' => 'string',
            ],
            function () use ($request) {
                $data = $request->input('validated_data');
                $data['user_id'] = Auth::id();



                // Convert string boolean values to actual booleans
                $booleanFields = [
                    'enable_content_switching',
                    'enable_template_variables', 
                    'enable_open_tracking',
                    'enable_click_tracking',
                    'enable_unsubscribe_link'
                ];

                foreach ($booleanFields as $field) {
                    if (isset($data[$field])) {
                        $data[$field] = in_array($data[$field], ['1', 'true', true], true);
                    }
                }

                // Parse template_variables if it's a JSON string
                if (isset($data['template_variables']) && is_string($data['template_variables'])) {
                    $data['template_variables'] = json_decode($data['template_variables'], true);
                }

                // Parse content_variations if it's a JSON string
                if (isset($data['content_variations']) && is_string($data['content_variations'])) {
                    $data['content_variations'] = json_decode($data['content_variations'], true);
                }

                // Handle file attachments for full campaigns using FileProcessingTrait
                $attachmentPaths = [];
                if ($request->hasFile('attachments')) {
                    foreach ($request->file('attachments') as $file) {
                        $uploadResult = $this->uploadFile($file, 'attachments', [
                            'allowed_extensions' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip'],
                            'max_size' => 10240, // 10MB
                            'generate_unique_name' => true,
                            'preserve_original_name' => false
                        ]);
                        
                        if ($uploadResult['success']) {
                            $attachmentPaths[] = [
                                'path' => $uploadResult['path'],
                                'original_name' => $file->getClientOriginalName(),
                                'name' => $uploadResult['filename'],
                                'size' => $uploadResult['size'],
                                'mime_type' => $uploadResult['mime_type'],
                                'checksum' => hash_file('md5', storage_path('app/' . $uploadResult['path']))
                            ];
                        } else {
                            throw new \Exception('Failed to upload attachment: ' . $uploadResult['error']);
                        }
                    }
                }
                $data['attachments'] = $attachmentPaths;

                $campaign = $this->campaignService->createCampaign($data, $request->file('recipient_file'));
                
                // Process webhook
                $webhookResult = $this->processCampaignWebhook($campaign, 'created');
                if (!$webhookResult['success']) {
                    $this->logError('Campaign webhook failed', [
                        'campaign_id' => $campaign->id,
                        'error' => $webhookResult['error']
                    ]);
                }

                // Load related data manually
                $campaign->senders = $campaign->getSenders();
                $campaign->contents = $campaign->getContentVariations();
                
                return $this->createdResponse($campaign, 'Campaign created successfully');
            },
            'create_campaign'
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            try {
                $campaign = Campaign::with(['user'])->findOrFail($id);
            } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
                return $this->errorResponse('Campaign not found', 404);
            }
            
            if (!$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            // Load related data manually since we're using JSON arrays
            $campaign->senders = $campaign->getSenders();
            $campaign->contents = $campaign->getContentVariations();
            
            return $this->successResponse($campaign, 'Campaign retrieved successfully');
        }, 'view_campaign');
    }

    /**
     * Update the specified resource.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            try {
                $campaign = Campaign::findOrFail($id);
            } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
                return $this->errorResponse('Campaign not found', 404);
            }
            
            // Admin can update any campaign, regular users can only update their own
            if (!Auth::user()->hasRole('admin') && !$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'subject' => 'sometimes|string|max:255',
                'content' => 'sometimes|string',
                'sender_id' => 'sometimes|exists:senders,id',
                'scheduled_at' => 'nullable|date|after:now',
                'content_variations' => 'nullable|array',
                'content_variations.*.subject' => 'required_with:content_variations|string|max:255',
                'content_variations.*.content' => 'required_with:content_variations|string',
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $campaign->update($validator->validated());
            
            // Load related data manually
            $campaign->senders = $campaign->getSenders();
            $campaign->contents = $campaign->getContentVariations();
            
            return $this->successResponse($campaign, 'Campaign updated successfully');
        }, 'update_campaign');
    }

    /**
     * Update campaign status (admin functionality)
     */
    public function updateCampaign(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }
            
            $campaign = Campaign::findOrFail($id);
            $oldStatus = $campaign->status;
            
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'subject' => 'sometimes|string|max:255',
                'content' => 'sometimes|string',
                'sender_id' => 'sometimes|exists:senders,id',
                'status' => 'sometimes|string|in:draft,scheduled,sending,paused,completed,failed',
                'scheduled_at' => 'nullable|date|after:now',
                'content_variations' => 'nullable|array',
                'content_variations.*.subject' => 'required_with:content_variations|string|max:255',
                'content_variations.*.content' => 'required_with:content_variations|string',
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $campaign->update($validator->validated());
            
            // Send notification if status changed
            if ($request->has('status') && $oldStatus !== $campaign->status) {
                $this->notificationService->sendCampaignStatusNotification($campaign, $oldStatus, $campaign->status);
            }
            
            // Load related data manually
            $campaign->senders = $campaign->getSenders();
            $campaign->contents = $campaign->getContentVariations();
            
            return $this->successResponse($campaign, 'Campaign updated successfully');
        }, 'update_campaign');
    }

    /**
     * Update multiple campaigns with common data (admin functionality)
     */
    public function updateCampaigns(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }
            
            $validator = Validator::make($request->all(), [
                'campaign_ids' => 'required|array',
                'campaign_ids.*' => 'exists:campaigns,id',
                'status' => 'sometimes|string|in:draft,scheduled,sending,paused,completed,failed',
                'scheduled_at' => 'nullable|date|after:now',
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $campaignIds = $request->input('campaign_ids');
            $updateData = $request->only(['status', 'scheduled_at']);      
            $updatedCount = Campaign::whereIn('id', $campaignIds)->update($updateData);
            
            return $this->successResponse([
                'updated_count' => $updatedCount,
                'campaign_ids' => $campaignIds
            ], "Successfully updated {$updatedCount} campaigns");
        }, 'update_campaigns');
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            try {
                $campaign = Campaign::findOrFail($id);
            } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
                return $this->errorResponse('Campaign not found', 404);
            }
            
            // Admin can delete any campaign, regular users can only delete their own
            if (!Auth::user()->hasRole('admin') && !$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $result = $this->campaignService->deleteCampaign($campaign);
            
            if ($result['success']) {
                return $this->successResponse(null, 'Campaign deleted successfully');
            }
            
            return $this->errorResponse('Failed to delete campaign: ' . $result['error'], 400);
        }, 'delete_campaign');
    }

    /**
     * Get campaign statistics
     */
    public function getCampaignStatistics(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            if (!$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $stats = [
                'total_sent' => $campaign->total_sent,
                'total_failed' => $campaign->total_failed,
                'opens' => $campaign->opens,
                'clicks' => $campaign->clicks,
                'bounces' => $campaign->bounces,
                'complaints' => $campaign->complaints,
                'open_rate' => $campaign->open_rate,
                'click_rate' => $campaign->click_rate,
                'bounce_rate' => $campaign->bounce_rate,
                'complaint_rate' => $campaign->complaint_rate,
                'geo_distribution' => $this->getGeoDistribution($campaign),
                'device_distribution' => $this->getDeviceDistribution($campaign),
                'hourly_activity' => $this->getHourlyActivity($campaign)
            ];

            return $this->successResponse($stats, 'Campaign statistics retrieved successfully');
        }, 'view_campaign_statistics');
    }

    /**
     * Start campaign
     */
    public function startCampaign(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            // Admin can start any campaign, regular users can only start their own
            if (!Auth::user()->hasRole('admin') && !$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $result = $this->campaignService->startCampaign($campaign);
            
            if ($result['success']) {
                return $this->successResponse($campaign, 'Campaign started successfully');
            }
            
            return $this->errorResponse('Failed to start campaign: ' . $result['error'], 400);
        }, 'start_campaign');
    }

    /**
     * Pause campaign
     */
    public function pauseCampaign(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            // Admin can pause any campaign, regular users can only pause their own
            if (!Auth::user()->hasRole('admin') && !$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $result = $this->campaignService->pauseCampaign($campaign);
            
            if ($result['success']) {
                return $this->successResponse($result['campaign'], 'Campaign paused successfully');
            }
            
            return $this->errorResponse('Failed to pause campaign: ' . $result['error'], 400);
        }, 'pause_campaign');
    }

    /**
     * Resume campaign
     */
    public function resumeCampaign(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            // Admin can resume any campaign, regular users can only resume their own
            if (!Auth::user()->hasRole('admin') && !$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $result = $this->campaignService->resumeCampaign($campaign);
            
            if ($result['success']) {
                return $this->successResponse($result['campaign'], 'Campaign resumed successfully');
            }
            
            return $this->errorResponse('Failed to resume campaign: ' . $result['error'], 400);
        }, 'resume_campaign');
    }

    /**
     * Stop campaign
     */
    public function stopCampaign(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            // Admin can stop any campaign, regular users can only stop their own
            if (!Auth::user()->hasRole('admin') && !$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $result = $this->campaignService->stopCampaign($campaign);
            
            if ($result['success']) {
                return $this->successResponse($result['campaign'], 'Campaign stopped successfully');
            }
            
            return $this->errorResponse('Failed to stop campaign: ' . $result['error'], 400);
        }, 'stop_campaign');
    }

    /**
     * Duplicate campaign
     */
    public function duplicateCampaign(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            if (!$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $duplicatedCampaign = $this->campaignService->duplicateCampaign($campaign);
            
            // Load related data manually for the response
            $duplicatedCampaign->senders = $duplicatedCampaign->getSenders();
            $duplicatedCampaign->contents = $duplicatedCampaign->getContentVariations();
            
            return $this->successResponse($duplicatedCampaign, 'Campaign duplicated successfully');
        }, 'duplicate_campaign');
    }

    /**
     * Get campaign tracking statistics
     */
    public function trackingStats(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            if (!$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $stats = [
                'opens' => $campaign->opens,
                'clicks' => $campaign->clicks,
                'open_rate' => $campaign->open_rate,
                'click_rate' => $campaign->click_rate,
                'unique_opens' => $campaign->unique_opens ?? 0,
                'unique_clicks' => $campaign->unique_clicks ?? 0,
                'total_recipients' => $campaign->recipient_count,
                'total_sent' => $campaign->total_sent
            ];

            return $this->successResponse($stats, 'Campaign tracking statistics retrieved successfully');
        }, 'view_campaign_tracking_stats');
    }

    /**
     * Get available template variables
     */
    public function getTemplateVariables(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            $variables = [
                'username' => 'User\'s username',
                'email' => 'User\'s email address',
                'firstname' => 'User\'s first name',
                'lastname' => 'User\'s last name',
                'unsubscribelink' => 'Unsubscribe link URL',
                'campaign_name' => 'Campaign name',
                'sender_name' => 'Sender name',
                'sender_email' => 'Sender email'
            ];

            return $this->successResponse($variables, 'Template variables retrieved successfully');
        }, 'get_template_variables');
    }

    /**
     * Get campaign template variables
     */
    public function getCampaignTemplateVariables(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            if (!$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $variables = $campaign->getAvailableTemplateVariables();
            return $this->successResponse($variables, 'Campaign template variables retrieved successfully');
        }, 'get_campaign_template_variables');
    }

    /**
     * Download unsubscribe list
     */
    public function downloadUnsubscribeList(Request $request, Campaign $campaign, string $format = null): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $campaign, $format) {
            if (!$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $format = $format ?: $request->input('format', 'txt');
            
            if (!in_array($format, ['txt', 'csv', 'xls', 'xlsx'])) {
                return $this->validationErrorResponse(['format' => ['Invalid format specified']]);
            }

            $unsubscribeService = app(\App\Services\UnsubscribeExportService::class);
            $result = $unsubscribeService->exportUnsubscribeList($campaign->id, $format);

            if (!$result['success']) {
                return $this->errorResponse('Failed to export unsubscribe list: ' . $result['error'], 400);
            }

            $filename = "unsubscribe_list_{$campaign->id}.{$format}";
            $contentType = $this->getContentType($format);

            return response()->download($result['file_path'], $filename, [
                'Content-Type' => $contentType
            ]);
        }, 'download_unsubscribe_list');
    }

    /**
     * Process campaign webhook
     */
    private function processCampaignWebhook(Campaign $campaign, string $action): array
    {
        try {
            $webhookData = [
                'campaign_id' => $campaign->id,
                'action' => $action,
                'timestamp' => now()->toISOString(),
                'user_id' => $campaign->user_id,
                'campaign_name' => $campaign->name
            ];
            
            return ['success' => true, 'data' => $webhookData];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get content type for file format
     */
    private function getContentType(string $format): string
    {
        return match ($format) {
            'txt' => 'text/plain',
            'csv' => 'text/csv',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            default => 'text/plain'
        };
    }

    /**
     * Get geographic distribution
     */
    private function getGeoDistribution(Campaign $campaign): array
    {
        // Implementation for geographic distribution
        return [];
    }

    /**
     * Get device distribution
     */
    private function getDeviceDistribution(Campaign $campaign): array
    {
        // Implementation for device distribution
        return [];
    }

    /**
     * Get hourly activity
     */
    private function getHourlyActivity(Campaign $campaign): array
    {
        // Implementation for hourly activity
        return [];
    }

    /**
     * Check if email is in suppression list
     */
    private function isEmailSuppressed(string $email): bool
    {
        return \App\Models\SuppressionList::where('email', $email)->exists();
    }

    /**
     * Send Telegram notification using Http facade directly
     */
    private function sendTelegramNotification(string $message): void
    {
        try {
            $botToken = config('services.telegram.bot_token');
            $chatId = config('services.telegram.admin_chat_id');
            
            if (!$botToken || !$chatId) {
                return; // Skip if not configured
            }

            \Illuminate\Support\Facades\Http::post("https://api.telegram.org/bot{$botToken}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML'
            ]);
            
        } catch (\Exception $e) {
            // Log error but don't fail the main operation
            $this->logError('Telegram notification failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Calculate campaign progress based on status and statistics
     */
    private function calculateCampaignProgress($campaign): int
    {
        // If campaign is draft or scheduled, progress is 0%
        if (in_array($campaign->status, ['draft', 'scheduled'])) {
            return 0;
        }
        
        // If campaign is completed, progress is 100%
        if ($campaign->status === 'completed') {
            return 100;
        }
        
        // If campaign failed, progress is based on what was sent before failure
        if ($campaign->status === 'failed') {
            if ($campaign->recipient_count > 0 && $campaign->total_sent > 0) {
                return min(100, round(($campaign->total_sent / $campaign->recipient_count) * 100));
            }
            return 0;
        }
        
        // For sending/paused campaigns, calculate based on sent vs total recipients
        if (in_array($campaign->status, ['sending', 'paused'])) {
            if ($campaign->recipient_count > 0 && $campaign->total_sent > 0) {
                return min(100, round(($campaign->total_sent / $campaign->recipient_count) * 100));
            }
            // If no recipient count but has total_sent, assume some progress
            if ($campaign->total_sent > 0) {
                return 50; // Assume 50% progress if we can't calculate exactly
            }
            return 10; // Campaign started but minimal progress
        }
        
        // Default fallback
        return 0;
    }
}