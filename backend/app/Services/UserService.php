<?php

namespace App\Services;

use App\Models\Device;
use App\Models\User;
use App\Models\UserActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UserService
{
    /**
     * Create a new user with location data.
     */
    public function createUser(array $data, ?string $ip = null, ?array $location = null): User
    {
        $data['password'] = Hash::make($data['password']);

        if ($location) {
            $data['country'] = $location['country'] ?? null;
            $data['city'] = $location['city'] ?? null;
        }

        return User::create($data);
    }

    /**
     * Update a user with validated data.
     */
    public function updateUser(User $user, array $data): User
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        Log::info('User updated', [
            'updated_by' => auth()->id(),
            'user_id' => $user->id,
            'updated_fields' => array_keys($data),
        ]);

        return $user->fresh();
    }

    /**
     * Delete a user.
     */
    public function deleteUser(User $user): void
    {
        Log::info('User deleted', [
            'deleted_by' => auth()->id(),
            'deleted_user_id' => $user->id,
        ]);

        $user->delete();
    }

    /**
     * Add a device to a user (max 2 devices enforced).
     */
    public function addDevice(User $user, array $data): Device
    {
        if ($user->devices()->count() >= 2) {
            throw new \InvalidArgumentException('Maximum device limit reached (2 devices)');
        }

        $device = $user->devices()->create($data);

        Log::info('Device added', [
            'user_id' => $user->id,
            'device_id' => $device->id,
            'device_name' => $device->device_name,
        ]);

        return $device;
    }

    /**
     * Remove a device from a user.
     */
    public function removeDevice(User $user, Device $device): void
    {
        if ($device->user_id !== $user->id) {
            throw new \InvalidArgumentException('Access denied to device');
        }

        $device->delete();

        Log::info('Device removed', [
            'user_id' => $user->id,
            'device_id' => $device->id,
        ]);
    }

    /**
     * Get user settings grouped by category.
     */
    public function getSettings(User $user): array
    {
        return [
            'general' => [
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'country' => $user->country,
                'city' => $user->city,
            ],
            'notifications' => [
                'telegram_notifications_enabled' => $user->telegram_notifications_enabled,
            ],
            'security' => [
                'two_factor_enabled' => $user->two_factor_enabled,
            ],
            'telegram' => [
                'telegram_chat_id' => $user->telegram_chat_id,
                'telegram_verified_at' => $user->telegram_verified_at,
            ],
        ];
    }

    /**
     * Update general settings for a user.
     */
    public function updateGeneralSettings(User $user, array $data): User
    {
        $user->update($data);
        return $user->fresh();
    }

    /**
     * Update notification settings for a user.
     */
    public function updateNotificationSettings(User $user, array $data): User
    {
        if (isset($data['email_notifications_enabled'])) {
            $user->email_notifications_enabled = $data['email_notifications_enabled'];
        }

        if (isset($data['telegram_notifications_enabled'])) {
            $user->telegram_notifications_enabled = $data['telegram_notifications_enabled'];
        }

        if (isset($data['telegram_chat_id'])) {
            $user->telegram_chat_id = $data['telegram_chat_id'];
        }

        if (isset($data['notification_preferences'])) {
            $currentPreferences = $user->notification_preferences ?? [];
            $user->notification_preferences = array_merge($currentPreferences, $data['notification_preferences']);
        }

        $user->save();

        Log::info('User notification settings updated', [
            'user_id' => $user->id,
            'email_enabled' => $user->email_notifications_enabled,
            'telegram_enabled' => $user->telegram_notifications_enabled,
        ]);

        return $user->fresh();
    }

    /**
     * Update Telegram settings for a user.
     */
    public function updateTelegramSettings(User $user, array $data): User
    {
        $user->update($data);
        return $user->fresh();
    }

    /**
     * Test Telegram connection by sending a test message.
     */
    public function testTelegram(string $chatId, string $message = 'Test message from WebMail system'): array
    {
        $botToken = \App\Models\SystemConfig::get('TELEGRAM_BOT_TOKEN')
            ?: config('services.telegram.bot_token');

        if (!$botToken) {
            throw new \RuntimeException('Telegram bot token is not configured');
        }

        $response = Http::timeout(10)->post("https://api.telegram.org/bot{$botToken}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'HTML',
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Telegram API error: ' . $response->body());
        }

        return ['success' => true, 'message' => 'Telegram test message sent successfully'];
    }

    /**
     * Get activities for a user.
     */
    public function getActivities(User $user, int $limit = 50): array
    {
        return UserActivity::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn ($activity) => [
                'id' => $activity->id,
                'type' => $activity->activity_type,
                'description' => $activity->activity_description,
                'metadata' => $activity->metadata ?? [],
                'created_at' => $activity->created_at->toISOString(),
            ])
            ->toArray();
    }

    /**
     * Get a specific activity for a user.
     */
    public function getActivity(User $user, int $id): ?array
    {
        $activity = UserActivity::where('user_id', $user->id)
            ->where('id', $id)
            ->first();

        if (!$activity) {
            return null;
        }

        return [
            'id' => $activity->id,
            'type' => $activity->activity_type,
            'description' => $activity->activity_description,
            'metadata' => $activity->metadata ?? [],
            'created_at' => $activity->created_at->toISOString(),
        ];
    }

    /**
     * Log a new activity for a user.
     */
    public function createActivity(User $user, string $type, string $description, ?array $metadata = null): UserActivity
    {
        return UserActivity::logActivity(
            $user->id,
            $type,
            $description,
            null,
            null,
            $metadata ?? []
        );
    }

    /**
     * Get activity statistics for a user.
     */
    public function getActivityStats(User $user): array
    {
        $totalActivities = UserActivity::where('user_id', $user->id)->count();
        $activitiesThisWeek = UserActivity::where('user_id', $user->id)
            ->where('created_at', '>=', now()->subWeek())
            ->count();
        $activitiesThisMonth = UserActivity::where('user_id', $user->id)
            ->where('created_at', '>=', now()->subMonth())
            ->count();

        $activityTypes = UserActivity::where('user_id', $user->id)
            ->selectRaw('activity_type, COUNT(*) as count')
            ->groupBy('activity_type')
            ->pluck('count', 'activity_type')
            ->toArray();

        $mostFrequentType = null;
        if (!empty($activityTypes)) {
            $mostFrequentType = array_keys($activityTypes, max($activityTypes))[0] ?? null;
        }

        return [
            'total_activities' => $totalActivities,
            'activities_this_week' => $activitiesThisWeek,
            'activities_this_month' => $activitiesThisMonth,
            'most_frequent_type' => $mostFrequentType,
            'activity_types' => $activityTypes,
        ];
    }
}
