<?php

namespace App\Http\Controllers;

use App\Services\SecurityService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class SecurityController extends Controller
{
    public function __construct(
        protected SecurityService $securityService
    ) {}

    /**
     * Get user security summary
     */
    public function getSecuritySummary(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            return $this->securityService->getUserSecuritySummary($request->user());
        }, 'get_security_summary');
    }

    /**
     * Get security settings
     */
    public function getSecuritySettings(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = $request->user();

            return [
                'two_factor_enabled' => $user->two_factor_enabled,
                'two_factor_enabled_at' => $user->two_factor_enabled_at,
                'last_password_change' => $user->last_password_change,
                'security_score' => $user->getSecurityScore(),
                'active_sessions_count' => $user->sessions()->where('last_activity', '>', time() - (24 * 60 * 60))->count(),
                'trusted_devices_count' => $user->trustedDevices()->count(),
                'api_keys_count' => $user->apiKeys()->where('expires_at', '>', now())->count(),
            ];
        }, 'get_security_settings');
    }

    /**
     * Update security settings (admin functionality)
     */
    public function updateSecuritySettings(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!$request->user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }

            $validated = $request->validate([
                'two_factor_required' => 'sometimes|boolean',
                'password_expiry_days' => 'sometimes|integer|min:1|max:365',
                'session_timeout_minutes' => 'sometimes|integer|min:5|max:1440',
                'max_login_attempts' => 'sometimes|integer|min:1|max:10',
                'lockout_duration_minutes' => 'sometimes|integer|min:1|max:1440',
                'require_strong_passwords' => 'sometimes|boolean',
                'enable_audit_logging' => 'sometimes|boolean',
                'enable_suspicious_activity_detection' => 'sometimes|boolean',
            ]);

            $allowedKeys = [
                'two_factor_required',
                'password_expiry_days',
                'session_timeout_minutes',
                'max_login_attempts',
                'lockout_duration_minutes',
                'require_strong_passwords',
                'enable_audit_logging',
                'enable_suspicious_activity_detection',
            ];

            $updatedSettings = [];
            foreach ($validated as $key => $value) {
                if (in_array($key, $allowedKeys, true)) {
                    \App\Models\SystemConfig::set('SECURITY_' . strtoupper($key), $value);
                    $updatedSettings[$key] = $value;
                }
            }

            return $this->successResponse($updatedSettings, 'Security settings updated successfully');
        }, 'update_security_settings');
    }

    /**
     * Setup 2FA (generates secret + QR code)
     */
    public function setup2FA(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = $request->user();

            if ($user->two_factor_enabled) {
                return $this->errorResponse('2FA is already enabled', 400);
            }

            return $this->securityService->generate2FASecret($user);
        }, 'setup_2fa');
    }

    /**
     * Enable 2FA (alias for setup2FA)
     */
    public function enable2FA(Request $request): JsonResponse
    {
        return $this->setup2FA($request);
    }

    /**
     * Verify 2FA code
     */
    public function verify2FA(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            ['code' => 'required|string|size:6'],
            function ($validated) use ($request) {
                if ($this->securityService->verify2FACode($request->user(), $validated['code'])) {
                    return ['message' => '2FA code verified successfully'];
                }

                return $this->errorResponse('Invalid 2FA code', 400);
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
            $user = $request->user();

            if (!$user->two_factor_enabled) {
                return $this->errorResponse('2FA is not enabled', 400);
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
        return $this->validateAndExecute(
            $request,
            ['name' => 'required|string|max:255'],
            function ($validated) use ($request) {
                return $this->securityService->generateApiKey($request->user(), $validated['name']);
            },
            'generate_api_key'
        );
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
            return $request->user()
                ->apiKeys()
                ->where('expires_at', '>', now())
                ->orderBy('created_at', 'desc')
                ->get();
        }, 'get_api_keys');
    }

    /**
     * Revoke API key
     */
    public function revokeApiKey(Request $request): JsonResponse
    {
        return $this->validateAndExecute(
            $request,
            ['api_key_id' => 'required|integer'],
            function ($validated) use ($request) {
                if ($this->securityService->revokeApiKey($request->user(), $validated['api_key_id'])) {
                    return ['message' => 'API key revoked successfully'];
                }

                return $this->errorResponse('API key not found', 404);
            },
            'revoke_api_key'
        );
    }

    /**
     * Get security logs
     */
    public function getSecurityLogs(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $limit = (int) $request->input('limit', 50);
            return $this->securityService->getSecurityLogs($request->user(), $limit);
        }, 'get_security_logs');
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
        return $this->executeWithErrorHandling(function () use ($request) {
            return $this->securityService->checkSuspiciousActivity($request->user());
        }, 'check_suspicious_activity');
    }

    /**
     * Change password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        try {
            $this->securityService->changePassword(
                $request->user(),
                $validated['current_password'],
                $validated['new_password']
            );

            return $this->successResponse(null, 'Password changed successfully');
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Get trusted devices
     */
    public function getTrustedDevices(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            return $request->user()
                ->trustedDevices()
                ->select(['id', 'device_name', 'device_type', 'ip_address', 'last_used_at', 'created_at'])
                ->orderBy('last_used_at', 'desc')
                ->get();
        }, 'get_trusted_devices');
    }

    /**
     * Trust a device
     */
    public function trustDevice(Request $request, $deviceId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $deviceId) {
            $device = $request->user()->trustedDevices()->find($deviceId);

            if (!$device) {
                return $this->errorResponse('Device not found', 404);
            }

            $device->update([
                'trusted' => true,
                'trusted_at' => now(),
            ]);

            return ['message' => 'Device trusted successfully'];
        }, 'trust_device');
    }

    /**
     * Get active sessions
     */
    public function getActiveSessions(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            return $request->user()
                ->sessions()
                ->select(['id', 'ip_address', 'user_agent', 'last_activity'])
                ->where('last_activity', '>', time() - (24 * 60 * 60))
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
        }, 'get_active_sessions');
    }

    /**
     * Revoke session
     */
    public function revokeSession(Request $request, $sessionId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $sessionId) {
            $session = $request->user()->sessions()->find($sessionId);

            if (!$session) {
                return $this->errorResponse('Session not found', 404);
            }

            $session->delete();
            return ['message' => 'Session revoked successfully'];
        }, 'revoke_session');
    }
}
