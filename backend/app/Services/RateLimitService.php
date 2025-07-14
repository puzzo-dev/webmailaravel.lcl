<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RateLimitService
{
    protected $config;

    public function __construct()
    {
        $this->config = config('rate_limiting', []);
    }

    /**
     * Check if request is allowed using Laravel's Cache facade
     */
    public function isAllowed(string $key, int $maxAttempts, int $decayMinutes = 1): bool
    {
        $current = $this->getCurrentAttempts($key);
        return $current < $maxAttempts;
    }

    /**
     * Increment request count using Laravel's Cache facade
     */
    public function hit(string $key, int $decayMinutes = 1): int
    {
        $current = $this->getCurrentAttempts($key);
        $newCount = $current + 1;
        
        Cache::put($key, $newCount, $decayMinutes * 60);
        
        return $newCount;
    }

    /**
     * Get current attempt count using Laravel's Cache facade
     */
    public function getCurrentAttempts(string $key): int
    {
        return (int) Cache::get($key) ?: 0;
    }

    /**
     * Get remaining attempts using Laravel's Cache facade
     */
    public function getRemainingAttempts(string $key, int $maxAttempts): int
    {
        $current = $this->getCurrentAttempts($key);
        return max(0, $maxAttempts - $current);
    }

    /**
     * Get reset time using Laravel's Cache facade
     */
    public function getResetTime(string $key, int $decayMinutes = 1): Carbon
    {
        $ttl = Cache::getTimeToLive($key);
        return now()->addSeconds($ttl > 0 ? $ttl : $decayMinutes * 60);
    }

    /**
     * Clear rate limit for key using Laravel's Cache facade
     */
    public function clear(string $key): bool
    {
        return Cache::forget($key);
    }

    /**
     * Generate rate limit key
     */
    public function generateKey(Request $request, string $prefix = 'rate_limit'): string
    {
        $identifier = $request->user()?->id ?? $request->ip();
        return "{$prefix}:{$identifier}";
    }

    /**
     * Check rate limit with automatic increment using Laravel's Cache facade
     */
    public function checkAndIncrement(string $key, int $maxAttempts, int $decayMinutes = 1): array
    {
        $current = $this->getCurrentAttempts($key);
        
        if ($current >= $maxAttempts) {
            return [
                'allowed' => false,
                'remaining' => 0,
                'reset_time' => $this->getResetTime($key, $decayMinutes)
            ];
        }

        $newCount = $this->hit($key, $decayMinutes);
        
        return [
            'allowed' => true,
            'remaining' => $maxAttempts - $newCount,
            'reset_time' => $this->getResetTime($key, $decayMinutes)
        ];
    }

    /**
     * Get rate limit info using Laravel's Cache facade
     */
    public function getRateLimitInfo(string $key, int $maxAttempts, int $decayMinutes = 1): array
    {
        $current = $this->getCurrentAttempts($key);
        $remaining = max(0, $maxAttempts - $current);
        $resetTime = $this->getResetTime($key, $decayMinutes);

        return [
            'current_attempts' => $current,
            'max_attempts' => $maxAttempts,
            'remaining_attempts' => $remaining,
            'reset_time' => $resetTime,
            'is_allowed' => $current < $maxAttempts
        ];
    }

    /**
     * Apply rate limiting to request using Laravel's Cache facade
     */
    public function applyRateLimit(Request $request, int $maxAttempts, int $decayMinutes = 1): array
    {
        $key = $this->generateKey($request);
        return $this->checkAndIncrement($key, $maxAttempts, $decayMinutes);
    }

    /**
     * Clear all rate limits for user using Laravel's Cache facade
     */
    public function clearUserRateLimits(int $userId): bool
    {
        $pattern = "rate_limit:{$userId}";
        
        // Note: Laravel Cache doesn't support pattern deletion directly
        // This is a simplified implementation
        Cache::forget($pattern);
        
        Log::info('User rate limits cleared', ['user_id' => $userId]);
        return true;
    }

    /**
     * Get rate limit statistics using Laravel's Cache facade
     */
    public function getStatistics(): array
    {
        // This is a simplified implementation since Laravel Cache doesn't support
        // listing all keys directly. In a real implementation, you might use
        // Redis directly for this feature.
        
        return [
            'total_rate_limits' => 0, // Would need Redis to get actual count
            'cache_driver' => config('cache.default'),
            'timestamp' => now()->toISOString()
        ];
    }

    /**
     * Set custom rate limit using Laravel's Cache facade
     */
    public function setCustomRateLimit(string $key, int $attempts, int $decayMinutes = 1): void
    {
        Cache::put($key, $attempts, $decayMinutes * 60);
        
        Log::info('Custom rate limit set', [
            'key' => $key,
            'attempts' => $attempts,
            'decay_minutes' => $decayMinutes
        ]);
    }

    /**
     * Check if rate limit is exceeded using Laravel's Cache facade
     */
    public function isExceeded(string $key, int $maxAttempts): bool
    {
        $current = $this->getCurrentAttempts($key);
        return $current >= $maxAttempts;
    }

    /**
     * Get rate limit headers for response using Laravel's Cache facade
     */
    public function getRateLimitHeaders(string $key, int $maxAttempts, int $decayMinutes = 1): array
    {
        $current = $this->getCurrentAttempts($key);
        $remaining = max(0, $maxAttempts - $current);
        $resetTime = $this->getResetTime($key, $decayMinutes);

        return [
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => $remaining,
            'X-RateLimit-Reset' => $resetTime->timestamp,
            'Retry-After' => $resetTime->diffInSeconds(now())
        ];
    }
} 