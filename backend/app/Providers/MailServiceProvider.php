<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\NotificationMailService;
use App\Models\SystemConfig;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class MailServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services
     */
    public function boot(): void
    {
        // Force system SMTP configuration for all non-campaign emails
        $this->configureSystemMail();
    }

    /**
     * Configure system mail settings from database
     */
    private function configureSystemMail(): void
    {
        try {
            // Get system SMTP configuration from database
            $systemSmtp = [
                'host' => SystemConfig::get('SYSTEM_SMTP_HOST'),
                'port' => SystemConfig::get('SYSTEM_SMTP_PORT'),
                'username' => SystemConfig::get('SYSTEM_SMTP_USERNAME'),
                'password' => SystemConfig::get('SYSTEM_SMTP_PASSWORD'),
                'encryption' => SystemConfig::get('SYSTEM_SMTP_ENCRYPTION'),
                'from_address' => SystemConfig::get('SYSTEM_SMTP_FROM_ADDRESS'),
                'from_name' => SystemConfig::get('SYSTEM_SMTP_FROM_NAME'),
            ];

            // Only configure if we have a host
            if (!empty($systemSmtp['host'])) {
                // Override default mail configuration with system settings
                Config::set([
                    'mail.default' => 'smtp',
                    'mail.mailers.smtp.host' => $systemSmtp['host'],
                    'mail.mailers.smtp.port' => $systemSmtp['port'] ?: 587,
                    'mail.mailers.smtp.username' => $systemSmtp['username'],
                    'mail.mailers.smtp.password' => $systemSmtp['password'],
                    'mail.mailers.smtp.encryption' => $systemSmtp['encryption'] ?: 'tls',
                    'mail.from.address' => $systemSmtp['from_address'] ?: env('MAIL_FROM_ADDRESS'),
                    'mail.from.name' => $systemSmtp['from_name'] ?: env('MAIL_FROM_NAME'),
                ]);

                Log::info('System SMTP configuration loaded from database', [
                    'host' => $systemSmtp['host'],
                    'port' => $systemSmtp['port'],
                    'encryption' => $systemSmtp['encryption'],
                    'from_address' => $systemSmtp['from_address']
                ]);
            } else {
                Log::warning('No system SMTP host configured in database, using .env defaults');
            }
        } catch (\Exception $e) {
            Log::error('Failed to configure system SMTP from database', [
                'error' => $e->getMessage()
            ]);
            // Fallback to .env configuration
        }
    }
}
