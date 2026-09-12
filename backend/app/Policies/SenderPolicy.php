<?php

namespace App\Policies;

use App\Models\Sender;
use App\Models\User;

class SenderPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Sender $sender): bool
    {
        return $user->hasRole('admin') || $sender->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Sender $sender): bool
    {
        return $user->hasRole('admin') || $sender->user_id === $user->id;
    }

    public function delete(User $user, Sender $sender): bool
    {
        return $user->hasRole('admin') || $sender->user_id === $user->id;
    }

    public function testConnection(User $user, Sender $sender): bool
    {
        return $user->hasRole('admin') || $sender->user_id === $user->id;
    }
}
