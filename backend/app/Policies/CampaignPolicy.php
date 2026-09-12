<?php

namespace App\Policies;

use App\Models\Campaign;
use App\Models\User;

class CampaignPolicy
{
    /**
     * Determine whether the user can view any campaigns.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the campaign.
     */
    public function view(User $user, Campaign $campaign): bool
    {
        return $user->hasRole('admin') || $campaign->user_id === $user->id;
    }

    /**
     * Determine whether the user can create campaigns.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the campaign.
     */
    public function update(User $user, Campaign $campaign): bool
    {
        return $user->hasRole('admin') || $campaign->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the campaign.
     */
    public function delete(User $user, Campaign $campaign): bool
    {
        return $user->hasRole('admin') || $campaign->user_id === $user->id;
    }

    /**
     * Determine whether the user can start/pause/resume/stop the campaign.
     */
    public function manage(User $user, Campaign $campaign): bool
    {
        return $user->hasRole('admin') || $campaign->user_id === $user->id;
    }

    /**
     * Determine whether the user can duplicate the campaign.
     */
    public function duplicate(User $user, Campaign $campaign): bool
    {
        return $user->hasRole('admin') || $campaign->user_id === $user->id;
    }
}
