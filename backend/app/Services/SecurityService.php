<?php

namespace App\Services;

use App\Models\User;
use App\Models\ApiKey;
use App\Models\SecurityLog;
use App\Traits\LoggingTrait;
use App\Traits\CacheManagementTrait;
use App\Traits\ValidationTrait;
use App\Traits\FileProcessingTrait;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Carbon\Carbon;
use PragmaRX\Google2FA\Google2FA;

class SecurityService
{
    use LoggingTrait, CacheManagementTrait, ValidationTrait, FileProcessingTrait;

    protected $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Generate 2FA secret for user
     */
    public function generate2FASecret(User $user): array
    {
        $secret = $this->google2fa->generateSecretKey();
        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        // Store secret temporarily (will be confirmed when user verifies)
        $this->putCache("2fa_secret_{$user->id}", $secret, 300); // 5 minutes

        return [
            'secret' => $secret,
            'qr_code' => $qrCodeUrl,
            'backup_codes' => $this->generateBackupCodes($user)
        ];
    }

    /**
     * Verify 2FA code
     */
    public function verify2FACode(User $user, string $code): bool
    {
        if ($user->two_factor_secret) {
            return $this->google2fa->verifyKey($user->two_factor_secret, $code);
        }

        // Check if it's initial setup
        $tempSecret = $this->getCache("2fa_secret_{$user->id}");
        if ($tempSecret && $this->google2fa->verifyKey($tempSecret, $code)) {
            $this->enable2FA($user, $tempSecret);
            return true;
        }

        return false;
    }

    /**
     * Enable 2FA for user
     */
    public function enable2FA(User $user, string $secret): void
    {
        $user->update([
            'two_factor_secret' => $secret,
            'two_factor_enabled' => true,
            'two_factor_enabled_at' => now()
        ]);

        $this->forgetCache("2fa_secret_{$user->id}");

        $this->logSecurityEvent($user, '2fa_enabled', [
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent()
        ]);
    }

    /**
     * Disable 2FA for user
     */
    public function disable2FA(User $user): void
    {
        $user->update([
            'two_factor_secret' => null,
            'two_factor_enabled' => false,
            'two_factor_enabled_at' => null
        ]);

        $this->logSecurityEvent($user, '2fa_disabled', [
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent()
        ]);
    }

    /**
     * Generate backup codes
     */
    protected function generateBackupCodes(User $user): array
    {
        $codes = [];
        for ($i = 0; $i < 8; $i++) {
            $codes[] = strtoupper(Str::random(8));
        }

        $user->update(['backup_codes' => json_encode($codes)]);

        return $codes;
    }

    /**
     * Verify backup code
     */
    public function verifyBackupCode(User $user, string $code): bool
    {
        $backupCodes = json_decode($user->backup_codes ?? '[]', true);
        
        if (in_array($code, $backupCodes)) {
            // Remove used code
            $backupCodes = array_diff($backupCodes, [$code]);
            $user->update(['backup_codes' => json_encode(array_values($backupCodes))]);
            
            return true;
        }

        return false;
    }

    /**
     * Generate API key
     */
    public function generateApiKey(User $user, string $name): array
    {
        $key = 'sk_' . Str::random(32);
        $secret = Str::random(64);

        $apiKey = ApiKey::create([
            'user_id' => $user->id,
            'name' => $name,
            'key' => $key,
            'secret_hash' => Hash::make($secret),
            'permissions' => json_encode(['read', 'write']),
            'last_used_at' => null,
            'expires_at' => now()->addYear()
        ]);

        $this->logSecurityEvent($user, 'api_key_created', [
            'api_key_id' => $apiKey->id,
            'name' => $name,
            'ip' => request()->ip()
        ]);

        return [
            'id' => $apiKey->id,
            'key' => $key,
            'secret' => $secret, // Only shown once
            'name' => $name,
            'permissions' => ['read', 'write'],
            'expires_at' => $apiKey->expires_at
        ];
    }

    /**
     * Validate API key
     */
    public function validateApiKey(string $key, string $secret = null): ?ApiKey
    {
        $apiKey = ApiKey::where('key', $key)->first();

        if (!$apiKey) {
            return null;
        }

        // Check if expired
        if ($apiKey->expires_at && $apiKey->expires_at->isPast()) {
            return null;
        }

        // If secret provided, validate it
        if ($secret && !Hash::check($secret, $apiKey->secret_hash)) {
            return null;
        }

        // Update last used
        $apiKey->update(['last_used_at' => now()]);

        return $apiKey;
    }

    /**
     * Revoke API key
     */
    public function revokeApiKey(User $user, int $apiKeyId): bool
    {
        $apiKey = ApiKey::where('user_id', $user->id)
            ->where('id', $apiKeyId)
            ->first();

        if (!$apiKey) {
            return false;
        }

        $apiKey->delete();

        $this->logSecurityEvent($user, 'api_key_revoked', [
            'api_key_id' => $apiKeyId,
            'ip' => request()->ip()
        ]);

        return true;
    }

    /**
     * Check for suspicious activity
     */
    public function checkSuspiciousActivity(User $user): array
    {
        $suspiciousEvents = [];
        $riskScore = 0;

        // Check for multiple failed login attempts
        $failedLogins = SecurityLog::where('user_id', $user->id)
            ->where('event', 'login_failed')
            ->where('created_at', '>=', now()->subHours(1))
            ->count();

        if ($failedLogins > 5) {
            $suspiciousEvents[] = 'Multiple failed login attempts';
            $riskScore += 30;
        }

        // Check for login from new location
        $recentLogins = SecurityLog::where('user_id', $user->id)
            ->where('event', 'login_successful')
            ->where('created_at', '>=', now()->subDays(7))
            ->get();

        $locations = $recentLogins->pluck('metadata.ip')->unique();
        if ($locations->count() > 3) {
            $suspiciousEvents[] = 'Login from multiple locations';
            $riskScore += 20;
        }

        // Check for unusual API usage
        $apiUsage = SecurityLog::where('user_id', $user->id)
            ->where('event', 'api_request')
            ->where('created_at', '>=', now()->subHour())
            ->count();

        if ($apiUsage > 100) {
            $suspiciousEvents[] = 'Unusual API usage';
            $riskScore += 25;
        }

        return [
            'risk_score' => min($riskScore, 100),
            'suspicious_events' => $suspiciousEvents,
            'recommendations' => $this->getSecurityRecommendations($riskScore)
        ];
    }

    /**
     * Get security recommendations
     */
    protected function getSecurityRecommendations(int $riskScore): array
    {
        $recommendations = [];

        if ($riskScore > 50) {
            $recommendations[] = 'Enable two-factor authentication';
            $recommendations[] = 'Change your password';
            $recommendations[] = 'Review recent login activity';
        }

        if ($riskScore > 30) {
            $recommendations[] = 'Enable login notifications';
            $recommendations[] = 'Review API key usage';
        }

        if ($riskScore > 10) {
            $recommendations[] = 'Monitor account activity';
        }

        return $recommendations;
    }

    /**
     * Log security event
     */
    public function logSecurityEvent(User $user, string $event, array $metadata = []): void
    {
        SecurityLog::create([
            'user_id' => $user->id,
            'event' => $event,
            'metadata' => json_encode(array_merge($metadata, [
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'timestamp' => now()->toISOString()
            ]))
        ]);

        $this->logInfo("Security event: {$event}", [
            'user_id' => $user->id,
            'event' => $event,
            'metadata' => $metadata
        ]);
    }

    /**
     * Get user security summary
     */
    public function getUserSecuritySummary(User $user): array
    {
        $recentEvents = SecurityLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $apiKeys = ApiKey::where('user_id', $user->id)
            ->where('expires_at', '>', now())
            ->get();

        $suspiciousActivity = $this->checkSuspiciousActivity($user);

        return [
            'two_factor_enabled' => $user->two_factor_enabled,
            'two_factor_enabled_at' => $user->two_factor_enabled_at,
            'last_password_change' => $user->last_password_change,
            'active_api_keys' => $apiKeys->count(),
            'recent_security_events' => $recentEvents->toArray(),
            'suspicious_activity' => $suspiciousActivity,
            'security_score' => $this->calculateSecurityScore($user)
        ];
    }

    /**
     * Calculate security score
     */
    protected function calculateSecurityScore(User $user): int
    {
        $score = 0;

        // 2FA enabled
        if ($user->two_factor_enabled) {
            $score += 30;
        }

        // Recent password change
        if ($user->last_password_change && $user->last_password_change->diffInDays(now()) < 90) {
            $score += 20;
        }

        // No suspicious activity
        $suspiciousActivity = $this->checkSuspiciousActivity($user);
        if ($suspiciousActivity['risk_score'] < 10) {
            $score += 25;
        }

        // Strong password (would need password strength validation)
        $score += 25;

        return min($score, 100);
    }

    /**
     * Get security logs
     */
    public function getSecurityLogs(User $user, int $limit = 50): array
    {
        $logs = SecurityLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $logs->map(function ($log) {
            return [
                'id' => $log->id,
                'event' => $log->event,
                'metadata' => json_decode($log->metadata, true),
                'created_at' => $log->created_at->toISOString()
            ];
        })->toArray();
    }

    /**
     * Clean old security logs
     */
    public function cleanOldSecurityLogs(int $days = 90): int
    {
        return SecurityLog::where('created_at', '<', now()->subDays($days))->delete();
    }
} 
 
 
 
 
 