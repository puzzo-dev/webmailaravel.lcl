<?php

namespace App\Services;

use App\Models\User;
use App\Models\Device;
use App\Models\Session;
use App\Models\SystemConfig;
use App\Models\TrainingConfig;
use App\Models\Campaign;
use App\Models\Domain;
use App\Models\Sender;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;
use App\Traits\CacheManagementTrait;
use Illuminate\Support\Facades\Http;
use App\Traits\FileProcessingTrait;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class AdminService
{
    use LoggingTrait, ValidationTrait, CacheManagementTrait, FileProcessingTrait;

    /**
     * Get system statistics
     */
    public function getSystemStatistics(): array
    {
        $this->logMethodEntry(__METHOD__);

        $stats = [
            'users' => [
                'total' => User::count(),
                'active' => User::where('is_active', true)->count(),
                'online' => Session::where('last_active', '>=', now()->subMinutes(5))->count(),
                'new_today' => User::whereDate('created_at', today())->count()
            ],
            'campaigns' => [
                'total' => Campaign::count(),
                'active' => Campaign::where('status', 'RUNNING')->count(),
                'completed' => Campaign::where('status', 'COMPLETED')->count(),
                'draft' => Campaign::where('status', 'DRAFT')->count()
            ],
            'domains' => [
                'total' => Domain::count(),
                'active' => Domain::where('is_active', true)->count()
            ],
            'senders' => [
                'total' => Sender::count(),
                'active' => Sender::where('is_active', true)->count()
            ],
            'training' => [
                'total_configs' => TrainingConfig::count(),
                'active_configs' => TrainingConfig::where('is_active', true)->count(),
                'needs_analysis' => TrainingConfig::active()->needsAnalysis()->count()
            ],
            'system' => [
                'disk_usage' => $this->getDiskUsage(),
                'memory_usage' => $this->getMemoryUsage(),
                'queue_size' => $this->getQueueSize()
            ]
        ];

        $this->logMethodExit(__METHOD__, $stats);
        return $stats;
    }

    /**
     * Get user management data
     */
    public function getUsersData(array $filters = []): array
    {
        $query = User::with(['devices', 'campaigns', 'subscriptions']);

        // Apply filters
        if (isset($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (isset($filters['status'])) {
            $query->where('is_active', $filters['status'] === 'active');
        }

        if (isset($filters['search'])) {
            $query->where('email', 'like', '%' . $filters['search'] . '%');
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(20);

        return [
            'users' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total()
            ]
        ];
    }

    /**
     * Create admin user
     */
    public function createAdminUser(string $email, string $password, array $additionalData = []): array
    {
        $this->logMethodEntry(__METHOD__, ['email' => $email]);

        try {
            // Validate email
            if (!$this->validateEmail($email)) {
                return [
                    'success' => false,
                    'error' => 'Invalid email address'
                ];
            }

            // Check if user already exists
            if (User::where('email', $email)->exists()) {
                return [
                    'success' => false,
                    'error' => 'User with this email already exists'
                ];
            }

            // Create user
            $user = User::create([
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'admin',
                'is_active' => true,
                'country' => $additionalData['country'] ?? null,
                'city' => $additionalData['city'] ?? null
            ]);

            // Assign admin role and permissions
            $user->assignRole('admin');
            $this->assignAdminPermissions($user);

            $this->logInfo('Admin user created', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return [
                'success' => true,
                'user' => $user,
                'message' => 'Admin user created successfully'
            ];

        } catch (\Exception $e) {
            $this->logError('Failed to create admin user', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to create admin user: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update user
     */
    public function updateUser(int $userId, array $data): array
    {
        $this->logMethodEntry(__METHOD__, ['user_id' => $userId]);

        try {
            $user = User::findOrFail($userId);

            $updateData = [];
            
            if (isset($data['email'])) {
                $updateData['email'] = $data['email'];
            }

            if (isset($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            if (isset($data['role'])) {
                $updateData['role'] = $data['role'];
            }

            if (isset($data['is_active'])) {
                $updateData['is_active'] = $data['is_active'];
            }

            $user->update($updateData);

            $this->logInfo('User updated', [
                'user_id' => $userId,
                'updated_fields' => array_keys($updateData)
            ]);

            return [
                'success' => true,
                'user' => $user,
                'message' => 'User updated successfully'
            ];

        } catch (\Exception $e) {
            $this->logError('Failed to update user', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to update user: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete user
     */
    public function deleteUser(int $userId): array
    {
        $this->logMethodEntry(__METHOD__, ['user_id' => $userId]);

        try {
            $user = User::findOrFail($userId);

            // Don't allow deletion of the last admin
            if ($user->role === 'admin' && User::where('role', 'admin')->count() <= 1) {
                return [
                    'success' => false,
                    'error' => 'Cannot delete the last admin user'
                ];
            }

            $user->delete();

            $this->logInfo('User deleted', [
                'user_id' => $userId,
                'email' => $user->email
            ]);

            return [
                'success' => true,
                'message' => 'User deleted successfully'
            ];

        } catch (\Exception $e) {
            $this->logError('Failed to delete user', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to delete user: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get user devices
     */
    public function getUserDevices(int $userId): array
    {
        $user = User::findOrFail($userId);
        $devices = $user->devices()->orderBy('last_seen', 'desc')->get();

        return [
            'success' => true,
            'devices' => $devices,
            'total_devices' => $devices->count()
        ];
    }

    /**
     * Remove user device
     */
    public function removeUserDevice(int $userId, int $deviceId): array
    {
        try {
            $device = Device::where('user_id', $userId)
                ->where('id', $deviceId)
                ->firstOrFail();

            $device->delete();

            $this->logInfo('User device removed', [
                'user_id' => $userId,
                'device_id' => $deviceId
            ]);

            return [
                'success' => true,
                'message' => 'Device removed successfully'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to remove device: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get system configurations
     */
    public function getSystemConfigs(): array
    {
        $configs = SystemConfig::all()->keyBy('key');
        
        return [
            'success' => true,
            'configs' => $configs
        ];
    }

    /**
     * Update system configuration
     */
    public function updateSystemConfig(string $key, string $value, string $description = null): array
    {
        try {
            SystemConfig::setValue($key, $value, $description);

            $this->logInfo('System config updated', [
                'key' => $key,
                'value' => $value
            ]);

            return [
                'success' => true,
                'message' => 'Configuration updated successfully'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to update configuration: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get online users
     */
    public function getOnlineUsers(): array
    {
        $onlineUsers = Session::with('user')
            ->where('last_active', '>=', now()->subMinutes(5))
            ->get()
            ->pluck('user')
            ->unique('id')
            ->values();

        return [
            'success' => true,
            'users' => $onlineUsers,
            'count' => $onlineUsers->count()
        ];
    }

    /**
     * Force logout user
     */
    public function forceLogoutUser(int $userId): array
    {
        try {
            // Delete all sessions for the user
            Session::where('user_id', $userId)->delete();

            $this->logInfo('User force logged out', [
                'user_id' => $userId
            ]);

            return [
                'success' => true,
                'message' => 'User logged out successfully'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to logout user: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get disk usage
     */
    protected function getDiskUsage(): array
    {
        $totalSpace = disk_total_space(storage_path());
        $freeSpace = disk_free_space(storage_path());
        $usedSpace = $totalSpace - $freeSpace;
        $usagePercentage = ($usedSpace / $totalSpace) * 100;

        return [
            'total' => $this->formatBytes($totalSpace),
            'used' => $this->formatBytes($usedSpace),
            'free' => $this->formatBytes($freeSpace),
            'percentage' => round($usagePercentage, 2)
        ];
    }

    /**
     * Get memory usage
     */
    protected function getMemoryUsage(): array
    {
        $memoryLimit = ini_get('memory_limit');
        $memoryUsage = memory_get_usage(true);
        $peakMemory = memory_get_peak_usage(true);

        return [
            'limit' => $memoryLimit,
            'current' => $this->formatBytes($memoryUsage),
            'peak' => $this->formatBytes($peakMemory)
        ];
    }

    /**
     * Get queue size
     */
    protected function getQueueSize(): int
    {
        return DB::table('jobs')->count();
    }

    /**
     * Format bytes to human readable format
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, 2) . ' ' . $units[$pow];
    }
} 