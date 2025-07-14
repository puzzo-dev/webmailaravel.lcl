<?php

namespace App\Services;

use App\Models\User;
use App\Models\Device;
use App\Notifications\DeviceLimitExceeded;
use App\Notifications\NewDeviceDetected;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DeviceService
{
    /**
     * Register a new device for a user
     */
    public function registerDevice(User $user, string $deviceName, string $ipAddress): ?Device
    {
        try {
            // Check device limit (max 2 devices per user)
            $deviceCount = $user->devices()->count();
            
            if ($deviceCount >= 2) {
                // Remove oldest device
                $oldestDevice = $user->devices()->orderBy('created_at', 'asc')->first();
                if ($oldestDevice) {
                    $oldestDevice->delete();
                    
                    // Notify user about device limit
                    $user->notify(new DeviceLimitExceeded($oldestDevice));
                }
            }

            // Create new device
            $device = Device::create([
                'user_id' => $user->id,
                'device_id' => Str::uuid(),
                'device_name' => $deviceName,
                'ip_address' => $ipAddress,
                'last_seen' => now(),
            ]);

            // Notify user about new device
            $user->notify(new NewDeviceDetected($device));

            Log::info('Device registered', [
                'user_id' => $user->id,
                'device_id' => $device->device_id,
                'device_name' => $deviceName,
                'ip_address' => $ipAddress
            ]);

            return $device;

        } catch (\Exception $e) {
            Log::error('Device registration failed', [
                'user_id' => $user->id,
                'device_name' => $deviceName,
                'error' => $e->getMessage()
            ]);

            return null;
        }
    }

    /**
     * Update device last seen timestamp
     */
    public function updateDeviceActivity(string $deviceId): bool
    {
        try {
            $device = Device::where('device_id', $deviceId)->first();
            
            if ($device) {
                $device->update(['last_seen' => now()]);
                return true;
            }

            return false;

        } catch (\Exception $e) {
            Log::error('Device activity update failed', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Remove device
     */
    public function removeDevice(User $user, string $deviceId): bool
    {
        try {
            $device = $user->devices()->where('device_id', $deviceId)->first();
            
            if ($device) {
                $device->delete();
                
                Log::info('Device removed', [
                    'user_id' => $user->id,
                    'device_id' => $deviceId
                ]);

                return true;
            }

            return false;

        } catch (\Exception $e) {
            Log::error('Device removal failed', [
                'user_id' => $user->id,
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Get user's active devices
     */
    public function getUserDevices(User $user): array
    {
        return $user->devices()
            ->orderBy('last_seen', 'desc')
            ->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'device_id' => $device->device_id,
                    'device_name' => $device->device_name,
                    'ip_address' => $device->ip_address,
                    'last_seen' => $device->last_seen,
                    'is_active' => $device->last_seen->isAfter(now()->subMinutes(5)),
                ];
            })
            ->toArray();
    }

    /**
     * Check if user has reached device limit
     */
    public function hasReachedDeviceLimit(User $user): bool
    {
        return $user->devices()->count() >= 2;
    }

    /**
     * Get device by ID
     */
    public function getDevice(string $deviceId): ?Device
    {
        return Device::where('device_id', $deviceId)->first();
    }

    /**
     * Clean up inactive devices (older than 30 days)
     */
    public function cleanupInactiveDevices(): int
    {
        $cutoff = now()->subDays(30);
        $removedCount = Device::where('last_seen', '<', $cutoff)->delete();
        
        Log::info('Inactive devices cleaned up', ['count' => $removedCount]);
        
        return $removedCount;
    }
} 
 
 
 
 
 