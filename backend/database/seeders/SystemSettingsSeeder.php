<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemConfig;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $systemSettings = [
            // System SMTP Settings (for notifications)
            ['key' => 'SYSTEM_SMTP_HOST', 'value' => 'localhost', 'description' => 'System SMTP server host'],
            ['key' => 'SYSTEM_SMTP_PORT', 'value' => '587', 'description' => 'System SMTP server port'],
            ['key' => 'SYSTEM_SMTP_USERNAME', 'value' => '', 'description' => 'System SMTP username'],
            ['key' => 'SYSTEM_SMTP_PASSWORD', 'value' => '', 'description' => 'System SMTP password'],
            ['key' => 'SYSTEM_SMTP_ENCRYPTION', 'value' => 'tls', 'description' => 'System SMTP encryption (tls/ssl/none)'],
            ['key' => 'SYSTEM_SMTP_FROM_ADDRESS', 'value' => 'noreply@example.com', 'description' => 'System SMTP from address'],
            ['key' => 'SYSTEM_SMTP_FROM_NAME', 'value' => 'System Notifications', 'description' => 'System SMTP from name'],
            
            // Webmail Settings
            ['key' => 'WEBMAIL_URL', 'value' => '', 'description' => 'Webmail URL for campaign responses'],
            ['key' => 'WEBMAIL_ENABLED', 'value' => 'false', 'description' => 'Enable webmail integration'],
            
            // System Settings
            ['key' => 'APP_NAME', 'value' => 'WebMail Laravel', 'description' => 'Application name'],
            ['key' => 'APP_URL', 'value' => 'http://localhost', 'description' => 'Application URL'],
            ['key' => 'APP_TIMEZONE', 'value' => 'UTC', 'description' => 'Application timezone'],
            ['key' => 'MAX_CAMPAIGNS_PER_DAY', 'value' => '50', 'description' => 'Maximum campaigns per day per user'],
            ['key' => 'MAX_RECIPIENTS_PER_CAMPAIGN', 'value' => '10000', 'description' => 'Maximum recipients per campaign'],
            
            // Notification Settings
            ['key' => 'NOTIFICATION_EMAIL_ENABLED', 'value' => 'true', 'description' => 'Enable email notifications'],
            ['key' => 'NOTIFICATION_TELEGRAM_ENABLED', 'value' => 'false', 'description' => 'Enable Telegram notifications'],
            ['key' => 'TELEGRAM_BOT_TOKEN', 'value' => '', 'description' => 'Telegram bot token for notifications'],
        ];

        foreach ($systemSettings as $setting) {
            SystemConfig::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'description' => $setting['description']
                ]
            );
        }
    }
}
