<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CampaignController extends BaseController
{
    public function __construct(
        private CampaignService $campaignService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return $this->executeControllerMethod(function () {
            $query = Campaign::where('user_id', Auth::id())
                ->with(['contents', 'sender'])
                ->orderBy('created_at', 'desc');

            return $this->getPaginatedResults($query, request(), 'campaigns', ['contents', 'sender']);
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
                'subject' => 'required|string|max:255',
                'content' => 'required|string',
                'sender_id' => 'required|exists:senders,id',
                'recipient_list' => 'required|file|mimes:txt,csv,xls,xlsx|max:10240',
                'scheduled_at' => 'nullable|date|after:now',
                'content_variations' => 'nullable|array',
                'content_variations.*.subject' => 'required_with:content_variations|string|max:255',
                'content_variations.*.content' => 'required_with:content_variations|string',
                'template_variables' => 'nullable|array',
                'enable_template_variables' => 'nullable|boolean',
                'enable_open_tracking' => 'nullable|boolean',
                'enable_click_tracking' => 'nullable|boolean',
                'enable_unsubscribe_link' => 'nullable|boolean',
                'recipient_field_mapping' => 'nullable|array',
                'recipient_field_mapping.*' => 'string',
            ],
            function () use ($request) {
                $data = $request->input('validated_data');
                $data['user_id'] = Auth::id();

                $campaign = $this->campaignService->createCampaign($data, $request->file('recipient_list'));
                
                // Process webhook
                $webhookResult = $this->processCampaignWebhook($campaign, 'created');
                if (!$webhookResult['success']) {
                    $this->logError('Campaign webhook failed', [
                        'campaign_id' => $campaign->id,
                        'error' => $webhookResult['error']
                    ]);
                }

                return $this->createdResponse($campaign->load(['contents', 'sender']), 'Campaign created successfully');
            },
            'create_campaign'
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(Campaign $campaign): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($campaign),
            fn() => $this->getResource($campaign->load(['contents', 'sender', 'user']), 'campaign', $campaign->id),
            'view_campaign'
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(Request $request, Campaign $campaign): JsonResponse
    {
        return $this->validateAuthorizeAndExecute(
            $request,
            [
                'name' => 'sometimes|string|max:255',
                'subject' => 'sometimes|string|max:255',
                'content' => 'sometimes|string',
                'sender_id' => 'sometimes|exists:senders,id',
                'scheduled_at' => 'nullable|date|after:now',
                'content_variations' => 'nullable|array',
                'content_variations.*.subject' => 'required_with:content_variations|string|max:255',
                'content_variations.*.content' => 'required_with:content_variations|string',
            ],
            fn() => $this->authorizeResourceAccess($campaign),
            function () use ($request, $campaign) {
                $campaign->update($request->input('validated_data'));
                return $this->updateResponse($campaign->load(['contents', 'sender']), 'Campaign updated successfully');
            },
            'update_campaign'
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(Campaign $campaign): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($campaign),
            function () use ($campaign) {
                $campaign->delete();
                return $this->deleteResponse('Campaign deleted successfully');
            },
            'delete_campaign'
        );
    }

    /**
     * Get campaign statistics
     */
    public function statistics(Campaign $campaign): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($campaign),
            function () use ($campaign) {
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
            },
            'view_campaign_statistics'
        );
    }

    /**
     * Start campaign
     */
    public function startCampaign(Campaign $campaign): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($campaign),
            function () use ($campaign) {
                $result = $this->campaignService->startCampaign($campaign);
                
                if ($result['success']) {
                    return $this->actionResponse($campaign, 'Campaign started successfully');
                }
                
                return $this->errorResponse('Failed to start campaign', $result['error']);
            },
            'start_campaign'
        );
    }

    /**
     * Pause campaign
     */
    public function pauseCampaign(Campaign $campaign): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($campaign),
            function () use ($campaign) {
                $result = $this->campaignService->pauseCampaign($campaign);
                
                if ($result['success']) {
                    return $this->actionResponse($campaign, 'Campaign paused successfully');
                }
                
                return $this->errorResponse('Failed to pause campaign', $result['error']);
            },
            'pause_campaign'
        );
    }

    /**
     * Resume campaign
     */
    public function resumeCampaign(Campaign $campaign): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($campaign),
            function () use ($campaign) {
                $result = $this->campaignService->resumeCampaign($campaign);
                
                if ($result['success']) {
                    return $this->actionResponse($campaign, 'Campaign resumed successfully');
                }
                
                return $this->errorResponse('Failed to resume campaign', $result['error']);
            },
            'resume_campaign'
        );
    }

    /**
     * Stop campaign
     */
    public function stopCampaign(Campaign $campaign): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($campaign),
            function () use ($campaign) {
                $result = $this->campaignService->stopCampaign($campaign);
                
                if ($result['success']) {
                    return $this->actionResponse($campaign, 'Campaign stopped successfully');
                }
                
                return $this->errorResponse('Failed to stop campaign', $result['error']);
            },
            'stop_campaign'
        );
    }

    /**
     * Get campaign tracking statistics
     */
    public function trackingStats(Campaign $campaign): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($campaign),
            function () use ($campaign) {
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
            },
            'view_campaign_tracking_stats'
        );
    }

    /**
     * Get available template variables
     */
    public function getTemplateVariables(): JsonResponse
    {
        return $this->executeControllerMethod(function () {
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
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($campaign),
            function () use ($campaign) {
                $variables = $campaign->getAvailableTemplateVariables();
                return $this->successResponse($variables, 'Campaign template variables retrieved successfully');
            },
            'get_campaign_template_variables'
        );
    }

    /**
     * Download unsubscribe list
     */
    public function downloadUnsubscribeList(Request $request, Campaign $campaign, string $format = null): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($campaign),
            function () use ($request, $campaign, $format) {
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
            },
            'download_unsubscribe_list'
        );
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

            // Send to Telegram if configured
            $telegramService = app(\App\Services\TelegramService::class);
            $telegramService->sendNotificationToAdmin("Campaign {$action}: {$campaign->name}");

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
}