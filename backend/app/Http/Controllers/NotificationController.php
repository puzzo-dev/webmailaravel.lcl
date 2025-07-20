<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use App\Traits\ResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    use ResponseTrait;
    /**
     * Display a listing of notifications
     */
    public function index(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            // Check if user is admin
            if (Auth::user()->hasRole('admin')) {
                // Admin sees all notifications
                $notifications = Notification::orderBy('created_at', 'desc')
                    ->paginate($request->get('limit', 20));
                
                // Transform notifications to include computed fields
                $transformedNotifications = $notifications->getCollection()->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'title' => $notification->data['title'] ?? 'Notification',
                        'message' => $notification->data['message'] ?? '',
                        'notification_type' => $notification->data['type'] ?? 'info',
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at,
                        'updated_at' => $notification->updated_at,
                        'user_id' => $notification->notifiable_id,
                        'user_email' => $notification->notifiable->email ?? 'Unknown',
                    ];
                });
                
                $notifications->setCollection($transformedNotifications);
                
                return $this->successResponse($notifications, 'All notifications retrieved successfully');
            } else {
                // Regular users see only their notifications
                $notifications = Auth::user()->notifications()
                    ->orderBy('created_at', 'desc')
                    ->paginate($request->get('limit', 20));
                
                // Transform notifications to include computed fields
                $transformedNotifications = $notifications->getCollection()->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'title' => $notification->data['title'] ?? 'Notification',
                        'message' => $notification->data['message'] ?? '',
                        'notification_type' => $notification->data['type'] ?? 'info',
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at,
                        'updated_at' => $notification->updated_at,
                    ];
                });
                
                $notifications->setCollection($transformedNotifications);
                
                return $this->successResponse($notifications, 'Notifications retrieved successfully');
            }
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
            
            $transformedNotification = [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->data['title'] ?? 'Notification',
                'message' => $notification->data['message'] ?? '',
                'notification_type' => $notification->data['type'] ?? 'info',
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
                'updated_at' => $notification->updated_at,
            ];
            
            return $this->successResponse($transformedNotification, 'Notification retrieved successfully');
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
            
            $transformedNotification = [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->data['title'] ?? 'Notification',
                'message' => $notification->data['message'] ?? '',
                'notification_type' => $notification->data['type'] ?? 'info',
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
                'updated_at' => $notification->updated_at,
            ];
            
            return $this->successResponse($transformedNotification, 'Notification marked as read');
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
            // Check if user is admin
            if (!Auth::user()->hasRole('admin')) {
                return $this->errorResponse('Admin access required', 403);
            }

            $request->validate([
                'user_id' => 'required|exists:users,id',
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'type' => 'nullable|string|in:info,warning,error,success',
            ]);

            $user = \App\Models\User::find($request->user_id);
            
            $notification = $user->notifications()->create([
                'id' => \Illuminate\Support\Str::uuid(),
                'type' => 'App\Notifications\CustomNotification',
                'data' => [
                    'title' => $request->title,
                    'message' => $request->message,
                    'type' => $request->type ?? 'info',
                ],
            ]);
            
            $transformedNotification = [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->data['title'] ?? 'Notification',
                'message' => $notification->data['message'] ?? '',
                'notification_type' => $notification->data['type'] ?? 'info',
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
                'updated_at' => $notification->updated_at,
                'user_id' => $notification->notifiable_id,
                'user_email' => $user->email,
            ];
            
            return $this->successResponse($transformedNotification, 'Notification created successfully');
        }, 'create_notification');
    }
} 