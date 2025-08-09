<?php

namespace App\Traits;

use App\Models\UserActivity;
use Illuminate\Support\Facades\Auth;

trait ActivityLoggingTrait
{
    /**
     * Log user activity
     */
    protected function logUserActivity(
        string $activityType,
        string $description,
        ?string $entityType = null,
        ?int $entityId = null,
        array $metadata = []
    ): ?UserActivity {
        if (!Auth::check()) {
            return null;
        }

        return UserActivity::logActivity(
            Auth::id(),
            $activityType,
            $description,
            $entityType,
            $entityId,
            $metadata
        );
    }

    /**
     * Log campaign activity
     */
    protected function logCampaignActivity(string $action, $campaign, array $metadata = []): ?UserActivity
    {
        $descriptions = [
            'created' => "Created campaign '{$campaign->name}'",
            'updated' => "Updated campaign '{$campaign->name}'",
            'sent' => "Sent campaign '{$campaign->name}'",
            'completed' => "Campaign '{$campaign->name}' completed successfully",
            'failed' => "Campaign '{$campaign->name}' failed",
            'paused' => "Paused campaign '{$campaign->name}'",
            'resumed' => "Resumed campaign '{$campaign->name}'",
            'deleted' => "Deleted campaign '{$campaign->name}'"
        ];

        return $this->logUserActivity(
            "campaign_{$action}",
            $descriptions[$action] ?? "Campaign {$action}: {$campaign->name}",
            'campaign',
            $campaign->id,
            array_merge($metadata, [
                'campaign_name' => $campaign->name,
                'campaign_status' => $campaign->status
            ])
        );
    }

    /**
     * Log authentication activity
     */
    protected function logAuthActivity(string $action, array $metadata = []): ?UserActivity
    {
        $descriptions = [
            'login' => 'User logged in',
            'logout' => 'User logged out',
            'register' => 'User registered',
            'password_reset' => 'Password reset requested',
            'password_changed' => 'Password changed',
            'profile_updated' => 'Profile updated'
        ];

        return $this->logUserActivity(
            $action,
            $descriptions[$action] ?? "Auth action: {$action}",
            'user',
            Auth::id(),
            $metadata
        );
    }

    /**
     * Log subscription activity
     */
    protected function logSubscriptionActivity(string $action, $subscription, array $metadata = []): ?UserActivity
    {
        $descriptions = [
            'created' => "Subscribed to plan '{$subscription->plan->name}'",
            'updated' => "Updated subscription to plan '{$subscription->plan->name}'",
            'cancelled' => "Cancelled subscription to plan '{$subscription->plan->name}'",
            'renewed' => "Renewed subscription to plan '{$subscription->plan->name}'"
        ];

        return $this->logUserActivity(
            "subscription_{$action}",
            $descriptions[$action] ?? "Subscription {$action}",
            'subscription',
            $subscription->id,
            array_merge($metadata, [
                'plan_name' => $subscription->plan->name,
                'subscription_status' => $subscription->status
            ])
        );
    }

    /**
     * Log domain activity
     */
    protected function logDomainActivity(string $action, $domain, array $metadata = []): ?UserActivity
    {
        $descriptions = [
            'added' => "Added domain '{$domain->domain}'",
            'verified' => "Verified domain '{$domain->domain}'",
            'updated' => "Updated domain '{$domain->domain}'",
            'deleted' => "Deleted domain '{$domain->domain}'"
        ];

        return $this->logUserActivity(
            "domain_{$action}",
            $descriptions[$action] ?? "Domain {$action}: {$domain->domain}",
            'domain',
            $domain->id,
            array_merge($metadata, [
                'domain_name' => $domain->domain,
                'domain_status' => $domain->status
            ])
        );
    }

    /**
     * Log sender activity
     */
    protected function logSenderActivity(string $action, $sender, array $metadata = []): ?UserActivity
    {
        $descriptions = [
            'added' => "Added sender '{$sender->email}'",
            'verified' => "Verified sender '{$sender->email}'",
            'updated' => "Updated sender '{$sender->email}'",
            'deleted' => "Deleted sender '{$sender->email}'"
        ];

        return $this->logUserActivity(
            "sender_{$action}",
            $descriptions[$action] ?? "Sender {$action}: {$sender->email}",
            'sender',
            $sender->id,
            array_merge($metadata, [
                'sender_email' => $sender->email,
                'sender_status' => $sender->status
            ])
        );
    }

    /**
     * Log suppression activity
     */
    protected function logSuppressionActivity(string $action, array $metadata = []): ?UserActivity
    {
        $descriptions = [
            'added' => 'Added emails to suppression list',
            'removed' => 'Removed emails from suppression list',
            'imported' => 'Imported suppression list',
            'exported' => 'Exported suppression list'
        ];

        return $this->logUserActivity(
            "suppression_{$action}",
            $descriptions[$action] ?? "Suppression {$action}",
            'suppression',
            null,
            $metadata
        );
    }

    /**
     * Log bounce processing activity
     */
    protected function logBounceActivity(string $action, array $metadata = []): ?UserActivity
    {
        $descriptions = [
            'processed' => 'Processed bounce emails',
            'credential_added' => 'Added bounce processing credential',
            'credential_updated' => 'Updated bounce processing credential',
            'credential_deleted' => 'Deleted bounce processing credential'
        ];

        return $this->logUserActivity(
            "bounce_{$action}",
            $descriptions[$action] ?? "Bounce {$action}",
            'bounce_processing',
            null,
            $metadata
        );
    }
}
