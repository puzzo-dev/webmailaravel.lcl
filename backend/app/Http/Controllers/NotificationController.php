<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Transform a notification into a flat array for API responses.
     */
    private function transformNotification($notification, bool $includeUser = false): array
    {
        $data = [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->data['title'] ?? 'Notification',
            'message' => $notification->data['message'] ?? '',
            'notification_type' => $notification->data['notification_type'] ?? $notification->data['type'] ?? 'info',
            'read_at' => $notification->read_at,
            'created_at' => $notification->created_at,
            'updated_at' => $notification->updated_at,
        ];

        if ($includeUser) {
            $data['user_id'] = $notification->notifiable_id;
            $data['user_email'] = $notification->notifiable->email ?? 'Unknown';
        }

        // Include optional fields from notification data
        foreach (['ip_address', 'location', 'device', 'login_time', 'action_url'] as $field) {
            if (isset($notification->data[$field])) {
                $data[$field] = $notification->data[$field];
            }
        }

        return $data;
    }

    /**
     * Display a listing of notifications
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            $isAdmin = Auth::user()->hasRole('admin');
            $includeUser = $isAdmin;

            if ($isAdmin) {
                $notifications = Notification::orderBy('created_at', 'desc')
                    ->paginate($request->get('limit', 20));
            } else {
                $notifications = Auth::user()->notifications()
                    ->orderBy('created_at', 'desc')
                    ->paginate($request->get('limit', 20));
            }

            $transformed = $notifications->getCollection()->map(
                fn ($n) => $this->transformNotification($n, $includeUser)
            );
            $notifications->setCollection($transformed);

            return $this->successResponse(
                $notifications,
                $isAdmin ? 'All notifications retrieved successfully' : 'Notifications retrieved successfully'
            );
        }, 'view_notifications');
    }

    /**
     * Display the specified notification
     */
    public function show(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $notification = Auth::user()->notifications()->where('id', $id)->first();

            if (!$notification) {
                return $this->errorResponse('Notification not found', 404);
            }

            return $this->successResponse(
                $this->transformNotification($notification),
                'Notification retrieved successfully'
            );
        }, 'view_notification');
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $notification = Auth::user()->notifications()->where('id', $id)->first();

            if (!$notification) {
                return $this->errorResponse('Notification not found', 404);
            }

            $notification->markAsRead();

            return $this->successResponse(
                $this->transformNotification($notification),
                'Notification marked as read'
            );
        }, 'mark_notification_read');
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            Auth::user()->unreadNotifications->markAsRead();

            return $this->successResponse(null, 'All notifications marked as read');
        }, 'mark_all_notifications_read');
    }

    /**
     * Remove the specified notification
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $notification = Auth::user()->notifications()->where('id', $id)->first();

            if (!$notification) {
                return $this->errorResponse('Notification not found', 404);
            }

            $notification->delete();

            return $this->successResponse(null, 'Notification deleted successfully');
        }, 'delete_notification');
    }

    /**
     * Delete all notifications
     */
    public function deleteAll(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            Auth::user()->notifications()->delete();

            return $this->successResponse(null, 'All notifications deleted successfully');
        }, 'delete_all_notifications');
    }

    /**
     * Store a newly created notification (admin only)
     */
    public function store(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->errorResponse('Admin access required', 403);
            }

            $request->validate([
                'user_id' => 'sometimes|exists:users,id',
                'user_ids' => 'sometimes|array',
                'user_ids.*' => 'exists:users,id',
                'send_to_all' => 'sometimes|boolean',
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'type' => 'nullable|string|in:info,warning,error,success',
                'channels' => 'sometimes|array',
                'channels.*' => 'string|in:email,telegram,database',
            ]);

            $users = $this->resolveNotificationTargets($request);

            if ($users->isEmpty()) {
                return $this->errorResponse('No valid users found', 404);
            }

            return $this->sendNotifications($users, $request->title, $request->message, $request->type ?? 'info');
        }, 'create_notification');
    }

    /**
     * Send bulk notifications to multiple users (admin only)
     */
    public function sendBulk(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->errorResponse('Admin access required', 403);
            }

            $request->validate([
                'recipient_type' => 'required|string|in:all,active,role,specific',
                'role' => 'sometimes|string|in:admin,user',
                'user_ids' => 'sometimes|array',
                'user_ids.*' => 'exists:users,id',
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'type' => 'nullable|string|in:info,warning,error,success',
            ]);

            $users = $this->resolveBulkTargets($request);

            if ($users->isEmpty()) {
                return $this->errorResponse('No users found matching criteria', 404);
            }

            return $this->sendNotifications($users, $request->title, $request->message, $request->type ?? 'info', $request->recipient_type);
        }, 'send_bulk_notification');
    }

    /**
     * Resolve target users for single notification store().
     */
    private function resolveNotificationTargets(Request $request)
    {
        if ($request->boolean('send_to_all')) {
            return User::all();
        }
        if ($request->has('user_ids')) {
            return User::whereIn('id', $request->user_ids)->get();
        }
        if ($request->has('user_id')) {
            return User::where('id', $request->user_id)->get();
        }
        return collect();
    }

    /**
     * Resolve target users for bulk send().
     */
    private function resolveBulkTargets(Request $request)
    {
        $query = User::query();

        switch ($request->recipient_type) {
            case 'active':
                $query->whereNotNull('email_verified_at');
                break;
            case 'role':
                $query->where('role', $request->role);
                break;
            case 'specific':
                $query->whereIn('id', $request->user_ids ?? []);
                break;
        }

        return $query->get();
    }

    /**
     * Send notifications to a collection of users and return a summary response.
     */
    private function sendNotifications($users, string $title, string $message, string $type, ?string $recipientType = null): JsonResponse
    {
        $sentCount = 0;
        $errors = [];

        foreach ($users as $user) {
            try {
                $user->notify(new \App\Notifications\AdminNotification($title, $message, $type));
                $sentCount++;
            } catch (\Exception $e) {
                $errors[] = "Failed to send to {$user->email}: " . $e->getMessage();
            }
        }

        $data = [
            'sent_count' => $sentCount,
            'total_users' => $users->count(),
            'errors' => $errors,
        ];
        if ($recipientType) {
            $data['recipient_type'] = $recipientType;
        }

        $msg = "Notification sent to {$sentCount} user(s)";
        if (!empty($errors)) {
            $msg .= ". Errors: " . implode(', ', $errors);
        }

        return $this->successResponse($data, $msg);
    }
}
