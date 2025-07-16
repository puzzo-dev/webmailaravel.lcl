<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Display a listing of notifications
     */
    public function index(Request $request): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess(Auth::user(), 'user'),
            function () use ($request) {
                $notifications = Auth::user()->notifications()
                    ->orderBy('created_at', 'desc')
                    ->paginate($request->get('limit', 20));
                
                return $this->successResponse($notifications, 'Notifications retrieved successfully');
            },
            'view_notifications'
        );
    }

    /**
     * Display the specified notification
     */
    public function show(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $notification = Notification::findOrFail($id);
            
            if ($notification->user_id !== Auth::id()) {
                return $this->forbiddenResponse('Access denied to notification');
            }
            
            return $this->successResponse($notification, 'Notification retrieved successfully');
        }, 'view_notification');
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess(Auth::user(), 'user'),
            function () use ($notification) {
                if ($notification->user_id !== Auth::id()) {
                    return $this->forbiddenResponse('Access denied to notification');
                }
                
                $notification->update(['read_at' => now()]);
                
                return $this->successResponse($notification, 'Notification marked as read');
            },
            'mark_notification_read'
        );
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): JsonResponse
    {
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess(Auth::user(), 'user'),
            function () {
                Auth::user()->notifications()
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
                
                return $this->successResponse(null, 'All notifications marked as read');
            },
            'mark_all_notifications_read'
        );
    }

    /**
     * Remove the specified notification
     */
    public function destroy(string $id): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($id) {
            $notification = Notification::findOrFail($id);
            
            if ($notification->user_id !== Auth::id()) {
                return $this->forbiddenResponse('Access denied to notification');
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
        return $this->authorizeAndExecute(
            fn() => $this->authorizeResourceAccess(Auth::user(), 'user'),
            function () {
                Auth::user()->notifications()->delete();
                
                return $this->successResponse(null, 'All notifications deleted successfully');
            },
            'delete_all_notifications'
        );
    }
} 