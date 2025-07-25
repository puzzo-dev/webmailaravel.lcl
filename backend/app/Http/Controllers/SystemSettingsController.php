<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use App\Models\SystemConfig;
use Illuminate\Validation\Rule;

class SystemSettingsController extends Controller
{
    /**
     * Get system settings
     */
    public function index(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            // Check if user has admin role
            if (!Auth::user()->hasRole('admin')) {
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
            ];

            return $this->successResponse($settings, 'System settings retrieved successfully');
        }, 'get_system_settings');
    }

    /**
     * Update system settings
     */
    public function update(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            // Check if user has admin role
            if (!Auth::user()->hasRole('admin')) {
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
            ]);

            $updatedSettings = [];

            // Update system SMTP settings
            if ($request->has('system_smtp')) {
                $smtpSettings = $request->input('system_smtp');
                foreach ($smtpSettings as $key => $value) {
                    $configKey = 'SYSTEM_SMTP_' . strtoupper($key);
                    SystemConfig::set($configKey, $value);
                    $updatedSettings["system_smtp.{$key}"] = $value;
                }
            }

            // Update webmail settings
            if ($request->has('webmail')) {
                $webmailSettings = $request->input('webmail');
                foreach ($webmailSettings as $key => $value) {
                    $configKey = 'WEBMAIL_' . strtoupper($key);
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
                        $configKey = 'NOTIFICATION_' . strtoupper($key);
                    }
                    SystemConfig::set($configKey, $value);
                    $updatedSettings["notifications.{$key}"] = $value;
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
            if (!Auth::user()->hasRole('admin')) {
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
                return $this->errorResponse('Failed to send test email: ' . $e->getMessage(), 500);
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
            if (!Auth::user()->hasRole('admin')) {
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
     * Update system configuration (admin only)
     */
    public function updateSystemConfig(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
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
     * Get BTCPay configuration (admin only)
     */
    public function getBTCPayConfig(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }
            
            $config = [
                'base_url' => SystemConfig::get('BTCPAY_URL'),
                'api_key' => SystemConfig::get('BTCPAY_API_KEY'),
                'store_id' => SystemConfig::get('BTCPAY_STORE_ID'),
                'webhook_secret' => SystemConfig::get('BTCPAY_WEBHOOK_SECRET'),
                'currency' => SystemConfig::get('BTCPAY_CURRENCY', 'USD'),
            ];
            return $this->successResponse($config, 'BTCPay configuration retrieved successfully');
        }, 'view_btcpay_config');
    }

    /**
     * Update BTCPay configuration (admin only)
     */
    public function updateBTCPayConfig(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
                return $this->forbiddenResponse('Access denied. Admin role required.');
            }
            
            $validated = $request->validate([
                'base_url' => 'nullable|string',
                'api_key' => 'nullable|string',
                'store_id' => 'nullable|string',
                'webhook_secret' => 'nullable|string',
                'currency' => 'nullable|string',
            ]);
            
            foreach ($validated as $key => $value) {
                $configKey = 'BTCPAY_' . strtoupper($key);
                SystemConfig::set($configKey, $value);
            }
            
            return $this->successResponse(null, 'BTCPay configuration updated successfully');
        }, 'update_btcpay_config');
    }

    /**
     * Get Telegram configuration (admin only)
     */
    public function getTelegramConfig(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (!Auth::user()->hasRole('admin')) {
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
     * Update Telegram configuration (admin only)
     */
    public function updateTelegramConfig(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
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
                    $configKey = 'TELEGRAM_' . strtoupper($key);
                }
                SystemConfig::set($configKey, $value);
            }
            
            return $this->successResponse(null, 'Telegram configuration updated successfully');
        }, 'update_telegram_config');
    }

    /**
     * Get PowerMTA configuration (admin only)
     */
    public function getPowerMTAConfig(): JsonResponse
    {
        return $this->executeWithErrorHandling(function () {
            if (!Auth::user()->hasRole('admin')) {
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
     * Update PowerMTA configuration (admin only)
     */
    public function updatePowerMTAConfig(Request $request): JsonResponse
    {
        return $this->executeWithErrorHandling(function () use ($request) {
            if (!Auth::user()->hasRole('admin')) {
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
                $configKey = 'POWERMTA_' . strtoupper($key);
                SystemConfig::set($configKey, $value);
            }
            
            return $this->successResponse(null, 'PowerMTA configuration updated successfully');
        }, 'update_powermta_config');
    }
}
