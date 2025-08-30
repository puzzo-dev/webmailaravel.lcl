<?php

namespace App\Services;

use App\Models\SystemConfig;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class NotificationMailService
{
    /**
     * Configure mail settings for system notifications
     */
    public static function configureSystemMail(): void
    {
        try {
            // Get system SMTP configuration from database
            $smtpConfig = [
                'host' => SystemConfig::get('SYSTEM_SMTP_HOST'),
                'port' => SystemConfig::get('SYSTEM_SMTP_PORT'),
                'username' => SystemConfig::get('SYSTEM_SMTP_USERNAME'),
                'password' => SystemConfig::get('SYSTEM_SMTP_PASSWORD'),
                'encryption' => SystemConfig::get('SYSTEM_SMTP_ENCRYPTION'),
                'from_address' => SystemConfig::get('SYSTEM_SMTP_FROM_ADDRESS'),
                'from_name' => SystemConfig::get('SYSTEM_SMTP_FROM_NAME'),
            ];

            // Only configure if we have system SMTP settings
            if (!empty($smtpConfig['host'])) {
                // Apply configuration to Laravel's mail system
                Config::set([
                    'mail.default' => 'smtp',
                    'mail.mailers.smtp.transport' => 'smtp',
                    'mail.mailers.smtp.host' => $smtpConfig['host'],
                    'mail.mailers.smtp.port' => $smtpConfig['port'] ?: 587,
                    'mail.mailers.smtp.username' => $smtpConfig['username'],
                    'mail.mailers.smtp.password' => $smtpConfig['password'],
                    'mail.mailers.smtp.encryption' => $smtpConfig['encryption'] ?: 'tls',
                    'mail.from.address' => $smtpConfig['from_address'] ?: env('MAIL_FROM_ADDRESS'),
                    'mail.from.name' => $smtpConfig['from_name'] ?: env('MAIL_FROM_NAME'),
                ]);

                // Clear mail manager cache to force reload
                if (app()->bound('mail.manager')) {
                    app('mail.manager')->purge('smtp');
                }

                Log::info('System SMTP configuration applied for notifications', [
                    'host' => $smtpConfig['host'],
                    'port' => $smtpConfig['port'],
                    'encryption' => $smtpConfig['encryption'],
                    'from_address' => $smtpConfig['from_address']
                ]);
            } else {
                Log::warning('No system SMTP host found in database, using fallback configuration');
                
                // Fallback to env configuration
                $fallbackConfig = [
                    'host' => env('MAIL_HOST', 'localhost'),
                    'port' => env('MAIL_PORT', 587),
                    'username' => env('MAIL_USERNAME'),
                    'password' => env('MAIL_PASSWORD'),
                    'encryption' => env('MAIL_ENCRYPTION', 'tls'),
                    'from_address' => env('MAIL_FROM_ADDRESS'),
                    'from_name' => env('MAIL_FROM_NAME'),
                ];
                
                if (!empty($fallbackConfig['host']) && $fallbackConfig['host'] !== 'localhost') {
                    Config::set([
                        'mail.default' => 'smtp',
                        'mail.mailers.smtp.transport' => 'smtp',
                        'mail.mailers.smtp.host' => $fallbackConfig['host'],
                        'mail.mailers.smtp.port' => $fallbackConfig['port'],
                        'mail.mailers.smtp.username' => $fallbackConfig['username'],
                        'mail.mailers.smtp.password' => $fallbackConfig['password'],
                        'mail.mailers.smtp.encryption' => $fallbackConfig['encryption'],
                        'mail.from.address' => $fallbackConfig['from_address'],
                        'mail.from.name' => $fallbackConfig['from_name'],
                    ]);
                    
                    Log::info('Fallback SMTP configuration applied', [
                        'host' => $fallbackConfig['host'],
                        'port' => $fallbackConfig['port']
                    ]);
                }
            }

        } catch (\Exception $e) {
            Log::error('Failed to configure system SMTP for notifications', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Test system SMTP configuration
     */
    public static function testSystemSMTP(string $testEmail): bool
    {
        try {
            // Configure system mail
            self::configureSystemMail();

            // Send test email
            $testMail = new \App\Mail\TestEmail('System SMTP Test', 'This is a test email from the system SMTP configuration.');
            
            \Illuminate\Support\Facades\Mail::to($testEmail)->send($testMail);
            
            Log::info('System SMTP test email sent successfully', ['email' => $testEmail]);
            return true;

        } catch (\Exception $e) {
            Log::error('System SMTP test failed', [
                'email' => $testEmail,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
}
