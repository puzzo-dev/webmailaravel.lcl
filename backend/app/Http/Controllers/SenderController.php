<?php

namespace App\Http\Controllers;

use App\Models\Sender;
use App\Services\CampaignService;
use App\Services\SenderService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SenderController extends Controller
{
    public function __construct(
        private CampaignService $campaignService,
        private SenderService $senderService
    ) {}

    /**
     * Display a listing of the resource
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $perPage = min((int) $request->input('per_page', 15), 100);
            $page = $request->input('page', 1);

            if (Auth::user()->hasRole('admin')) {
                $query = Sender::with(['smtpConfig', 'user']);
            } else {
                $query = Sender::with(['smtpConfig'])
                    ->where('user_id', Auth::id());
            }

            $results = $query->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);

            $results->getCollection()->transform(function ($sender) {
                $senderArray = $sender->toArray();
                try {
                    $stats = $this->campaignService->getSenderStatistics($sender->id);
                    $senderArray['statistics'] = $stats;
                } catch (\Exception $e) {
                    $senderArray['statistics'] = [
                        'total_sent' => 0,
                        'total_delivered' => 0,
                        'success_rate' => 0,
                        'open_rate' => 0,
                        'click_rate' => 0,
                        'campaigns_count' => 0,
                    ];
                }
                return $senderArray;
            });

            return $this->paginatedResponse(
                $results,
                Auth::user()->hasRole('admin') ? 'All senders retrieved successfully' : 'Senders retrieved successfully'
            );
        }, 'list_senders');
    }

    /**
     * Store a newly created resource
     */
    public function store(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'smtp_config_id' => 'nullable|exists:smtp_configs,id',
                'is_active' => 'boolean',
            ],
            function ($data) {
                $data['user_id'] = Auth::id();
                $sender = Sender::create($data);

                return $this->createdResponse(
                    $sender->load(['smtpConfig']),
                    'Sender created successfully'
                );
            },
            'create_sender'
        );
    }

    /**
     * Display the specified resource
     */
    public function show(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $sender = Sender::with(['smtpConfig'])->findOrFail($id);

            $this->authorize('view', $sender);

            return $sender;
        }, 'view_sender');
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            $sender = Sender::findOrFail($id);

            $this->authorize('update', $sender);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|max:255',
                'smtp_config_id' => 'nullable|exists:smtp_configs,id',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $sender->update($validator->validated());

            return $sender->load(['smtpConfig']);
        }, 'update_sender');
    }

    /**
     * Update sender (admin functionality) — delegates to update() for DRY.
     */
    public function updateSender(Request $request, string $id): JsonResponse
    {
        return $this->update($request, $id);
    }

    /**
     * Update multiple senders with common data (admin functionality)
     */
    public function updateSenders(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $validator = Validator::make($request->all(), [
                'sender_ids' => 'required|array',
                'sender_ids.*' => 'exists:senders,id',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $senderIds = $request->input('sender_ids');
            $updateData = $request->only(['is_active']);
            $updatedCount = Sender::whereIn('id', $senderIds)->update($updateData);

            return [
                'updated_count' => $updatedCount,
                'sender_ids' => $senderIds,
            ];
        }, 'update_senders');
    }

    /**
     * Remove the specified resource
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $sender = Sender::findOrFail($id);

            $this->authorize('delete', $sender);

            $sender->delete();

            return null;
        }, 'delete_sender');
    }

    /**
     * Test sender connection
     */
    public function testConnection(Request $request, Sender $sender): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            ['test_email' => 'required|email'],
            function ($validatedData) use ($sender) {
                $this->authorize('testConnection', $sender);

                $smtpConfig = $sender->smtpConfig;

                if (!$smtpConfig) {
                    return $this->errorResponse('No SMTP configuration assigned to this sender. Please assign an SMTP config first.', 400);
                }

                $result = $this->senderService->testSmtpConfig($smtpConfig, $sender, $validatedData['test_email']);

                if ($result['success']) {
                    return $result;
                }

                return $this->errorResponse($result['error'] ?? 'Test failed', 400);
            },
            'test_sender'
        );
    }

    /**
     * Ban a sender (admin only).
     * Banned senders cannot be used in campaign sending.
     */
    public function ban(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $sender = Sender::findOrFail($id);
            $sender->ban(Auth::user());

            return [
                'message' => 'Sender banned successfully',
                'sender' => $sender->fresh(['smtpConfig', 'bannedBy']),
            ];
        }, 'ban_sender');
    }

    /**
     * Unban a sender (admin only).
     */
    public function unban(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $sender = Sender::findOrFail($id);
            $sender->unban();

            return [
                'message' => 'Sender unbanned successfully',
                'sender' => $sender->fresh(['smtpConfig', 'bannedBy']),
            ];
        }, 'unban_sender');
    }
}
