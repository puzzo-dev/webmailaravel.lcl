<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any users (admin only).
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can view the given user.
     */
    public function view(User $user, User $targetUser): bool
    {
        return $user->hasRole('admin') || $user->id === $targetUser->id;
    }

    /**
     * Determine whether the user can create users.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can update the given user.
     */
    public function update(User $user, User $targetUser): bool
    {
        return $user->hasRole('admin') || $user->id === $targetUser->id;
    }

    /**
     * Determine whether the user can delete the given user.
     */
    public function delete(User $user, User $targetUser): bool
    {
        // Admin can delete anyone except themselves; users can delete themselves
        if ($user->hasRole('admin')) {
            return $user->id !== $targetUser->id;
        }
        return $user->id === $targetUser->id;
    }
}
