<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\User;
use App\Services\SecurityService;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function __construct(
        private SecurityService $securityService,
        private UserService $userService
    ) {}

    /**
     * Display a listing of the resource (admin only)
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $perPage = min((int) $request->input('per_page', 15), 100);
            $page = $request->input('page', 1);

            $results = User::with(['devices', 'campaigns'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return $this->paginatedResponse($results, 'Users retrieved successfully');
        }, 'list_users');
    }

    /**
     * Store a newly created resource (registration)
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        return $this->executeWithErrorHandling(function () use ($request, $validator) {
            $user = $this->userService->createUser(
                $validator->validated(),
                $request->ip()
            );

            return $this->createdResponse($user, 'User registered successfully');
        }, 'register_user');
    }

    /**
     * Display the specified resource
     */
    public function show(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $user = User::with(['devices', 'campaigns'])->findOrFail($id);

            $this->authorize('view', $user);

            return $user;
        }, 'view_user');
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            $user = User::findOrFail($id);

            $this->authorize('update', $user);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
                'password' => 'sometimes|string|min:8|confirmed',
                'status' => 'sometimes|string|in:active,inactive,suspended',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            return $this->userService->updateUser($user, $validator->validated());
        }, 'update_user');
    }

    /**
     * Remove the specified resource
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $user = User::findOrFail($id);

            $this->authorize('delete', $user);

            $this->userService->deleteUser($user);

            return null;
        }, 'delete_user');
    }

    /**
     * Ban a user (admin only). Banned users can login but cannot send email.
     */
    public function ban(Request $request, User $user): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $user) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            if ($user->hasRole('admin')) {
                return $this->errorResponse('Cannot ban an admin user', 400);
            }

            $validator = Validator::make($request->all(), [
                'reason' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $user->ban(Auth::user(), $validator->validated()['reason'] ?? null);

            return $this->successResponse(
                $user->fresh(),
                'User banned successfully. They can still login but cannot send email.'
            );
        }, 'ban_user');
    }

    /**
     * Unban a user (admin only).
     */
    public function unban(User $user): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($user) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Admin access required');
            }

            $user->unban();

            return $this->successResponse(
                $user->fresh(),
                'User unbanned successfully. They can now send email again.'
            );
        }, 'unban_user');
    }

    /**
     * Add device to user
     */
    public function addDevice(Request $request, User $user): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $user) {
            $this->authorize('update', $user);

            $validator = Validator::make($request->all(), [
                'device_name' => 'required|string|max:255',
                'device_type' => 'required|string|in:mobile,tablet,desktop',
                'device_id' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            return $this->userService->addDevice($user, $validator->validated());
        }, 'add_device');
    }

    /**
     * Remove device from user
     */
    public function removeDevice(User $user, Device $device): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($user, $device) {
            $this->authorize('update', $user);

            $this->userService->removeDevice($user, $device);

            return null;
        }, 'remove_device');
    }

    /**
     * Get user sessions
     */
    public function sessions(User $user): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($user) {
            $this->authorize('view', $user);

            return $user->sessions()
                ->where('last_active', '>', now()->subMinutes(5))
                ->orderBy('last_active', 'desc')
                ->get();
        }, 'view_user_sessions');
    }

    /**
     * Terminate user session
     */
    public function terminateSession(User $user, $sessionId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($user, $sessionId) {
            $this->authorize('update', $user);

            $session = $user->sessions()->where('session_id', $sessionId)->first();

            if (!$session) {
                return $this->errorResponse('Session not found', 404);
            }

            $session->delete();

            return null;
        }, 'terminate_session');
    }

    /**
     * Get user profile
     */
    public function getProfile(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            return Auth::user()->load(['devices', 'sessions']);
        }, 'get_profile');
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = Auth::user();

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
                'phone' => 'sometimes|string|max:20',
                'timezone' => 'sometimes|string|max:50',
                'language' => 'sometimes|string|max:10',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            return $this->userService->updateUser($user, $validator->validated());
        }, 'update_profile');
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        try {
            $this->securityService->changePassword(
                Auth::user(),
                $validated['current_password'],
                $validated['new_password']
            );

            return $this->successResponse(null, 'Password changed successfully');
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Get user devices
     */
    public function getDevices(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            return Auth::user()->devices;
        }, 'get_devices');
    }

    /**
     * Get user sessions
     */
    public function getSessions(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            return Auth::user()->sessions;
        }, 'get_sessions');
    }

    /**
     * Get user settings
     */
    public function getSettings(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            return $this->userService->getSettings(Auth::user());
        }, 'get_settings');
    }

    /**
     * Update general settings
     */
    public function updateGeneralSettings(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = Auth::user();

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'username' => 'sometimes|string|max:255|unique:users,username,' . $user->id,
                'country' => 'sometimes|string|max:255',
                'city' => 'sometimes|string|max:255',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            return $this->userService->updateGeneralSettings($user, $validator->validated());
        }, 'update_general_settings');
    }

    /**
     * Update notification settings
     */
    public function updateNotificationSettings(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = Auth::user();

            $validator = Validator::make($request->all(), [
                'email_notifications_enabled' => 'sometimes|boolean',
                'telegram_notifications_enabled' => 'sometimes|boolean',
                'telegram_chat_id' => 'sometimes|nullable|string|max:255',
                'notification_preferences' => 'sometimes|array',
                'notification_preferences.*.email' => 'sometimes|boolean',
                'notification_preferences.*.telegram' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            return $this->userService->updateNotificationSettings($user, $validator->validated());
        }, 'update_notification_settings');
    }

    /**
     * Update Telegram settings
     */
    public function updateTelegramSettings(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = Auth::user();

            $validator = Validator::make($request->all(), [
                'telegram_chat_id' => 'sometimes|string|max:255',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            return $this->userService->updateTelegramSettings($user, $validator->validated());
        }, 'update_telegram_settings');
    }

    /**
     * Test Telegram connection
     */
    public function testTelegram(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $validator = Validator::make($request->all(), [
                'chat_id' => 'required|string',
                'message' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            return $this->userService->testTelegram(
                $request->input('chat_id'),
                $request->input('message', 'Test message from WebMail system')
            );
        }, 'test_telegram');
    }

    /**
     * Get user activities
     */
    public function getActivities(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $limit = min((int) $request->input('limit', 50), 200);
            return $this->userService->getActivities(Auth::user(), $limit);
        }, 'get_activities');
    }

    /**
     * Get specific activity
     */
    public function getActivity(Request $request, $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $activity = $this->userService->getActivity(Auth::user(), (int) $id);

            if (!$activity) {
                return $this->errorResponse('Activity not found', 404);
            }

            return $activity;
        }, 'get_activity');
    }

    /**
     * Create new activity (for logging purposes)
     */
    public function createActivity(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $validator = Validator::make($request->all(), [
                'type' => 'required|string|max:255|in:login,logout,profile_update,password_change,settings_update,campaign_created,campaign_sent',
                'description' => 'required|string|max:500',
                'metadata' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $activity = $this->userService->createActivity(
                Auth::user(),
                $validator->validated()['type'],
                $validator->validated()['description'],
                $validator->validated()['metadata'] ?? null
            );

            return [
                'id' => $activity->id,
                'type' => $activity->activity_type,
                'description' => $activity->activity_description,
                'metadata' => $activity->metadata ?? [],
                'created_at' => $activity->created_at->toISOString(),
            ];
        }, 'create_activity');
    }

    /**
     * Get activity statistics
     */
    public function getActivityStats(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            return $this->userService->getActivityStats(Auth::user());
        }, 'get_activity_stats');
    }
}
