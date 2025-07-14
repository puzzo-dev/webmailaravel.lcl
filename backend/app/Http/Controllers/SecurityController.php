<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\SecurityService;
use App\Services\LoggingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class SecurityController extends Controller
{
    protected $securityService;
    protected $loggingService;

    public function __construct(SecurityService $securityService, LoggingService $loggingService)
    {
        $this->securityService = $securityService;
        $this->loggingService = $loggingService;
    }

    /**
     * Get user security summary
     */
    public function getSecuritySummary(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $summary = $this->securityService->getUserSecuritySummary($user);

            return response()->json([
                'success' => true,
                'data' => $summary
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get security summary',
                'error' => $e->getMessage()
            ], 500);
        }
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
     * Verify 2FA code
     */
    public function verify2FA(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'code' => 'required|string|size:6'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $code = $request->input('code');

            if ($this->securityService->verify2FACode($user, $code)) {
                return response()->json([
                    'success' => true,
                    'message' => '2FA code verified successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Invalid 2FA code'
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify 2FA code',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Disable 2FA
     */
    public function disable2FA(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user->two_factor_enabled) {
                return response()->json([
                    'success' => false,
                    'message' => '2FA is not enabled'
                ], 400);
            }

            $this->securityService->disable2FA($user);

            return response()->json([
                'success' => true,
                'message' => '2FA disabled successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to disable 2FA',
                'error' => $e->getMessage()
            ], 500);
        }
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
     * Get user's API keys
     */
    public function getApiKeys(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            
            $apiKeys = $user->apiKeys()
                ->select(['id', 'name', 'key', 'permissions', 'last_used_at', 'expires_at', 'created_at'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $apiKeys
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get API keys',
                'error' => $e->getMessage()
            ], 500);
        }
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
} 
 
 
 
 
 