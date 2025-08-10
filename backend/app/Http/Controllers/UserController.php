<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Device;
use App\Traits\GeoIPTrait;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\ResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    use LoggingTrait,
        GeoIPTrait,
        ValidationTrait,
        ResponseTrait;

    public function __construct(
        // private GeoIPService $geoIPService
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
            
            $perPage = $request->input('per_page', 15);
            $page = $request->input('page', 1);
            
            $query = User::with(['devices', 'campaigns']);
            $results = $query->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);
            
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
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $userData = $validator->validated();
        $userData['password'] = Hash::make($userData['password']);
        
        // Get location from IP
        $location = $this->geoIPService->getLocation($request->ip());
        $userData['country'] = $location['country'] ?? null;
        $userData['city'] = $location['city'] ?? null;
        
        $user = User::create($userData);
        
        Log::info('User registered', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => $request->ip(),
            'country' => $user->country,
            'city' => $user->city
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => $user
        ], 201);
    }

    /**
     * Display the specified resource
     */
    public function show(string $id): JsonResponse
    {
        $user = User::with(['devices', 'campaigns'])->findOrFail($id);
        
        $this->authorize('view', $user);
        
        return response()->json([
            'success' => true,
            'message' => 'User retrieved successfully',
            'data' => $user
        ]);
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $id) {
            $user = User::findOrFail($id);
            
            // Admin can update any user, regular users can only update themselves
            if (!Auth::user()->hasRole('admin') && $user->id !== Auth::id()) {
                return $this->forbiddenResponse('Access denied');
            }
            
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
                'password' => 'sometimes|string|min:8|confirmed',
                'status' => 'sometimes|string|in:active,inactive,suspended'
            ]);
            
            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }
            
            $userData = $validator->validated();
            
            if (isset($userData['password'])) {
                $userData['password'] = Hash::make($userData['password']);
            }
            
            $user->update($userData);
            
            Log::info('User updated', [
                'updated_by' => Auth::id(),
                'user_id' => $user->id,
                'updated_fields' => array_keys($userData),
                'ip' => $request->ip()
            ]);
            
            return $this->successResponse($user, 'User updated successfully');
        }, 'update_user');
    }

    /**
     * Remove the specified resource
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $user = User::findOrFail($id);
            
            // Admin can delete any user, regular users can only delete themselves
            if (!Auth::user()->hasRole('admin') && $user->id !== Auth::id()) {
                return $this->forbiddenResponse('Access denied');
            }
            
            // Prevent admin from deleting themselves
            if (Auth::user()->hasRole('admin') && $user->id === Auth::id()) {
                return $this->errorResponse('Cannot delete your own account');
            }
            
            $user->delete();
            
            Log::info('User deleted', [
                'deleted_by' => Auth::id(),
                'deleted_user_id' => $user->id,
                'ip' => request()->ip()
            ]);
            
            return $this->successResponse(null, 'User deleted successfully');
        }, 'delete_user');
    }

    /**
     * Add device to user
     */
    public function addDevice(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);
        
        $validator = Validator::make($request->all(), [
            'device_name' => 'required|string|max:255',
            'device_type' => 'required|string|in:mobile,tablet,desktop',
            'device_id' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check device limit (max 2 devices)
        if ($user->devices()->count() >= 2) {
            return response()->json([
                'success' => false,
                'message' => 'Maximum device limit reached (2 devices)',
                'data' => 'Device limit exceeded'
            ], 400);
        }
        
        $device = $user->devices()->create($validator->validated());
        
        Log::info('Device added', [
            'user_id' => $user->id,
            'device_id' => $device->id,
            'device_name' => $device->device_name,
            'ip' => $request->ip()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Device added successfully',
            'data' => $device
        ], 201);
    }

    /**
     * Remove device from user
     */
    public function removeDevice(User $user, Device $device): JsonResponse
    {
        $this->authorize('update', $user);
        
        if ($device->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to device'
            ], 403);
        }
        
        $device->delete();
        
        Log::info('Device removed', [
            'user_id' => $user->id,
            'device_id' => $device->id,
            'ip' => request()->ip()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Device removed successfully'
        ]);
    }

    /**
     * Get user sessions
     */
    public function sessions(User $user): JsonResponse
    {
        $this->authorize('view', $user);
        
        $sessions = $user->sessions()
            ->where('last_active', '>', now()->subMinutes(5))
            ->orderBy('last_active', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'message' => 'User sessions retrieved successfully',
            'data' => $sessions
        ]);
    }

    /**
     * Terminate user session
     */
    public function terminateSession(User $user, $sessionId): JsonResponse
    {
        $this->authorize('update', $user);
        
        $session = $user->sessions()->where('session_id', $sessionId)->first();
        
        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found'
            ], 404);
        }
        
        $session->delete();
        
        Log::info('Session terminated', [
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'ip' => request()->ip()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Session terminated successfully'
        ]);
    }

    /**
     * Get user profile
     */
    public function getProfile(): JsonResponse
    {
        $user = Auth::user()->load(['devices', 'sessions']);
        
        return response()->json([
            'success' => true,
            'message' => 'Profile retrieved successfully',
            'data' => $user
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'sometimes|string|max:20',
            'timezone' => 'sometimes|string|max:50',
            'language' => 'sometimes|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($validator->validated());
        
        Log::info('Profile updated', [
            'user_id' => $user->id,
            'updated_fields' => array_keys($validator->validated()),
            'ip' => $request->ip()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $user
        ]);
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect',
                'data' => 'Password change failed'
            ], 400);
        }
        
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);
        
        Log::info('Password changed', [
            'user_id' => $user->id,
            'ip' => $request->ip()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }

    /**
     * Get user devices
     */
    public function getDevices(): JsonResponse
    {
        $devices = Auth::user()->devices;
        
        return response()->json([
            'success' => true,
            'message' => 'Devices retrieved successfully',
            'data' => $devices
        ]);
    }

    /**
     * Get user sessions
     */
    public function getSessions(): JsonResponse
    {
        $sessions = Auth::user()->sessions;
        
        return response()->json([
            'success' => true,
            'message' => 'Sessions retrieved successfully',
            'data' => $sessions
        ]);
    }

    /**
     * Get user settings
     */
    public function getSettings(): JsonResponse
    {
        $user = Auth::user();
        
        $settings = [
            'general' => [
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'country' => $user->country,
                'city' => $user->city,
            ],
            'notifications' => [
                'telegram_notifications_enabled' => $user->telegram_notifications_enabled,
            ],
            'security' => [
                'two_factor_enabled' => $user->two_factor_enabled,
            ],
            'telegram' => [
                'telegram_chat_id' => $user->telegram_chat_id,
                'telegram_verified_at' => $user->telegram_verified_at,
            ]
        ];

        return response()->json([
            'success' => true,
            'message' => 'Settings retrieved successfully',
            'data' => $settings
        ]);
    }

    /**
     * Update general settings
     */
    public function updateGeneralSettings(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'username' => 'sometimes|string|max:255|unique:users,username,' . $user->id,
            'country' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'General settings updated successfully',
            'data' => $user->fresh()
        ]);
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

            $data = $validator->validated();
            
            // Update basic notification settings
            if (isset($data['email_notifications_enabled'])) {
                $user->email_notifications_enabled = $data['email_notifications_enabled'];
            }
            
            if (isset($data['telegram_notifications_enabled'])) {
                $user->telegram_notifications_enabled = $data['telegram_notifications_enabled'];
            }
            
            if (isset($data['telegram_chat_id'])) {
                $user->telegram_chat_id = $data['telegram_chat_id'];
            }
            
            // Update granular notification preferences
            if (isset($data['notification_preferences'])) {
                $currentPreferences = $user->notification_preferences ?? [];
                $newPreferences = array_merge($currentPreferences, $data['notification_preferences']);
                $user->notification_preferences = $newPreferences;
            }
            
            $user->save();

            Log::info('User notification settings updated', [
                'user_id' => $user->id,
                'email_enabled' => $user->email_notifications_enabled,
                'telegram_enabled' => $user->telegram_notifications_enabled,
                'has_telegram_chat_id' => !empty($user->telegram_chat_id),
                'preferences_count' => count($user->notification_preferences ?? [])
            ]);

            return $this->successResponse([
                'user' => $user->fresh()
            ], 'Notification settings updated successfully');
        }, 'update_notification_settings');
    }

    /**
     * Update security settings
     */
    public function updateSecuritySettings(Request $request): JsonResponse
    {
        // This method delegates to SecurityController for security-related operations
        return response()->json([
            'success' => false,
            'message' => 'Use /security/settings endpoint for security settings'
        ], 302);
    }

    /**
     * Update API settings
     */
    public function updateApiSettings(Request $request): JsonResponse
    {
        // This method delegates to SecurityController for API key management
        return response()->json([
            'success' => false,
            'message' => 'Use /security/api-keys endpoint for API settings'
        ], 302);
    }

    /**
     * Update Telegram settings
     */
    public function updateTelegramSettings(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $validator = Validator::make($request->all(), [
            'telegram_chat_id' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Telegram settings updated successfully',
            'data' => $user->fresh()
        ]);
    }

    /**
     * Generate API key
     */
    public function generateApiKey(): JsonResponse
    {
        // This method delegates to SecurityController for API key generation
        return response()->json([
            'success' => false,
            'message' => 'Use /security/api-keys endpoint to generate API keys'
        ], 302);
    }

    /**
     * Test Telegram connection
     */
    public function testTelegram(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $validator = Validator::make($request->all(), [
                'chat_id' => 'required|string',
                'message' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $chatId = $request->input('chat_id');
            $message = $request->input('message', 'Test message from WebMail system');

            try {
                // Test Telegram notification
                $this->sendTelegramNotification($message);
                
                return $this->successResponse(null, 'Telegram test message sent successfully');
            } catch (\Exception $e) {
                return $this->errorResponse('Failed to send Telegram test message: ' . $e->getMessage());
            }
        }, 'test_telegram');
    }


}