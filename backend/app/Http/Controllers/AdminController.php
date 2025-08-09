<?php

namespace App\Http\Controllers;

use App\Models\Analytics;
use App\Models\Campaign;
use App\Models\SystemConfig;
use App\Models\User;
use App\Traits\ResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    use ResponseTrait;

    /**
     * Get admin dashboard data
     */
    public function dashboard(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $stats = [
                'total_users' => User::count(),
                'total_campaigns' => Campaign::count(),
                'active_campaigns' => Campaign::where('status', 'active')->count(),
                'total_emails_sent' => Campaign::sum('emails_sent'),
                'total_opens' => Campaign::sum('opens'),
                'total_clicks' => Campaign::sum('clicks'),
                'avg_open_rate' => Campaign::avg('open_rate'),
                'avg_click_rate' => Campaign::avg('click_rate'),
            ];

            $recentUsers = User::latest()->take(5)->get();
            $recentCampaigns = Campaign::latest()->take(5)->get();

            return $this->successResponse([
                'stats' => $stats,
                'recent_users' => $recentUsers,
                'recent_campaigns' => $recentCampaigns,
            ], 'Dashboard data retrieved successfully');
        }, 'view_admin_dashboard');
    }

    /**
     * Get analytics data (admin only) - redirects to AnalyticsController
     */
    public function analytics(): JsonResponse
    {
        // Redirect to consolidated analytics endpoint
        $analyticsController = app(AnalyticsController::class);

        return $analyticsController->getAdminAnalytics(request());
    }

    /**
     * Get system status
     */
    public function systemStatus(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $status = [
                'database' => $this->checkDatabaseStatus(),
                'cache' => $this->checkCacheStatus(),
                'queue' => $this->checkQueueStatus(),
                'storage' => $this->checkStorageStatus(),
                'backup' => $this->getBackupStatus(),
                'memory' => $this->getMemoryUsage(),
                'disk' => $this->getDiskUsage(),
                'system' => $this->getSystemInfo(),
                'uptime' => $this->getServerUptime(),
                'cpu' => $this->getCpuUsage(),
            ];

            return $this->successResponse($status, 'System status retrieved successfully');
        }, 'view_system_status');
    }

    /**
     * Get system configuration
     */
    public function getSystemConfig(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $config = [
                'app' => config('app'),
                'mail' => config('mail'),
                'queue' => config('queue'),
                'cache' => config('cache'),
                'session' => config('session'),
                'logging' => config('logging'),
            ];

            return $this->successResponse($config, 'System configuration retrieved successfully');
        }, 'view_system_config');
    }

    /**
     * Update system configuration
     */
    public function updateSystemConfig(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied');
            }

            $validated = $request->validate([
                'config_type' => 'required|string|in:app,mail,queue,cache,session,logging',
                'config_data' => 'required|array',
            ]);

            // Update configuration logic here
            // This would typically involve updating config files or database

            return $this->successResponse(null, 'System configuration updated successfully');
        }, 'update_system_config');
    }

    /**
     * Get Telegram configuration
     */
    public function getTelegramConfig(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }

            $config = [
                'bot_token' => SystemConfig::get('TELEGRAM_BOT_TOKEN'),
                'chat_id' => SystemConfig::get('TELEGRAM_CHAT_ID'),
                'enabled' => SystemConfig::get('NOTIFICATION_TELEGRAM_ENABLED', false),
            ];

            return $this->successResponse($config, 'Telegram configuration retrieved successfully');
        }, 'view_telegram_config');
    }

    /**
     * Update Telegram configuration
     */
    public function updateTelegramConfig(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }

            $validated = $request->validate([
                'bot_token' => 'nullable|string',
                'chat_id' => 'nullable|string',
                'enabled' => 'nullable|boolean',
            ]);

            foreach ($validated as $key => $value) {
                if ($key === 'enabled') {
                    $configKey = 'NOTIFICATION_TELEGRAM_ENABLED';
                } else {
                    $configKey = 'TELEGRAM_'.strtoupper($key);
                }
                SystemConfig::set($configKey, $value);
            }

            return $this->successResponse(null, 'Telegram configuration updated successfully');
        }, 'update_telegram_config');
    }

    /**
     * Get PowerMTA configuration
     */
    public function getPowerMTAConfig(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }

            $config = [
                'base_url' => SystemConfig::get('POWERMTA_BASE_URL'),
                'api_key' => SystemConfig::get('POWERMTA_API_KEY'),
                'config_path' => SystemConfig::get('POWERMTA_CONFIG_PATH'),
                'accounting_path' => SystemConfig::get('POWERMTA_ACCOUNTING_PATH'),
                'fbl_path' => SystemConfig::get('POWERMTA_FBL_PATH'),
                'diag_path' => SystemConfig::get('POWERMTA_DIAG_PATH'),
            ];

            return $this->successResponse($config, 'PowerMTA configuration retrieved successfully');
        }, 'view_powermta_config');
    }

    /**
     * Update PowerMTA configuration
     */
    public function updatePowerMTAConfig(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }

            $validated = $request->validate([
                'base_url' => 'nullable|string',
                'api_key' => 'nullable|string',
                'config_path' => 'nullable|string',
                'accounting_path' => 'nullable|string',
                'fbl_path' => 'nullable|string',
                'diag_path' => 'nullable|string',
            ]);

            foreach ($validated as $key => $value) {
                $configKey = 'POWERMTA_'.strtoupper($key);
                SystemConfig::set($configKey, $value);
            }

            return $this->successResponse(null, 'PowerMTA configuration updated successfully');
        }, 'update_powermta_config');
    }

    /**
     * Get comprehensive system settings
     */
    public function getSystemSettings(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            // Check if user has admin role
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }

            $settings = [
                // System SMTP Settings (for notifications, not campaigns)
                'system_smtp' => [
                    'host' => SystemConfig::get('SYSTEM_SMTP_HOST', env('MAIL_HOST', 'localhost')),
                    'port' => SystemConfig::get('SYSTEM_SMTP_PORT', env('MAIL_PORT', 587)),
                    'username' => SystemConfig::get('SYSTEM_SMTP_USERNAME', env('MAIL_USERNAME', '')),
                    'password' => SystemConfig::get('SYSTEM_SMTP_PASSWORD', env('MAIL_PASSWORD', '')),
                    'encryption' => SystemConfig::get('SYSTEM_SMTP_ENCRYPTION', env('MAIL_ENCRYPTION', 'tls')),
                    'from_address' => SystemConfig::get('SYSTEM_SMTP_FROM_ADDRESS', env('MAIL_FROM_ADDRESS', 'noreply@example.com')),
                    'from_name' => SystemConfig::get('SYSTEM_SMTP_FROM_NAME', env('MAIL_FROM_NAME', 'System')),
                ],

                // Webmail Settings
                'webmail' => [
                    'url' => SystemConfig::get('WEBMAIL_URL', env('WEBMAIL_URL', '')),
                    'enabled' => SystemConfig::get('WEBMAIL_ENABLED', env('WEBMAIL_ENABLED', false)),
                ],

                // General System Settings
                'system' => [
                    'app_name' => SystemConfig::get('APP_NAME', env('APP_NAME', 'WebMail Laravel')),
                    'app_url' => SystemConfig::get('APP_URL', env('APP_URL', 'http://localhost')),
                    'timezone' => SystemConfig::get('APP_TIMEZONE', env('APP_TIMEZONE', 'UTC')),
                    'max_campaigns_per_day' => SystemConfig::get('MAX_CAMPAIGNS_PER_DAY', env('MAX_CAMPAIGNS_PER_DAY', 50)),
                    'max_recipients_per_campaign' => SystemConfig::get('MAX_RECIPIENTS_PER_CAMPAIGN', env('MAX_RECIPIENTS_PER_CAMPAIGN', 10000)),
                ],

                // Notification Settings
                'notifications' => [
                    'email_enabled' => SystemConfig::get('NOTIFICATION_EMAIL_ENABLED', env('NOTIFICATION_EMAIL_ENABLED', true)),
                    'telegram_enabled' => SystemConfig::get('NOTIFICATION_TELEGRAM_ENABLED', env('NOTIFICATION_TELEGRAM_ENABLED', false)),
                ],

                // Training Settings
                'training' => [
                    'default_mode' => SystemConfig::get('TRAINING_DEFAULT_MODE', 'manual'),
                    'allow_user_override' => SystemConfig::getBooleanValue('TRAINING_ALLOW_USER_OVERRIDE', true),
                    'automatic_threshold' => SystemConfig::getIntegerValue('TRAINING_AUTOMATIC_THRESHOLD', 100),
                    'manual_approval_required' => SystemConfig::getBooleanValue('TRAINING_MANUAL_APPROVAL_REQUIRED', false),
                ],

                // BTCPay Settings
                'btcpay' => [
                    'url' => SystemConfig::get('btcpay_url', ''),
                    'api_key' => SystemConfig::get('btcpay_api_key', ''),
                    'store_id' => SystemConfig::get('btcpay_store_id', ''),
                    'webhook_secret' => SystemConfig::get('btcpay_webhook_secret', ''),
                    'currency' => SystemConfig::get('btcpay_currency', 'USD'),
                ],
            ];

            return $this->successResponse($settings, 'System settings retrieved successfully');
        }, 'get_system_settings');
    }

    /**
     * Update comprehensive system settings
     */
    public function updateSystemSettings(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            // Check if user has admin role
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }

            $request->validate([
                // System SMTP validation
                'system_smtp.host' => 'sometimes|string|max:255',
                'system_smtp.port' => 'sometimes|integer|min:1|max:65535',
                'system_smtp.username' => 'sometimes|string|max:255',
                'system_smtp.password' => 'sometimes|string|max:255',
                'system_smtp.encryption' => ['sometimes', Rule::in(['tls', 'ssl', 'none'])],
                'system_smtp.from_address' => 'sometimes|email|max:255',
                'system_smtp.from_name' => 'sometimes|string|max:255',

                // Webmail validation
                'webmail.url' => 'sometimes|nullable|url|max:255',
                'webmail.enabled' => 'sometimes|boolean',

                // System validation
                'system.app_name' => 'sometimes|string|max:255',
                'system.app_url' => 'sometimes|url|max:255',
                'system.timezone' => 'sometimes|string|max:50',
                'system.max_campaigns_per_day' => 'sometimes|integer|min:1|max:1000',
                'system.max_recipients_per_campaign' => 'sometimes|integer|min:1|max:100000',

                // Notification validation
                'notifications.email_enabled' => 'sometimes|boolean',
                'notifications.telegram_enabled' => 'sometimes|boolean',

                // Training validation
                'training.default_mode' => 'sometimes|in:automatic,manual',
                'training.allow_user_override' => 'sometimes|boolean',
                'training.automatic_threshold' => 'sometimes|integer|min:1|max:10000',
                'training.manual_approval_required' => 'sometimes|boolean',

                // BTCPay validation
                'btcpay.url' => 'sometimes|nullable|url|max:255',
                'btcpay.api_key' => 'sometimes|nullable|string|max:255',
                'btcpay.store_id' => 'sometimes|nullable|string|max:255',
                'btcpay.webhook_secret' => 'sometimes|nullable|string|max:255',
                'btcpay.currency' => 'sometimes|string|max:10',
            ]);

            $updatedSettings = [];

            // Update system SMTP settings
            if ($request->has('system_smtp')) {
                $smtpSettings = $request->input('system_smtp');
                foreach ($smtpSettings as $key => $value) {
                    $configKey = 'SYSTEM_SMTP_'.strtoupper($key);
                    SystemConfig::set($configKey, $value);
                    $updatedSettings["system_smtp.{$key}"] = $value;
                }
            }

            // Update webmail settings
            if ($request->has('webmail')) {
                $webmailSettings = $request->input('webmail');
                foreach ($webmailSettings as $key => $value) {
                    $configKey = 'WEBMAIL_'.strtoupper($key);
                    SystemConfig::set($configKey, $value);
                    $updatedSettings["webmail.{$key}"] = $value;
                }
            }

            // Update system settings
            if ($request->has('system')) {
                $systemSettings = $request->input('system');
                foreach ($systemSettings as $key => $value) {
                    $configKey = strtoupper($key);
                    if ($key === 'max_campaigns_per_day') {
                        $configKey = 'MAX_CAMPAIGNS_PER_DAY';
                    } elseif ($key === 'max_recipients_per_campaign') {
                        $configKey = 'MAX_RECIPIENTS_PER_CAMPAIGN';
                    } elseif ($key === 'app_name') {
                        $configKey = 'APP_NAME';
                    } elseif ($key === 'app_url') {
                        $configKey = 'APP_URL';
                    } elseif ($key === 'timezone') {
                        $configKey = 'APP_TIMEZONE';
                    }
                    SystemConfig::set($configKey, $value);
                    $updatedSettings["system.{$key}"] = $value;
                }
            }

            // Update notification settings
            if ($request->has('notifications')) {
                $notificationSettings = $request->input('notifications');
                foreach ($notificationSettings as $key => $value) {
                    if ($key === 'email_enabled') {
                        $configKey = 'NOTIFICATION_EMAIL_ENABLED';
                    } elseif ($key === 'telegram_enabled') {
                        $configKey = 'NOTIFICATION_TELEGRAM_ENABLED';
                    } else {
                        $configKey = 'NOTIFICATION_'.strtoupper($key);
                    }
                    SystemConfig::set($configKey, $value);
                    $updatedSettings["notifications.{$key}"] = $value;
                }
            }

            // Update training settings
            if ($request->has('training')) {
                $trainingSettings = $request->input('training');
                foreach ($trainingSettings as $key => $value) {
                    if ($key === 'default_mode') {
                        $configKey = 'TRAINING_DEFAULT_MODE';
                    } elseif ($key === 'allow_user_override') {
                        $configKey = 'TRAINING_ALLOW_USER_OVERRIDE';
                    } elseif ($key === 'automatic_threshold') {
                        $configKey = 'TRAINING_AUTOMATIC_THRESHOLD';
                    } elseif ($key === 'manual_approval_required') {
                        $configKey = 'TRAINING_MANUAL_APPROVAL_REQUIRED';
                    } else {
                        $configKey = 'TRAINING_'.strtoupper($key);
                    }
                    SystemConfig::set($configKey, $value);
                    $updatedSettings["training.{$key}"] = $value;
                }
            }

            // Update BTCPay settings
            if ($request->has('btcpay')) {
                $btcpaySettings = $request->input('btcpay');
                foreach ($btcpaySettings as $key => $value) {
                    $configKey = 'BTCPAY_'.strtoupper($key);
                    SystemConfig::set($configKey, $value);
                    $updatedSettings["btcpay.{$key}"] = $value;
                }
            }

            return $this->successResponse($updatedSettings, 'System settings updated successfully');
        }, 'update_system_settings');
    }

    /**
     * Test system SMTP configuration
     */
    public function testSmtp(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            // Check if user has admin role
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }

            $request->validate([
                'email' => 'required|email',
            ]);

            $testEmail = $request->input('email');

            try {
                // Use system SMTP settings to send test email
                $systemSmtp = [
                    'host' => SystemConfig::get('SYSTEM_SMTP_HOST', env('MAIL_HOST')),
                    'port' => SystemConfig::get('SYSTEM_SMTP_PORT', env('MAIL_PORT')),
                    'username' => SystemConfig::get('SYSTEM_SMTP_USERNAME', env('MAIL_USERNAME')),
                    'password' => SystemConfig::get('SYSTEM_SMTP_PASSWORD', env('MAIL_PASSWORD')),
                    'encryption' => SystemConfig::get('SYSTEM_SMTP_ENCRYPTION', env('MAIL_ENCRYPTION')),
                    'from_address' => SystemConfig::get('SYSTEM_SMTP_FROM_ADDRESS', env('MAIL_FROM_ADDRESS')),
                    'from_name' => SystemConfig::get('SYSTEM_SMTP_FROM_NAME', env('MAIL_FROM_NAME')),
                ];

                // Configure mail settings temporarily
                Config::set('mail.mailers.smtp.host', $systemSmtp['host']);
                Config::set('mail.mailers.smtp.port', $systemSmtp['port']);
                Config::set('mail.mailers.smtp.username', $systemSmtp['username']);
                Config::set('mail.mailers.smtp.password', $systemSmtp['password']);
                Config::set('mail.mailers.smtp.encryption', $systemSmtp['encryption']);
                Config::set('mail.from.address', $systemSmtp['from_address']);
                Config::set('mail.from.name', $systemSmtp['from_name']);

                // Send test email
                \Mail::raw('This is a test email from your system SMTP configuration.', function ($message) use ($testEmail, $systemSmtp) {
                    $message->to($testEmail)
                        ->subject('System SMTP Test Email')
                        ->from($systemSmtp['from_address'], $systemSmtp['from_name']);
                });

                return $this->successResponse(null, 'Test email sent successfully');
            } catch (\Exception $e) {
                return $this->errorResponse('Failed to send test email: '.$e->getMessage(), 500);
            }
        }, 'test_system_smtp');
    }

    /**
     * Get environment variables that can be configured
     */
    public function getEnvVariables(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            // Check if user has admin role
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }

            $envVariables = [
                'system_smtp' => [
                    'SYSTEM_SMTP_HOST' => env('SYSTEM_SMTP_HOST', env('MAIL_HOST', '')),
                    'SYSTEM_SMTP_PORT' => env('SYSTEM_SMTP_PORT', env('MAIL_PORT', '')),
                    'SYSTEM_SMTP_USERNAME' => env('SYSTEM_SMTP_USERNAME', env('MAIL_USERNAME', '')),
                    'SYSTEM_SMTP_PASSWORD' => env('SYSTEM_SMTP_PASSWORD', env('MAIL_PASSWORD', '')),
                    'SYSTEM_SMTP_ENCRYPTION' => env('SYSTEM_SMTP_ENCRYPTION', env('MAIL_ENCRYPTION', '')),
                    'SYSTEM_SMTP_FROM_ADDRESS' => env('SYSTEM_SMTP_FROM_ADDRESS', env('MAIL_FROM_ADDRESS', '')),
                    'SYSTEM_SMTP_FROM_NAME' => env('SYSTEM_SMTP_FROM_NAME', env('MAIL_FROM_NAME', '')),
                ],
                'webmail' => [
                    'WEBMAIL_URL' => env('WEBMAIL_URL', ''),
                    'WEBMAIL_ENABLED' => env('WEBMAIL_ENABLED', false),
                ],
                'system' => [
                    'APP_NAME' => env('APP_NAME', ''),
                    'APP_URL' => env('APP_URL', ''),
                    'APP_TIMEZONE' => env('APP_TIMEZONE', ''),
                    'MAX_CAMPAIGNS_PER_DAY' => env('MAX_CAMPAIGNS_PER_DAY', ''),
                    'MAX_RECIPIENTS_PER_CAMPAIGN' => env('MAX_RECIPIENTS_PER_CAMPAIGN', ''),
                ],
                'notifications' => [
                    'NOTIFICATION_EMAIL_ENABLED' => env('NOTIFICATION_EMAIL_ENABLED', true),
                    'NOTIFICATION_TELEGRAM_ENABLED' => env('NOTIFICATION_TELEGRAM_ENABLED', false),
                    'TELEGRAM_BOT_TOKEN' => env('TELEGRAM_BOT_TOKEN', ''),
                ],
            ];

            return $this->successResponse($envVariables, 'Environment variables retrieved successfully');
        }, 'get_env_variables');
    }

    /**
     * Helper methods for analytics
     */
    private function getUserGrowth($timeRange)
    {
        $days = $timeRange === '7d' ? 7 : ($timeRange === '30d' ? 30 : 90);

        return User::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getCampaignPerformance($timeRange)
    {
        $days = $timeRange === '7d' ? 7 : ($timeRange === '30d' ? 30 : 90);

        return Campaign::selectRaw('
                DATE(created_at) as date,
                COUNT(*) as total_campaigns,
                SUM(emails_sent) as total_sent,
                AVG(open_rate) as avg_open_rate,
                AVG(click_rate) as avg_click_rate
            ')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getDeliverabilityStats($timeRange)
    {
        $days = $timeRange === '7d' ? 7 : ($timeRange === '30d' ? 30 : 90);

        return Campaign::selectRaw('
                AVG(delivery_rate) as avg_delivery_rate,
                AVG(bounce_rate) as avg_bounce_rate,
                AVG(spam_complaints) as avg_spam_complaints
            ')
            ->where('created_at', '>=', now()->subDays($days))
            ->first();
    }

    private function getRevenueMetrics($timeRange)
    {
        $days = $timeRange === '7d' ? 7 : ($timeRange === '30d' ? 30 : 90);

        // This would integrate with your billing/subscription system
        return [
            'total_revenue' => 0,
            'monthly_recurring_revenue' => 0,
            'active_subscriptions' => 0,
        ];
    }

    private function checkDatabaseStatus()
    {
        try {
            DB::connection()->getPdo();

            return ['status' => 'connected', 'message' => 'Database connection successful'];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => 'Database connection failed'];
        }
    }

    private function checkCacheStatus()
    {
        try {
            Cache::store()->has('test');

            return ['status' => 'connected', 'message' => 'Cache connection successful'];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => 'Cache connection failed'];
        }
    }

    private function checkQueueStatus()
    {
        try {
            // Check if queue workers are running by examining failed jobs and queue statistics
            $failedJobs = DB::table('failed_jobs')->count();
            $pendingJobs = DB::table('jobs')->count();

            // Check for recent job processing (jobs processed in last 5 minutes)
            $recentlyProcessed = DB::table('jobs')
                ->where('created_at', '>=', now()->subMinutes(5))
                ->count();

            // Determine queue health
            $status = 'healthy';
            $message = 'Queue workers are running normally';

            if ($failedJobs > 50) {
                $status = 'warning';
                $message = "High number of failed jobs: {$failedJobs}";
            }

            if ($pendingJobs > 1000) {
                $status = 'warning';
                $message = "High queue backlog: {$pendingJobs} pending jobs";
            }

            if ($pendingJobs > 0 && $recentlyProcessed === 0) {
                $status = 'error';
                $message = 'Queue workers appear to be stuck or not running';
            }

            return [
                'status' => $status,
                'message' => $message,
                'details' => [
                    'failed_jobs' => $failedJobs,
                    'pending_jobs' => $pendingJobs,
                    'recently_processed' => $recentlyProcessed,
                    'last_check' => now()->toISOString(),
                ],
            ];

        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to check queue status: '.$e->getMessage(),
                'details' => [],
            ];
        }
    }

    private function checkStorageStatus()
    {
        $disk = storage_path();
        $freeSpace = disk_free_space($disk);
        $totalSpace = disk_total_space($disk);
        $usedSpace = $totalSpace - $freeSpace;
        $usagePercent = ($usedSpace / $totalSpace) * 100;

        return [
            'status' => $usagePercent < 90 ? 'ok' : 'warning',
            'usage_percent' => round($usagePercent, 2),
            'free_space' => $this->formatBytes($freeSpace),
            'total_space' => $this->formatBytes($totalSpace),
        ];
    }

    private function getBackupStatus()
    {
        try {
            $latestBackup = \App\Models\Backup::where('status', 'completed')
                ->orderBy('created_at', 'desc')
                ->first();

            return [
                'status' => $latestBackup ? 'ok' : 'warning',
                'last_backup' => $latestBackup ? $latestBackup->created_at : null,
                'last_backup_size' => $latestBackup ? $latestBackup->human_size : null,
                'message' => $latestBackup
                    ? 'Backups are available'
                    : 'No backups found - consider creating a backup',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to check backup status: '.$e->getMessage(),
                'last_backup' => null,
                'last_backup_size' => null,
            ];
        }
    }

    private function getMemoryUsage()
    {
        $memoryLimit = ini_get('memory_limit');
        $memoryUsage = memory_get_usage(true);
        $memoryPeak = memory_get_peak_usage(true);

        return [
            'limit' => $memoryLimit,
            'current' => $this->formatBytes($memoryUsage),
            'peak' => $this->formatBytes($memoryPeak),
        ];
    }

    private function getDiskUsage()
    {
        $disk = base_path();
        $freeSpace = disk_free_space($disk);
        $totalSpace = disk_total_space($disk);
        $usedSpace = $totalSpace - $freeSpace;

        return [
            'free' => $this->formatBytes($freeSpace),
            'total' => $this->formatBytes($totalSpace),
            'used' => $this->formatBytes($usedSpace),
        ];
    }

    private function formatBytes($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, 2).' '.$units[$pow];
    }

    private function getSystemInfo()
    {
        return [
            'version' => config('app.version', '1.0.0'),
            'environment' => config('app.env'),
            'debug' => config('app.debug'),
            'timezone' => config('app.timezone'),
            'php_version' => phpversion(),
            'laravel_version' => app()->version(),
        ];
    }

    private function getServerUptime()
    {
        try {
            // Try to get uptime on Linux/Unix systems
            if (function_exists('sys_getloadavg') && file_exists('/proc/uptime')) {
                $uptime = file_get_contents('/proc/uptime');
                $uptimeSeconds = (float) explode(' ', $uptime)[0];

                return $this->formatUptime($uptimeSeconds);
            }

            // Fallback: calculate PHP process uptime
            $startTime = $_SERVER['REQUEST_TIME'] ?? time();
            $uptimeSeconds = time() - $startTime;

            return $this->formatUptime($uptimeSeconds);
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    private function formatUptime($seconds)
    {
        $days = floor($seconds / 86400);
        $hours = floor(($seconds % 86400) / 3600);
        $minutes = floor(($seconds % 3600) / 60);

        if ($days > 0) {
            return sprintf('%d days, %d hours', $days, $hours);
        } elseif ($hours > 0) {
            return sprintf('%d hours, %d minutes', $hours, $minutes);
        } else {
            return sprintf('%d minutes', $minutes);
        }
    }

    private function getCpuUsage()
    {
        try {
            // Try to get CPU usage on Linux systems
            if (file_exists('/proc/loadavg')) {
                $load = file_get_contents('/proc/loadavg');
                $loadArray = explode(' ', $load);
                $cpuLoad = (float) $loadArray[0]; // 1-minute load average

                // Convert load average to percentage (assuming single core)
                $cpuCores = $this->getCpuCores();
                $cpuUsage = min(100, ($cpuLoad / $cpuCores) * 100);

                return [
                    'usage_percent' => round($cpuUsage, 2),
                    'load_average' => $cpuLoad,
                    'cores' => $cpuCores,
                ];
            }

            return [
                'usage_percent' => 0,
                'load_average' => 0,
                'cores' => 1,
                'message' => 'CPU monitoring not available on this system',
            ];
        } catch (\Exception $e) {
            return [
                'usage_percent' => 0,
                'load_average' => 0,
                'cores' => 1,
                'message' => 'Error retrieving CPU usage',
            ];
        }
    }

    private function getCpuCores()
    {
        try {
            if (file_exists('/proc/cpuinfo')) {
                $cpuinfo = file_get_contents('/proc/cpuinfo');
                $cores = substr_count($cpuinfo, 'processor');

                return max(1, $cores);
            }

            return 1;
        } catch (\Exception $e) {
            return 1;
        }
    }

    /**
     * Run Laravel scheduler manually
     */
    public function runScheduler(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }

            try {
                // Run the scheduler command
                \Illuminate\Support\Facades\Artisan::call('schedule:run');
                $output = \Illuminate\Support\Facades\Artisan::output();

                return $this->successResponse([
                    'output' => $output,
                    'timestamp' => now()->toISOString()
                ], 'Scheduler executed successfully');
            } catch (\Exception $e) {
                return $this->errorResponse('Failed to run scheduler: ' . $e->getMessage(), 500);
            }
        }, 'run_scheduler');
    }

    /**
     * Process queue manually
     */
    public function processQueue(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (! Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }

            try {
                // Process queue jobs
                \Illuminate\Support\Facades\Artisan::call('queue:work', [
                    '--stop-when-empty' => true,
                    '--tries' => 3,
                    '--timeout' => 60
                ]);
                $output = \Illuminate\Support\Facades\Artisan::output();

                return $this->successResponse([
                    'output' => $output,
                    'timestamp' => now()->toISOString()
                ], 'Queue processed successfully');
            } catch (\Exception $e) {
                return $this->errorResponse('Failed to process queue: ' . $e->getMessage(), 500);
            }
        }, 'process_queue');
    }
}
