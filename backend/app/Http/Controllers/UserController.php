<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Device;
use App\Services\GeoIPService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class UserController extends BaseController
{
    public function __construct(
        private GeoIPService $geoIPService
    ) {
        parent::__construct();
    }

    /**
     * Display a listing of the resource (admin only)
     */
    public function index(): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeAdmin(),
            fn() => $this->getPaginatedResults(
                User::with(['devices', 'campaigns']),
                request(),
                'users'
            ),
            'list_users'
        );
    }

    /**
     * Store a newly created resource (registration)
     */
    public function store(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ],
            function () use ($request) {
                $userData = $request->input('validated_data');
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
                
                return $this->createdResponse($user, 'User registered successfully');
            },
            'user_registration'
        );
    }

    /**
     * Display the specified resource
     */
    public function show(User $user): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($user, 'user'),
            fn() => $this->getResource($user, 'user', $user->id),
            'view_user'
        );
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, User $user): JsonResponse
    {
        return $this->validateAuthorizeAndExecute(
            $request,
            [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
                'password' => 'sometimes|string|min:8|confirmed',
            ],
            fn() => $this->authorizeResourceAccess($user, 'user'),
            function () use ($request, $user) {
                $userData = $request->input('validated_data');
                
                if (isset($userData['password'])) {
                    $userData['password'] = Hash::make($userData['password']);
                }
                
                $user->update($userData);
                
                Log::info('User updated', [
                    'user_id' => $user->id,
                    'updated_fields' => array_keys($request->input('validated_data')),
                    'ip' => $request->ip()
                ]);
                
                return $this->successResponse($user, 'User updated successfully');
            },
            'update_user'
        );
    }

    /**
     * Remove the specified resource
     */
    public function destroy(User $user): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($user, 'user'),
            function () use ($user) {
                $user->delete();
                
                Log::info('User deleted', [
                    'user_id' => $user->id,
                    'ip' => request()->ip()
                ]);
                
                return $this->successResponse(null, 'User deleted successfully');
            },
            'delete_user'
        );
    }

    /**
     * Add device to user
     */
    public function addDevice(Request $request, User $user): JsonResponse
    {
        return $this->validateAuthorizeAndExecute(
            $request,
            [
                'device_name' => 'required|string|max:255',
                'device_type' => 'required|string|in:mobile,tablet,desktop',
                'device_id' => 'required|string|max:255',
            ],
            fn() => $this->authorizeResourceAccess($user, 'user'),
            function () use ($request, $user) {
                // Check device limit (max 2 devices)
                if ($user->devices()->count() >= 2) {
                    return $this->errorResponse('Maximum device limit reached (2 devices)', 'Device limit exceeded');
                }
                
                $device = $user->devices()->create($request->input('validated_data'));
                
                Log::info('Device added', [
                    'user_id' => $user->id,
                    'device_id' => $device->id,
                    'device_name' => $device->device_name,
                    'ip' => $request->ip()
                ]);
                
                return $this->createdResponse($device, 'Device added successfully');
            },
            'add_device'
        );
    }

    /**
     * Remove device from user
     */
    public function removeDevice(User $user, Device $device): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($user, 'user'),
            function () use ($user, $device) {
                if ($device->user_id !== $user->id) {
                    return $this->forbiddenResponse('Access denied to device');
                }
                
                $device->delete();
                
                Log::info('Device removed', [
                    'user_id' => $user->id,
                    'device_id' => $device->id,
                    'ip' => request()->ip()
                ]);
                
                return $this->successResponse(null, 'Device removed successfully');
            },
            'remove_device'
        );
    }

    /**
     * Get user sessions
     */
    public function sessions(User $user): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($user, 'user'),
            function () use ($user) {
                $sessions = $user->sessions()
                    ->where('last_active', '>', now()->subMinutes(5))
                    ->orderBy('last_active', 'desc')
                    ->get();
                
                return $this->successResponse($sessions, 'User sessions retrieved successfully');
            },
            'view_sessions'
        );
    }

    /**
     * Terminate user session
     */
    public function terminateSession(User $user, $sessionId): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess($user, 'user'),
            function () use ($user, $sessionId) {
                $session = $user->sessions()->where('session_id', $sessionId)->first();
                
                if (!$session) {
                    return $this->notFoundResponse('Session not found');
                }
                
                $session->delete();
                
                Log::info('Session terminated', [
                    'user_id' => $user->id,
                    'session_id' => $sessionId,
                    'ip' => request()->ip()
                ]);
                
                return $this->successResponse(null, 'Session terminated successfully');
            },
            'terminate_session'
        );
    }

    /**
     * Get user profile
     */
    public function getProfile(): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess(Auth::user(), Auth::user()),
            function () {
                $user = Auth::user()->load(['devices', 'sessions']);
                return $this->successResponse($user, 'Profile retrieved successfully');
            },
            'view_profile'
        );
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        return $this->validateAuthorizeAndExecute(
            $request,
            [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:users,email,' . Auth::id(),
                'phone' => 'sometimes|string|max:20',
                'timezone' => 'sometimes|string|max:50',
                'language' => 'sometimes|string|max:10',
            ],
            fn() => $this->authorizeResourceAccess(Auth::user(), Auth::user()),
            function () use ($request) {
                $user = Auth::user();
                $user->update($request->input('validated_data'));
                
                Log::info('Profile updated', [
                    'user_id' => $user->id,
                    'updated_fields' => array_keys($request->input('validated_data')),
                    'ip' => $request->ip()
                ]);
                
                return $this->successResponse($user, 'Profile updated successfully');
            },
            'update_profile'
        );
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request): JsonResponse
    {
        return $this->validateAuthorizeAndExecute(
            $request,
            [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ],
            fn() => $this->authorizeResourceAccess(Auth::user(), Auth::user()),
            function () use ($request) {
                $user = Auth::user();
                
                if (!Hash::check($request->current_password, $user->password)) {
                    return $this->errorResponse('Current password is incorrect', 'Password change failed');
                }
                
                $user->update([
                    'password' => Hash::make($request->new_password)
                ]);
                
                Log::info('Password changed', [
                    'user_id' => $user->id,
                    'ip' => $request->ip()
                ]);
                
                return $this->successResponse(null, 'Password changed successfully');
            },
            'change_password'
        );
    }

    /**
     * Get user devices
     */
    public function getDevices(): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess(Auth::user(), Auth::user()),
            function () {
                $devices = Auth::user()->devices;
                return $this->successResponse($devices, 'Devices retrieved successfully');
            },
            'view_devices'
        );
    }

    /**
     * Get user sessions
     */
    public function getSessions(): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess(Auth::user(), Auth::user()),
            function () {
                $sessions = Auth::user()->sessions;
                return $this->successResponse($sessions, 'Sessions retrieved successfully');
            },
            'view_sessions'
        );
    }
}