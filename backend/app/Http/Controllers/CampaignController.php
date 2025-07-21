<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Services\CampaignService;
use App\Traits\LoggingTrait;
use App\Traits\ResponseTrait;
use App\Traits\ValidationTrait;
use App\Traits\FileProcessingTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CampaignController extends Controller
{
    use ResponseTrait,
        LoggingTrait,
        ValidationTrait,
        FileProcessingTrait;

    public function __construct(
        private CampaignService $campaignService
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
                    return $campaign;
                });
                
                return $this->paginatedResponse($results, 'Campaigns retrieved successfully');
            }
        }, 'list_campaigns');
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
                return $this->errorResponse('Campaign not found', null, 404);
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
                return $this->errorResponse('Campaign not found', null, 404);
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
                return $this->errorResponse('Campaign not found', null, 404);
            }
            
            if (!$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $result = $this->campaignService->deleteCampaign($campaign);
            
            if ($result['success']) {
                return $this->successResponse(null, 'Campaign deleted successfully');
            }
            
            return $this->errorResponse('Failed to delete campaign', $result['error']);
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
            if (!$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $result = $this->campaignService->startCampaign($campaign);
            
            if ($result['success']) {
                return $this->successResponse($campaign, 'Campaign started successfully');
            }
            
            return $this->errorResponse('Failed to start campaign', $result['error']);
        }, 'start_campaign');
    }

    /**
     * Pause campaign
     */
    public function pauseCampaign(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            if (!$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $result = $this->campaignService->pauseCampaign($campaign);
            
            if ($result['success']) {
                return $this->successResponse($result['campaign'], 'Campaign paused successfully');
            }
            
            return $this->errorResponse('Failed to pause campaign', $result['error']);
        }, 'pause_campaign');
    }

    /**
     * Resume campaign
     */
    public function resumeCampaign(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            if (!$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $result = $this->campaignService->resumeCampaign($campaign);
            
            if ($result['success']) {
                return $this->successResponse($result['campaign'], 'Campaign resumed successfully');
            }
            
            return $this->errorResponse('Failed to resume campaign', $result['error']);
        }, 'resume_campaign');
    }

    /**
     * Stop campaign
     */
    public function stopCampaign(Campaign $campaign): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($campaign) {
            if (!$this->canAccessResource($campaign)) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $result = $this->campaignService->stopCampaign($campaign);
            
            if ($result['success']) {
                return $this->successResponse($result['campaign'], 'Campaign stopped successfully');
            }
            
            return $this->errorResponse('Failed to stop campaign', $result['error']);
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
                return $this->errorResponse('Failed to export unsubscribe list', $result['error']);
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

            // Send to Telegram if configured (using Http facade directly)
            $this->sendTelegramNotification("Campaign {$action}: {$campaign->name}");

            return ['success' => true];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
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
}