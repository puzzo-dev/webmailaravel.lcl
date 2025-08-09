<?php

namespace App\Http\Controllers;

use App\Models\UserActivity;
use App\Traits\ResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserActivityController extends Controller
{
    use ResponseTrait;

    /**
     * Get user's recent activities
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = Auth::user();
            $limit = $request->get('limit', 20);
            $days = $request->get('days', 7);
            $type = $request->get('type');

            $query = UserActivity::where('user_id', $user->id)
                ->recent($days)
                ->orderBy('created_at', 'desc')
                ->limit($limit);

            if ($type) {
                $query->ofType($type);
            }

            $activities = $query->get()->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'type' => $activity->activity_type,
                    'description' => $activity->activity_description,
                    'entity_type' => $activity->entity_type,
                    'entity_id' => $activity->entity_id,
                    'icon' => $activity->activity_icon,
                    'color' => $activity->activity_color,
                    'metadata' => $activity->metadata,
                    'created_at' => $activity->created_at,
                    'time_ago' => $activity->created_at->diffForHumans()
                ];
            });

            return $this->successResponse($activities, 'User activities retrieved successfully');
        }, 'get_user_activities');
    }

    /**
     * Get activity statistics
     */
    public function stats(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $user = Auth::user();
            $days = $request->get('days', 7);

            $stats = [
                'total_activities' => UserActivity::where('user_id', $user->id)
                    ->recent($days)
                    ->count(),
                
                'activities_by_type' => UserActivity::where('user_id', $user->id)
                    ->recent($days)
                    ->selectRaw('activity_type, COUNT(*) as count')
                    ->groupBy('activity_type')
                    ->pluck('count', 'activity_type'),
                
                'daily_activities' => UserActivity::where('user_id', $user->id)
                    ->recent($days)
                    ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'date' => $item->date,
                            'count' => $item->count,
                            'formatted_date' => \Carbon\Carbon::parse($item->date)->format('M j')
                        ];
                    }),
                
                'recent_activity_types' => UserActivity::where('user_id', $user->id)
                    ->recent($days)
                    ->distinct()
                    ->pluck('activity_type')
            ];

            return $this->successResponse($stats, 'Activity statistics retrieved successfully');
        }, 'get_activity_stats');
    }

    /**
     * Log a new activity (for internal use or API)
     */
    public function store(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $validated = $request->validate([
                'activity_type' => 'required|string|max:50',
                'activity_description' => 'required|string',
                'entity_type' => 'nullable|string|max:50',
                'entity_id' => 'nullable|integer',
                'metadata' => 'nullable|array'
            ]);

            $activity = UserActivity::logActivity(
                Auth::id(),
                $validated['activity_type'],
                $validated['activity_description'],
                $validated['entity_type'] ?? null,
                $validated['entity_id'] ?? null,
                $validated['metadata'] ?? []
            );

            return $this->successResponse([
                'id' => $activity->id,
                'type' => $activity->activity_type,
                'description' => $activity->activity_description,
                'icon' => $activity->activity_icon,
                'color' => $activity->activity_color,
                'created_at' => $activity->created_at,
                'time_ago' => $activity->created_at->diffForHumans()
            ], 'Activity logged successfully');
        }, 'log_user_activity');
    }
}
