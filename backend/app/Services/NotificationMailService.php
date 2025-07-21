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
            // Get system SMTP configuration
            $smtpConfig = [
                'host' => SystemConfig::get('SYSTEM_SMTP_HOST', env('MAIL_HOST', 'localhost')),
                'port' => SystemConfig::get('SYSTEM_SMTP_PORT', env('MAIL_PORT', 587)),
                'username' => SystemConfig::get('SYSTEM_SMTP_USERNAME', env('MAIL_USERNAME', '')),
                'password' => SystemConfig::get('SYSTEM_SMTP_PASSWORD', env('MAIL_PASSWORD', '')),
                'encryption' => SystemConfig::get('SYSTEM_SMTP_ENCRYPTION', env('MAIL_ENCRYPTION', 'tls')),
                'from_address' => SystemConfig::get('SYSTEM_SMTP_FROM_ADDRESS', env('MAIL_FROM_ADDRESS', 'noreply@example.com')),
                'from_name' => SystemConfig::get('SYSTEM_SMTP_FROM_NAME', env('MAIL_FROM_NAME', 'System')),
            ];

            // Apply configuration to Laravel's mail system
            Config::set([
                'mail.default' => 'smtp',
                'mail.mailers.smtp.transport' => 'smtp',
                'mail.mailers.smtp.host' => $smtpConfig['host'],
                'mail.mailers.smtp.port' => $smtpConfig['port'],
                'mail.mailers.smtp.username' => $smtpConfig['username'],
                'mail.mailers.smtp.password' => $smtpConfig['password'],
                'mail.mailers.smtp.encryption' => $smtpConfig['encryption'],
                'mail.from.address' => $smtpConfig['from_address'],
                'mail.from.name' => $smtpConfig['from_name'],
            ]);

            // Clear mail manager cache to force reload
            app('mail.manager')->purge('smtp');

            Log::info('System SMTP configuration applied for notifications', [
                'host' => $smtpConfig['host'],
                'port' => $smtpConfig['port'],
                'from_address' => $smtpConfig['from_address']
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to configure system SMTP for notifications', [
                'error' => $e->getMessage()
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
