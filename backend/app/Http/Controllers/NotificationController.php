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
        return $this->executeWithErrorHandling(function () use ($request) {
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
} 