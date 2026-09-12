<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    /**
     * Get config value with caching
     */
    public static function getValue(string $key, $default = null)
    {
        return Cache::remember("system_config:{$key}", 3600, function () use ($key, $default) {
            $config = static::where('key', $key)->first();

            return $config ? $config->value : $default;
        });
    }

    /**
     * Set config value with cache invalidation
     */
    public static function setValue(string $key, $value, ?string $description = null): void
    {
        $config = static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'description' => $description,
            ]
        );

        Cache::forget("system_config:{$key}");
    }

    /**
     * Get all configs
     */
    public static function getAllConfigs(): array
    {
        return static::all()
            ->pluck('value', 'key')
            ->toArray();
    }

    /**
     * Get Redis configuration
     */
    public static function getRedisConfig(): array
    {
        return [
            'host' => static::getValue('redis_host', '127.0.0.1'),
            'port' => static::getValue('redis_port', 6379),
            'password' => static::getValue('redis_password'),
            'database' => static::getValue('redis_database', 0),
            'prefix' => static::getValue('redis_prefix', 'campaign_manager:'),
        ];
    }

    /**
     * Get PowerMTA configuration
     */
    public static function getPowerMTAConfig(): array
    {
        return [
            'host' => static::getValue('powermta_host', 'localhost'),
            'port' => static::getValue('powermta_port', 25),
            'username' => static::getValue('powermta_username'),
            'password' => static::getValue('powermta_password'),
            'logs_path' => static::getValue('powermta_logs_path', '/var/log/powermta'),
            'config_path' => static::getValue('powermta_config_path', '/etc/powermta'),
            'acct_file' => static::getValue('powermta_acct_file', 'acct.csv'),
            'fbl_file' => static::getValue('powermta_fbl_file', 'fbl.csv'),
            'diag_file' => static::getValue('powermta_diag_file', 'diag.csv'),
            'logs_file' => static::getValue('powermta_logs_file', 'logs.txt'),
        ];
    }

    /**
     * Get PMTA file monitoring configuration
     */
    public static function getPmtaMonitoringConfig(): array
    {
        return [
            'enabled' => static::getValue('pmta_enabled', 'false') === 'true',
            'project_id' => static::getValue('pmta_project_id', 'webmailaravel'),
            'files_path' => static::getValue('pmta_files_path', '/root/pmta/logs'),
            'fbl_path' => static::getValue('pmta_fbl_path', 'pmta-fbl'),
            'logs_path' => static::getValue('pmta_logs_path', ''),
            'acct_path' => static::getValue('pmta_acct_path', 'pmta-acct'),
            'diag_path' => static::getValue('pmta_diag_path', 'pmta-diag'),
            'bounce_path' => static::getValue('pmta_bounce_path', 'pmta-bounce'),
            'scan_interval' => (int) static::getValue('pmta_scan_interval', 5),
            'retention_days' => (int) static::getValue('pmta_retention_days', 30),
        ];
    }

    /**
     * Get Cloudflare DNS automation configuration
     */
    public static function getCloudflareConfig(): array
    {
        return [
            'api_token' => static::getValue('cloudflare_api_token'),
            'zone_id' => static::getValue('cloudflare_zone_id'),
        ];
    }

    /**
     * Get SMTP configuration
     */
    public static function getDefaultSMTPConfig(): array
    {
        return [
            'host' => static::getValue('default_smtp_host'),
            'port' => static::getValue('default_smtp_port', 587),
            'username' => static::getValue('default_smtp_username'),
            'password' => static::getValue('default_smtp_password'),
            'encryption' => static::getValue('default_smtp_encryption', 'tls'),
            'from_address' => static::getValue('default_smtp_from_address'),
            'from_name' => static::getValue('default_smtp_from_name'),
        ];
    }

    /**
     * Get BTCPay configuration
     */
    public static function getBTCPayConfig(): array
    {
        return [
            'url' => static::getValue('btcpay_url'),
            'api_key' => static::getValue('btcpay_api_key'),
            'store_id' => static::getValue('btcpay_store_id'),
            'webhook_secret' => static::getValue('btcpay_webhook_secret'),
            'currency' => static::getValue('btcpay_currency', 'USD'),
        ];
    }

    /**
     * Get GeoIP configuration
     */
    public static function getGeoIPConfig(): array
    {
        return [
            'database_path' => static::getValue('geoip_database_path'),
            'api_key' => static::getValue('geoip_api_key'),
            'service' => static::getValue('geoip_service', 'maxmind'),
        ];
    }

    /**
     * Get Training configuration
     */
    public static function getTrainingConfig(): array
    {
        return [
            'default_mode' => static::getValue('TRAINING_DEFAULT_MODE', 'manual'),
            'allow_user_override' => static::getBooleanValue('TRAINING_ALLOW_USER_OVERRIDE', true),
            'automatic_threshold' => static::getIntegerValue('TRAINING_AUTOMATIC_THRESHOLD', 100),
            'manual_approval_required' => static::getBooleanValue('TRAINING_MANUAL_APPROVAL_REQUIRED', false),
        ];
    }

    /**
     * Get boolean config value with proper casting
     */
    public static function getBooleanValue(string $key, bool $default = false): bool
    {
        $value = static::getValue($key, $default);
        if (is_string($value)) {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }

        return (bool) $value;
    }

    /**
     * Get integer config value with proper casting
     */
    public static function getIntegerValue(string $key, int $default = 0): int
    {
        $value = static::getValue($key, $default);

        return (int) $value;
    }

    /**
     * Get file upload configuration
     */
    public static function getUploadConfig(): array
    {
        return [
            'max_file_size' => static::getValue('upload_max_file_size', 10485760), // 10MB
            'allowed_extensions' => static::getValue('upload_allowed_extensions', 'txt,csv'),
            'upload_path' => static::getValue('upload_path', 'uploads'),
            'backup_path' => static::getValue('backup_path', 'backups'),
            'powermta_logs_path' => static::getValue('powermta_logs_path', 'powermta_logs'),
        ];
    }

    /**
     * Get rate limiting configuration
     */
    public static function getRateLimitConfig(): array
    {
        return [
            'default_emails_per_hour' => static::getValue('rate_limit_default_emails_per_hour', 100),
            'max_emails_per_hour' => static::getValue('rate_limit_max_emails_per_hour', 1000),
            'burst_limit' => static::getValue('rate_limit_burst_limit', 50),
            'decay_minutes' => static::getValue('rate_limit_decay_minutes', 60),
        ];
    }

    /**
     * Get notification configuration
     */
    public static function getNotificationConfig(): array
    {
        return [
            'email_enabled' => static::getValue('notification_email_enabled', true),
            'telegram_enabled' => static::getValue('notification_telegram_enabled', false),
            'telegram_bot_token' => static::getValue('notification_telegram_bot_token'),
            'telegram_chat_id' => static::getValue('notification_telegram_chat_id'),
            'websocket_enabled' => static::getValue('notification_websocket_enabled', true),
        ];
    }

    /**
     * Get security configuration
     */
    public static function getSecurityConfig(): array
    {
        return [
            'max_login_attempts' => static::getValue('security_max_login_attempts', 5),
            'lockout_duration' => static::getValue('security_lockout_duration', 15),
            'password_min_length' => static::getValue('security_password_min_length', 8),
            'require_2fa' => static::getValue('security_require_2fa', false),
            'session_timeout' => static::getValue('security_session_timeout', 120),
        ];
    }

    /**
     * Initialize default system configurations
     */
    public static function initializeDefaults(): void
    {
        $defaults = [
            // Redis Configuration
            ['key' => 'redis_host', 'value' => '127.0.0.1', 'description' => 'Redis server host'],
            ['key' => 'redis_port', 'value' => '6379', 'description' => 'Redis server port'],
            ['key' => 'redis_database', 'value' => '0', 'description' => 'Redis database number'],
            ['key' => 'redis_prefix', 'value' => 'campaign_manager:', 'description' => 'Redis key prefix'],

            // PowerMTA Configuration — management API runs on HTTPS with ?format=json
            ['key' => 'powermta_host', 'value' => '63.250.44.3', 'description' => 'PowerMTA management API host'],
            ['key' => 'powermta_port', 'value' => '8060', 'description' => 'PowerMTA management API port (HTTPS)'],
            ['key' => 'powermta_logs_path', 'value' => '/var/log/pmta', 'description' => 'PowerMTA log files directory'],
            ['key' => 'powermta_config_path', 'value' => '/etc/pmta', 'description' => 'PowerMTA config directory'],

            // PMTA File Monitoring — paths match production PMTA Docker bind-mount
            // PMTA container bind-mounts /root/pmta/logs -> /var/log/pmta inside the container.
            // The Laravel app (when deployed on the same host) reads from the host path.
            ['key' => 'pmta_enabled', 'value' => 'false', 'description' => 'Enable PMTA file-based monitoring'],
            ['key' => 'pmta_project_id', 'value' => 'webmailaravel', 'description' => 'Unique project identifier — distinguishes this project from others sharing the same PMTA engine (sent as X-Project-ID header)'],
            ['key' => 'pmta_files_path', 'value' => '/root/pmta/logs', 'description' => 'Base path for PMTA files (host bind-mount: /root/pmta/logs -> container /var/log/pmta)'],
            ['key' => 'pmta_fbl_path', 'value' => 'pmta-fbl', 'description' => 'FBL files subdirectory (move-to from acct-file)'],
            ['key' => 'pmta_logs_path', 'value' => '', 'description' => 'Log files subdirectory (log-file is /var/log/pmta/log)'],
            ['key' => 'pmta_acct_path', 'value' => 'pmta-acct', 'description' => 'Accounting files subdirectory (move-to from acct-file)'],
            ['key' => 'pmta_diag_path', 'value' => 'pmta-diag', 'description' => 'Diagnostic files subdirectory (move-to from acct-file)'],
            ['key' => 'pmta_bounce_path', 'value' => 'pmta-bounce', 'description' => 'Bounce files subdirectory (move-to from acct-file)'],
            ['key' => 'pmta_scan_interval', 'value' => '5', 'description' => 'Scan interval in minutes'],
            ['key' => 'pmta_retention_days', 'value' => '30', 'description' => 'File retention in days'],

            // Cloudflare DNS Automation
            ['key' => 'cloudflare_api_token', 'value' => '', 'description' => 'Cloudflare API token for DNS automation'],
            ['key' => 'cloudflare_zone_id', 'value' => '', 'description' => 'Cloudflare zone ID for DNS management'],

            // Upload Configuration
            ['key' => 'upload_max_file_size', 'value' => '10485760', 'description' => 'Maximum file upload size (10MB)'],
            ['key' => 'upload_allowed_extensions', 'value' => 'txt,csv', 'description' => 'Allowed file extensions'],
            ['key' => 'upload_path', 'value' => 'uploads', 'description' => 'File upload directory'],
            ['key' => 'backup_path', 'value' => 'backups', 'description' => 'Backup directory'],

            // Rate Limiting
            ['key' => 'rate_limit_default_emails_per_hour', 'value' => '100', 'description' => 'Default emails per hour'],
            ['key' => 'rate_limit_max_emails_per_hour', 'value' => '1000', 'description' => 'Maximum emails per hour'],
            ['key' => 'rate_limit_burst_limit', 'value' => '50', 'description' => 'Burst limit for rate limiting'],

            // Security
            ['key' => 'security_max_login_attempts', 'value' => '5', 'description' => 'Maximum login attempts'],
            ['key' => 'security_lockout_duration', 'value' => '15', 'description' => 'Lockout duration in minutes'],
            ['key' => 'security_password_min_length', 'value' => '8', 'description' => 'Minimum password length'],

            // Notifications
            ['key' => 'notification_email_enabled', 'value' => 'true', 'description' => 'Enable email notifications'],
            ['key' => 'notification_websocket_enabled', 'value' => 'true', 'description' => 'Enable WebSocket notifications'],
        ];

        foreach ($defaults as $config) {
            static::updateOrCreate(
                ['key' => $config['key']],
                [
                    'value' => $config['value'],
                    'description' => $config['description'],
                ]
            );
        }
    }

    /**
     * Clear all cached configurations
     */
    public static function clearCache(): void
    {
        $configs = static::all();
        foreach ($configs as $config) {
            Cache::forget("system_config:{$config->key}");
        }
    }

    /**
     * Helper method for getting config values (alias for getValue)
     */
    public static function get(string $key, $default = null)
    {
        return static::getValue($key, $default);
    }

    /**
     * Helper method for setting config values (alias for setValue)
     */
    public static function set(string $key, $value, ?string $description = null): void
    {
        static::setValue($key, $value, $description);
    }

    /**
     * Sync system configuration to .env file
     */
    public static function syncToEnvFile(): bool
    {
        try {
            $envPath = base_path('.env');
            
            if (!file_exists($envPath)) {
                return false;
            }

            $envContent = file_get_contents($envPath);

            // Map of system config keys to env keys
            $configMapping = [
                'SYSTEM_SMTP_HOST' => 'MAIL_HOST',
                'SYSTEM_SMTP_PORT' => 'MAIL_PORT',
                'SYSTEM_SMTP_USERNAME' => 'MAIL_USERNAME',
                'SYSTEM_SMTP_PASSWORD' => 'MAIL_PASSWORD',
                'SYSTEM_SMTP_ENCRYPTION' => 'MAIL_ENCRYPTION',
                'SYSTEM_SMTP_FROM_ADDRESS' => 'MAIL_FROM_ADDRESS',
                'SYSTEM_SMTP_FROM_NAME' => 'MAIL_FROM_NAME',
            ];

            // Update both system config values and their corresponding ENV values
            foreach ($configMapping as $systemKey => $envKey) {
                $value = static::get($systemKey);
                if ($value !== null) {
                    // Update the ENV key as well
                    $envContent = static::updateEnvValue($envContent, $envKey, $value);
                    // Ensure system key exists
                    $envContent = static::updateEnvValue($envContent, $systemKey, $value);
                }
            }

            // Update MAIL_MAILER to smtp if system SMTP is configured
            $smtpHost = static::get('SYSTEM_SMTP_HOST');
            if ($smtpHost) {
                $envContent = static::updateEnvValue($envContent, 'MAIL_MAILER', 'smtp');
            }

            file_put_contents($envPath, $envContent);
            
            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to sync system config to env file: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Update or add an environment variable in the env content
     */
    private static function updateEnvValue(string $envContent, string $key, $value): string
    {
        // Handle null values
        if ($value === null || $value === '') {
            $formattedValue = '';
        } else {
            // Handle boolean values
            if (is_bool($value)) {
                $formattedValue = $value ? 'true' : 'false';
            } else {
                $value = (string) $value;
                
                // Check if value needs quoting (contains spaces, special chars, etc.)
                if (preg_match('/[\s#"\'@\\\\]/', $value)) {
                    // Remove existing quotes and add proper ones
                    $cleanValue = trim($value, '"\'');
                    $formattedValue = '"' . str_replace('"', '\\"', $cleanValue) . '"';
                } else {
                    $formattedValue = $value;
                }
            }
        }

        $pattern = "/^{$key}=.*$/m";
        $replacement = "{$key}={$formattedValue}";

        if (preg_match($pattern, $envContent)) {
            // Update existing value
            return preg_replace($pattern, $replacement, $envContent);
        } else {
            // Add new value at the end
            return $envContent . "\n{$replacement}";
        }
    }
}
