<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Services\UnifiedTrainingService;
use App\Traits\ResponseTrait;
use App\Traits\LoggingTrait;
use App\Models\User;

class TrainingController extends Controller
{
    use ResponseTrait, LoggingTrait;

    protected $trainingService;

    public function __construct(UnifiedTrainingService $trainingService)
    {
        $this->trainingService = $trainingService;
    }

    /**
     * Admin: Get training settings for a specific user
     */
    public function getAdminTrainingSettings(int $userId): JsonResponse
    {
        try {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $user = User::findOrFail($userId);
            
            $settings = [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'training_enabled' => $user->hasTrainingEnabled(),
                'training_mode' => $user->training_mode ?? 'automatic',
                'manual_training_percentage' => $user->getManualTrainingPercentage(),
                'last_manual_training_at' => $user->last_manual_training_at,
                'is_manual_training_due' => $user->isManualTrainingDue(),
            ];

            return $this->successResponse($settings, 'Training settings retrieved successfully');
        } catch (\Exception $e) {
            $this->logError('Failed to get admin training settings', ['error' => $e->getMessage(), 'user_id' => $userId]);
            return $this->errorResponse('Failed to retrieve training settings', 500);
        }
    }

    /**
     * Admin: Update training settings for a specific user
     */
    public function updateAdminTrainingSettings(Request $request, int $userId): JsonResponse
    {
        try {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $validator = Validator::make($request->all(), [
                'training_enabled' => 'required|boolean',
                'training_mode' => 'required|in:manual,automatic',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            $user = User::findOrFail($userId);
            
            // Update user training settings
            $user->update([
                'training_enabled' => $request->training_enabled,
                'training_mode' => $request->training_mode,
            ]);

            $this->logInfo('Admin updated training settings', [
                'admin_id' => Auth::id(),
                'target_user_id' => $userId,
                'settings' => $request->only(['training_enabled', 'training_mode'])
            ]);

            return $this->successResponse([
                'user_id' => $user->id,
                'training_enabled' => $user->training_enabled,
                'training_mode' => $user->training_mode,
            ], 'Training settings updated successfully');
        } catch (\Exception $e) {
            $this->logError('Failed to update admin training settings', ['error' => $e->getMessage(), 'user_id' => $userId]);
            return $this->errorResponse('Failed to update training settings', 500);
        }
    }

    /**
     * Admin: Get training statistics for a specific user
     */
    public function getAdminTrainingStats(int $userId): JsonResponse
    {
        try {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $user = User::findOrFail($userId);
            $stats = $this->trainingService->getTrainingStatistics($user);
            $stats['user_id'] = $user->id;
            $stats['user_email'] = $user->email;

            return $this->successResponse($stats, 'Training statistics retrieved successfully');
        } catch (\Exception $e) {
            $this->logError('Failed to get admin training stats', ['error' => $e->getMessage(), 'user_id' => $userId]);
            return $this->errorResponse('Failed to retrieve training statistics', 500);
        }
    }

    /**
     * Run training for all senders (admin only)
     */
    public function runTraining(): JsonResponse
    {
        try {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $results = $this->trainingService->runSystemTraining();
            
            $this->logInfo('System training completed by admin', [
                'admin_id' => Auth::id(),
                'results' => $results
            ]);

            return $this->successResponse($results, 'Training completed successfully');
        } catch (\Exception $e) {
            $this->logError('Training failed', ['error' => $e->getMessage(), 'admin_id' => Auth::id()]);
            return $this->errorResponse('Training failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Run training for specific user (admin only)
     */
    public function runUserTraining(int $userId): JsonResponse
    {
        try {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $user = User::findOrFail($userId);
            $results = $this->trainingService->runTrainingForUser($user);
            
            $this->logInfo('User training completed by admin', [
                'admin_id' => Auth::id(),
                'target_user_id' => $userId,
                'results' => $results
            ]);

            return $this->successResponse($results, "Training completed for user: {$user->email}");
        } catch (\Exception $e) {
            $this->logError('User training failed', ['error' => $e->getMessage(), 'user_id' => $userId]);
            return $this->errorResponse('Training failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Run training for specific domain (admin only)
     */
    public function runDomainTraining(string $domainId): JsonResponse
    {
        try {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $results = $this->trainingService->runTrainingForDomain($domainId);
            
            $this->logInfo('Domain training completed by admin', [
                'admin_id' => Auth::id(),
                'domain_id' => $domainId,
                'results' => $results
            ]);

            return $this->successResponse($results, "Training completed for domain: {$domainId}");
        } catch (\Exception $e) {
            $this->logError('Domain training failed', ['error' => $e->getMessage(), 'domain_id' => $domainId]);
            return $this->errorResponse('Training failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get training statistics (admin only)
     */
    public function getTrainingStatistics(): JsonResponse
    {
        try {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $stats = $this->trainingService->getTrainingStatistics();
            
            return $this->successResponse($stats, 'Training statistics retrieved successfully');
        } catch (\Exception $e) {
            $this->logError('Failed to get training statistics', ['error' => $e->getMessage()]);
            return $this->errorResponse('Failed to retrieve training statistics', 500);
        }
    }

    /**
     * Get training status (admin only)
     */
    public function getTrainingStatus(): JsonResponse
    {
        try {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $status = $this->trainingService->getTrainingStatus();
            
            return $this->successResponse($status, 'Training status retrieved successfully');
        } catch (\Exception $e) {
            $this->logError('Failed to get training status', ['error' => $e->getMessage()]);
            return $this->errorResponse('Failed to retrieve training status', 500);
        }
    }
}
