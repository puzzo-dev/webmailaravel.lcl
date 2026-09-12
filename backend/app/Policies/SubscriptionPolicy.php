<?php

namespace App\Policies;

use App\Models\Subscription;
use App\Models\User;

class SubscriptionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function view(User $user, Subscription $subscription): bool
    {
        return $user->hasRole('admin') || $subscription->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Subscription $subscription): bool
    {
        return $user->hasRole('admin') || $subscription->user_id === $user->id;
    }

    public function delete(User $user, Subscription $subscription): bool
    {
        return $user->hasRole('admin') || $subscription->user_id === $user->id;
    }

    public function renew(User $user, Subscription $subscription): bool
    {
        return $user->hasRole('admin') || $subscription->user_id === $user->id;
    }

    public function createInvoice(User $user, Subscription $subscription): bool
    {
        return $user->hasRole('admin') || $subscription->user_id === $user->id;
    }

    public function processManualPayment(User $user, Subscription $subscription): bool
    {
        return $user->hasRole('admin');
    }
}
