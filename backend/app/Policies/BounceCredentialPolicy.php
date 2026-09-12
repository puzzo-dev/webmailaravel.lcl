<?php

namespace App\Policies;

use App\Models\BounceCredential;
use App\Models\User;

class BounceCredentialPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, BounceCredential $credential): bool
    {
        return $user->hasRole('admin') || $credential->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, BounceCredential $credential): bool
    {
        return $user->hasRole('admin') || $credential->user_id === $user->id;
    }

    public function delete(User $user, BounceCredential $credential): bool
    {
        return $user->hasRole('admin') || $credential->user_id === $user->id;
    }

    public function testConnection(User $user, BounceCredential $credential): bool
    {
        return $user->hasRole('admin') || $credential->user_id === $user->id;
    }

    public function setAsDefault(User $user, BounceCredential $credential): bool
    {
        return $user->hasRole('admin') || $credential->user_id === $user->id;
    }
}
