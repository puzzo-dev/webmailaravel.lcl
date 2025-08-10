<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class EnvFileManager
{
    protected string $envPath;

    public function __construct()
    {
        $this->envPath = base_path('.env');
    }

    /**
     * Update a specific key in the .env file
     */
    public function updateEnvKey(string $key, $value): bool
    {
        try {
            if (!File::exists($this->envPath)) {
                Log::error('EnvFileManager: .env file not found', ['path' => $this->envPath]);
                return false;
            }

            $envContent = File::get($this->envPath);
            $lines = explode("\n", $envContent);
            $updated = false;
            $formattedValue = $this->formatEnvValue($value);

            // Look for existing key and update it
            foreach ($lines as $index => $line) {
                if (strpos(trim($line), $key . '=') === 0) {
                    $lines[$index] = $key . '=' . $formattedValue;
                    $updated = true;
                    break;
                }
            }

            // If key doesn't exist, add it at the end
            if (!$updated) {
                $lines[] = $key . '=' . $formattedValue;
            }

            // Write back to file
            $newContent = implode("\n", $lines);
            File::put($this->envPath, $newContent);

            Log::info('EnvFileManager: Updated .env key', [
                'key' => $key,
                'value' => $this->shouldLogValue($key) ? $value : '[HIDDEN]'
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('EnvFileManager: Failed to update .env key', [
                'key' => $key,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Update multiple keys in the .env file
     */
    public function updateEnvKeys(array $keyValuePairs): array
    {
        $results = [];
        
        foreach ($keyValuePairs as $key => $value) {
            $results[$key] = $this->updateEnvKey($key, $value);
        }

        return $results;
    }

    /**
     * Format value for .env file (handle quotes, spaces, etc.)
     */
    protected function formatEnvValue($value): string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if (is_null($value)) {
            return '';
        }

        $value = (string) $value;

        // If value contains spaces, special characters, or is empty, wrap in quotes
        if (empty($value) || preg_match('/\s|[#"\'\\\\]/', $value)) {
            return '"' . str_replace('"', '\\"', $value) . '"';
        }

        return $value;
    }

    /**
     * Determine if a key's value should be logged (hide sensitive data)
     */
    protected function shouldLogValue(string $key): bool
    {
        $sensitiveKeys = [
            'DB_PASSWORD',
            'REDIS_PASSWORD',
            'MAIL_PASSWORD',
            'SYSTEM_SMTP_PASSWORD',
            'BTCPAY_API_KEY',
            'BTCPAY_WEBHOOK_SECRET',
            'TELEGRAM_BOT_TOKEN',
            'POWERMTA_API_KEY',
            'APP_KEY'
        ];

        return !in_array($key, $sensitiveKeys);
    }

    /**
     * Get mapping of SystemConfig keys to .env keys
     */
    public static function getSystemConfigToEnvMapping(): array
    {
        return [
            // System settings
            'APP_NAME' => 'APP_NAME',
            'APP_URL' => 'APP_URL',
            'APP_TIMEZONE' => 'APP_TIMEZONE',
            
            // Database settings
            'DB_HOST' => 'DB_HOST',
            'DB_PORT' => 'DB_PORT',
            'DB_DATABASE' => 'DB_DATABASE',
            'DB_USERNAME' => 'DB_USERNAME',
            'DB_PASSWORD' => 'DB_PASSWORD',
            
            // Mail settings
            'MAIL_MAILER' => 'MAIL_MAILER',
            'MAIL_HOST' => 'MAIL_HOST',
            'MAIL_PORT' => 'MAIL_PORT',
            'MAIL_USERNAME' => 'MAIL_USERNAME',
            'MAIL_PASSWORD' => 'MAIL_PASSWORD',
            'MAIL_ENCRYPTION' => 'MAIL_ENCRYPTION',
            'MAIL_FROM_ADDRESS' => 'MAIL_FROM_ADDRESS',
            'MAIL_FROM_NAME' => 'MAIL_FROM_NAME',
            
            // System SMTP settings
            'SYSTEM_SMTP_HOST' => 'SYSTEM_SMTP_HOST',
            'SYSTEM_SMTP_PORT' => 'SYSTEM_SMTP_PORT',
            'SYSTEM_SMTP_USERNAME' => 'SYSTEM_SMTP_USERNAME',
            'SYSTEM_SMTP_PASSWORD' => 'SYSTEM_SMTP_PASSWORD',
            'SYSTEM_SMTP_ENCRYPTION' => 'SYSTEM_SMTP_ENCRYPTION',
            'SYSTEM_SMTP_FROM_ADDRESS' => 'SYSTEM_SMTP_FROM_ADDRESS',
            'SYSTEM_SMTP_FROM_NAME' => 'SYSTEM_SMTP_FROM_NAME',
            
            // Redis settings
            'REDIS_HOST' => 'REDIS_HOST',
            'REDIS_PASSWORD' => 'REDIS_PASSWORD',
            'REDIS_PORT' => 'REDIS_PORT',
            
            // Queue settings
            'QUEUE_CONNECTION' => 'QUEUE_CONNECTION',
            
            // Cache settings
            'CACHE_STORE' => 'CACHE_STORE',
            
            // Session settings
            'SESSION_DRIVER' => 'SESSION_DRIVER',
            'SESSION_LIFETIME' => 'SESSION_LIFETIME',
            
            // BTCPay settings
            'BTCPAY_URL' => 'BTCPAY_URL',
            'BTCPAY_API_KEY' => 'BTCPAY_API_KEY',
            'BTCPAY_STORE_ID' => 'BTCPAY_STORE_ID',
            'BTCPAY_WEBHOOK_SECRET' => 'BTCPAY_WEBHOOK_SECRET',
            'BTCPAY_CURRENCY' => 'BTCPAY_CURRENCY',
            
            // PowerMTA settings
            'POWERMTA_BASE_URL' => 'POWERMTA_BASE_URL',
            'POWERMTA_API_KEY' => 'POWERMTA_API_KEY',
            'POWERMTA_CONFIG_PATH' => 'POWERMTA_CONFIG_PATH',
            'POWERMTA_ACCOUNTING_PATH' => 'POWERMTA_ACCOUNTING_PATH',
            'POWERMTA_FBL_PATH' => 'POWERMTA_FBL_PATH',
            'POWERMTA_DIAG_PATH' => 'POWERMTA_DIAG_PATH',
            
            // Telegram settings
            'TELEGRAM_BOT_TOKEN' => 'TELEGRAM_BOT_TOKEN',
            'TELEGRAM_CHAT_ID' => 'TELEGRAM_CHAT_ID',
            
            // Notification settings
            'NOTIFICATION_EMAIL_ENABLED' => 'NOTIFICATION_EMAIL_ENABLED',
            'NOTIFICATION_TELEGRAM_ENABLED' => 'NOTIFICATION_TELEGRAM_ENABLED',
            
            // Training settings
            'TRAINING_DEFAULT_MODE' => 'TRAINING_DEFAULT_MODE',
            'TRAINING_ALLOW_USER_OVERRIDE' => 'TRAINING_ALLOW_USER_OVERRIDE',
            'TRAINING_AUTOMATIC_THRESHOLD' => 'TRAINING_AUTOMATIC_THRESHOLD',
            'TRAINING_MANUAL_APPROVAL_REQUIRED' => 'TRAINING_MANUAL_APPROVAL_REQUIRED',
            
            // Webmail settings
            'WEBMAIL_URL' => 'WEBMAIL_URL',
            'WEBMAIL_ENABLED' => 'WEBMAIL_ENABLED',
        ];
    }

    /**
     * Sync a SystemConfig key to .env file if mapping exists
     */
    public function syncSystemConfigToEnv(string $systemConfigKey, $value): bool
    {
        $mapping = static::getSystemConfigToEnvMapping();
        
        if (isset($mapping[$systemConfigKey])) {
            $envKey = $mapping[$systemConfigKey];
            return $this->updateEnvKey($envKey, $value);
        }
        
        return false; // No mapping found
    }

    /**
     * Sync multiple SystemConfig keys to .env file
     */
    public function syncMultipleSystemConfigToEnv(array $systemConfigUpdates): array
    {
        $results = [];
        $envUpdates = [];
        $mapping = static::getSystemConfigToEnvMapping();
        
        // Collect all env updates first
        foreach ($systemConfigUpdates as $systemConfigKey => $value) {
            if (isset($mapping[$systemConfigKey])) {
                $envKey = $mapping[$systemConfigKey];
                $envUpdates[$envKey] = $value;
            }
        }
        
        // Batch update env file
        if (!empty($envUpdates)) {
            $results = $this->updateEnvKeys($envUpdates);
        }
        
        return $results;
    }
}
