<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

trait ControllerAuthorizationTrait
{
    /**
     * Check if user can access resource
     */
    protected function canAccessResource($resource, User $user = null): bool
    {
        $user = $user ?? Auth::user();
        
        if (!$user) {
            return false;
        }

        // Admin can access everything
        if ($user->role === 'admin') {
            return true;
        }

        // Check if resource belongs to user
        if (isset($resource->user_id)) {
            return $resource->user_id === $user->id;
        }

        // Check if resource has user relationship
        if (method_exists($resource, 'user')) {
            return $resource->user->id === $user->id;
        }

        return false;
    }

    /**
     * Check if user can access resource or return error response
     */
    protected function authorizeResourceAccess($resource, User $user = null): JsonResponse|null
    {
        if (!$this->canAccessResource($resource, $user)) {
            $this->logAuthorizationFailure('resource_access', 'User does not have permission to access this resource');
            return $this->forbiddenResponse('You do not have permission to access this resource');
        }

        return null; // No error
    }

    /**
     * Check if user is admin
     */
    protected function isAdmin(User $user = null): bool
    {
        $user = $user ?? Auth::user();
        return $user && $user->role === 'admin';
    }

    /**
     * Check if user is admin or return error response
     */
    protected function authorizeAdmin(User $user = null): JsonResponse|null
    {
        if (!$this->isAdmin($user)) {
            $this->logAuthorizationFailure('admin_access', 'User is not an admin');
            return $this->forbiddenResponse('Admin access required');
        }

        return null; // No error
    }

    /**
     * Check if user can perform action
     */
    protected function canPerformAction(string $action, User $user = null): bool
    {
        $user = $user ?? Auth::user();
        
        if (!$user) {
            return false;
        }

        // Admin can perform all actions
        if ($user->role === 'admin') {
            return true;
        }

        // Check user permissions
        return $user->hasPermissionTo($action);
    }

    /**
     * Check if user can perform action or return error response
     */
    protected function authorizeAction(string $action, User $user = null): JsonResponse|null
    {
        if (!$this->canPerformAction($action, $user)) {
            $this->logAuthorizationFailure('action_permission', "User does not have permission to perform: {$action}");
            return $this->forbiddenResponse("You do not have permission to perform this action");
        }

        return null; // No error
    }

    /**
     * Check if user owns the resource
     */
    protected function ownsResource($resource, User $user = null): bool
    {
        $user = $user ?? Auth::user();
        
        if (!$user) {
            return false;
        }

        // Admin owns everything
        if ($user->role === 'admin') {
            return true;
        }

        // Check if resource belongs to user
        if (isset($resource->user_id)) {
            return $resource->user_id === $user->id;
        }

        return false;
    }

    /**
     * Check if user owns the resource or return error response
     */
    protected function authorizeOwnership($resource, User $user = null): JsonResponse|null
    {
        if (!$this->ownsResource($resource, $user)) {
            $this->logAuthorizationFailure('resource_ownership', 'User does not own this resource');
            return $this->forbiddenResponse('You do not own this resource');
        }

        return null; // No error
    }

    /**
     * Check if user can view resource
     */
    protected function canViewResource($resource, User $user = null): bool
    {
        return $this->canAccessResource($resource, $user);
    }

    /**
     * Check if user can edit resource
     */
    protected function canEditResource($resource, User $user = null): bool
    {
        return $this->ownsResource($resource, $user);
    }

    /**
     * Check if user can delete resource
     */
    protected function canDeleteResource($resource, User $user = null): bool
    {
        return $this->ownsResource($resource, $user);
    }

    /**
     * Check if user is authenticated
     */
    protected function isAuthenticated(): bool
    {
        return Auth::check();
    }

    /**
     * Check if user is authenticated or return error response
     */
    protected function authorizeAuthentication(): JsonResponse|null
    {
        if (!$this->isAuthenticated()) {
            return $this->unauthorizedResponse('Authentication required');
        }

        return null; // No error
    }

    /**
     * Get current user or return error response
     */
    protected function getCurrentUser(): User|JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return $this->unauthorizedResponse('User not found');
        }

        return $user;
    }
} 