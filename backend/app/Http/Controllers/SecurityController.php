<?php

namespace App\Http\Controllers;

use App\Services\SecurityService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class SecurityController extends Controller
{
    protected $securityService;

    public function __construct(SecurityService $securityService)
    {
        $this->securityService = $securityService;
    }

    /**
     * Get user security summary
     */
    public function getSecuritySummary(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = auth()->user();
            $summary = $this->securityService->getUserSecuritySummary($user);
            return $summary;
        }, 'get_security_summary');
    }

    /**
     * Get security settings
     */
    public function getSecuritySettings(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = auth()->user();
            
            $settings = [
                'two_factor_enabled' => $user->two_factor_enabled,
                'two_factor_enabled_at' => $user->two_factor_enabled_at,
                'last_password_change' => $user->last_password_change,
                'security_score' => $user->getSecurityScore(),
                'active_sessions_count' => $user->sessions()->where('last_activity', '>', time() - (24 * 60 * 60))->count(),
                'trusted_devices_count' => $user->trustedDevices()->count(),
                'api_keys_count' => $user->apiKeys()->where('expires_at', '>', now())->count(),
            ];

            return $settings;
        }, 'get_security_settings');
    }

    /**
     * Update security settings (admin functionality)
     */
    public function updateSecuritySettings(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            // Check if user has admin role
            if (!auth()->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }

            $request->validate([
                'two_factor_required' => 'sometimes|boolean',
                'password_expiry_days' => 'sometimes|integer|min:1|max:365',
                'session_timeout_minutes' => 'sometimes|integer|min:5|max:1440',
                'max_login_attempts' => 'sometimes|integer|min:1|max:10',
                'lockout_duration_minutes' => 'sometimes|integer|min:1|max:1440',
                'require_strong_passwords' => 'sometimes|boolean',
                'enable_audit_logging' => 'sometimes|boolean',
                'enable_suspicious_activity_detection' => 'sometimes|boolean',
            ]);

            // Update system security settings
            $updatedSettings = [];
            
            foreach ($request->all() as $key => $value) {
                if (in_array($key, [
                    'two_factor_required',
                    'password_expiry_days', 
                    'session_timeout_minutes',
                    'max_login_attempts',
                    'lockout_duration_minutes',
                    'require_strong_passwords',
                    'enable_audit_logging',
                    'enable_suspicious_activity_detection'
                ])) {
                    // Store in system config
                    \App\Models\SystemConfig::set('SECURITY_' . strtoupper($key), $value);
                    $updatedSettings[$key] = $value;
                }
            }

            return $this->successResponse($updatedSettings, 'Security settings updated successfully');
        }, 'update_security_settings');
    }

    /**
     * Setup 2FA
     */
    public function setup2FA(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();

            if ($user->two_factor_enabled) {
                return response()->json([
                    'success' => false,
                    'message' => '2FA is already enabled'
                ], 400);
            }

            $setup = $this->securityService->generate2FASecret($user);

            return response()->json([
                'success' => true,
                'data' => $setup
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to setup 2FA',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enable 2FA
     */
    public function enable2FA(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = auth()->user();

            if ($user->two_factor_enabled) {
                throw new \Exception('2FA is already enabled');
            }

            $setup = $this->securityService->generate2FASecret($user);
            return $setup;
        }, 'enable_2fa');
    }

    /**
     * Verify 2FA code
     */
    public function verify2FA(Request $request): JsonResponse
    {
        return $this->validateAndExecuteWithErrorHandling(
            $request->all(),
            ['code' => 'required|string|size:6'],
            function ($validatedData) {
                $user = auth()->user();
                $code = $validatedData['code'];

                if ($this->securityService->verify2FACode($user, $code)) {
                    return ['message' => '2FA code verified successfully'];
                }

                throw new \Exception('Invalid 2FA code');
            },
            'verify_2fa'
        );
    }

    /**
     * Disable 2FA
     */
    public function disable2FA(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = auth()->user();

            if (!$user->two_factor_enabled) {
                throw new \Exception('2FA is not enabled');
            }

            $this->securityService->disable2FA($user);
            return ['message' => '2FA disabled successfully'];
        }, 'disable_2fa');
    }

    /**
     * Generate API key
     */
    public function generateApiKey(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $name = $request->input('name');

            $apiKey = $this->securityService->generateApiKey($user, $name);

            return response()->json([
                'success' => true,
                'data' => $apiKey
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate API key',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create API key (alias for generateApiKey for backward compatibility)
     */
    public function createApiKey(Request $request): JsonResponse
    {
        return $this->generateApiKey($request);
    }

    /**
     * Get API keys
     */
    public function getApiKeys(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = auth()->user();
            
            $apiKeys = $user->apiKeys()
                ->where('expires_at', '>', now())
                ->orderBy('created_at', 'desc')
                ->get();

            return $apiKeys;
        }, 'get_api_keys');
    }

    /**
     * Revoke API key
     */
    public function revokeApiKey(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'api_key_id' => 'required|integer'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $apiKeyId = $request->input('api_key_id');

            if ($this->securityService->revokeApiKey($user, $apiKeyId)) {
                return response()->json([
                    'success' => true,
                    'message' => 'API key revoked successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'API key not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to revoke API key',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get security logs
     */
    public function getSecurityLogs(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $limit = $request->input('limit', 50);
            
            $logs = $this->securityService->getSecurityLogs($user, $limit);

            return response()->json([
                'success' => true,
                'data' => $logs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get security logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get activity log (alias for getSecurityLogs for backward compatibility)
     */
    public function getActivityLog(Request $request): JsonResponse
    {
        return $this->getSecurityLogs($request);
    }

    /**
     * Check suspicious activity
     */
    public function checkSuspiciousActivity(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $activity = $this->securityService->checkSuspiciousActivity($user);

            return response()->json([
                'success' => true,
                'data' => $activity
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check suspicious activity',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change password
     */
    public function changePassword(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
                'new_password_confirmation' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $currentPassword = $request->input('current_password');
            $newPassword = $request->input('new_password');

            if (!Hash::check($currentPassword, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 400);
            }

            $user->update([
                'password' => Hash::make($newPassword),
                'last_password_change' => now()
            ]);

            $this->securityService->logSecurityEvent($user, 'password_changed', [
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to change password',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trusted devices
     */
    public function getTrustedDevices(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = auth()->user();
            
            $devices = $user->trustedDevices()
                ->select(['id', 'device_name', 'device_type', 'ip_address', 'last_used_at', 'created_at'])
                ->orderBy('last_used_at', 'desc')
                ->get();

            return $devices;
        }, 'get_trusted_devices');
    }

    /**
     * Trust a device
     */
    public function trustDevice(Request $request, $deviceId): JsonResponse
    {
        try {
            $user = auth()->user();
            
            $device = $user->trustedDevices()->find($deviceId);
            
            if (!$device) {
                return response()->json([
                    'success' => false,
                    'message' => 'Device not found'
                ], 404);
            }

            $device->update([
                'trusted' => true,
                'trusted_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Device trusted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to trust device',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active sessions
     */
    public function getActiveSessions(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = auth()->user();
            
            $sessions = $user->sessions()
                ->select(['id', 'ip_address', 'user_agent', 'last_activity'])
                ->where('last_activity', '>', time() - (24 * 60 * 60)) // Last 24 hours
                ->orderBy('last_activity', 'desc')
                ->get()
                ->map(function ($session) {
                    return [
                        'id' => $session->id,
                        'ip_address' => $session->ip_address,
                        'user_agent' => $session->user_agent,
                        'last_activity' => date('Y-m-d H:i:s', $session->last_activity),
                        'created_at' => date('Y-m-d H:i:s', $session->last_activity),
                    ];
                });

            return $sessions;
        }, 'get_active_sessions');
    }

    /**
     * Revoke session
     */
    public function revokeSession(Request $request, $sessionId): JsonResponse
    {
        try {
            $user = auth()->user();
            
            $session = $user->sessions()->find($sessionId);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $session->delete();

            return response()->json([
                'success' => true,
                'message' => 'Session revoked successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to revoke session',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 
 
 
 
 
 