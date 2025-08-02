<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Services\ManualTrainingService;
use App\Services\AutomaticTrainingService;
use App\Traits\ResponseTrait;
use App\Models\User;

class TrainingController extends Controller
{
    use ResponseTrait;

    protected $manualTrainingService;
    protected $automaticTrainingService;

    public function __construct(
        ManualTrainingService $manualTrainingService,
        AutomaticTrainingService $automaticTrainingService
    ) {
        $this->manualTrainingService = $manualTrainingService;
        $this->automaticTrainingService = $automaticTrainingService;
    }

    /**
     * Admin: Get training settings for a specific user
     */
    public function getAdminTrainingSettings(int $userId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($userId) {
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

            return $this->successResponse($settings, 'User training settings retrieved successfully');
        }, 'get_admin_training_settings');
    }

    /**
     * Admin: Update training activation for a specific user
     */
    public function updateAdminTrainingSettings(Request $request, int $userId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request, $userId) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $user = User::findOrFail($userId);

            $validator = Validator::make($request->all(), [
                'training_enabled' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator->errors());
            }

            // Only allow admin to enable/disable training
            // Training mode and percentage are set automatically
            $user->update([
                'training_enabled' => $request->training_enabled,
                'training_mode' => 'manual', // Always use manual mode for internal training
                'manual_training_percentage' => 10.0, // Fixed 10% increase
            ]);

            return $this->successResponse([
                'user_id' => $user->id,
                'user_email' => $user->email,
                'training_enabled' => $user->hasTrainingEnabled(),
                'training_mode' => $user->training_mode,
                'manual_training_percentage' => $user->getManualTrainingPercentage(),
            ], 'User training activation updated successfully');
        }, 'update_admin_training_settings');
    }

    /**
     * Admin: Get training statistics for a specific user
     */
    public function getAdminTrainingStats(int $userId): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($userId) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $user = User::findOrFail($userId);
            $stats = $this->manualTrainingService->getManualTrainingStats($user);
            $stats['user_id'] = $user->id;
            $stats['user_email'] = $user->email;

            return $this->successResponse($stats, 'User training statistics retrieved successfully');
        }, 'get_admin_training_stats');
    }

}
