<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

trait CacheServiceTrait
{
    /**
     * Get cached value with fallback using Laravel's Cache facade
     */
    protected function getCached(string $key, callable $callback, int $ttl = 3600): mixed
    {
        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Cache value with custom TTL using Laravel's Cache facade
     */
    protected function cache(string $key, mixed $value, int $ttl = 3600): void
    {
        Cache::put($key, $value, $ttl);
    }

    /**
     * Get cached value or null using Laravel's Cache facade
     */
    protected function getCache(string $key): mixed
    {
        return Cache::get($key);
    }

    /**
     * Check if key exists in cache using Laravel's Cache facade
     */
    protected function hasCache(string $key): bool
    {
        return Cache::has($key);
    }

    /**
     * Remove from cache using Laravel's Cache facade
     */
    protected function forgetCache(string $key): bool
    {
        return Cache::forget($key);
    }

    /**
     * Generate cache key with prefix
     */
    protected function generateCacheKey(string $prefix, array $params = []): string
    {
        $key = $prefix;
        
        if (!empty($params)) {
            $key .= ':' . md5(serialize($params));
        }
        
        return $key;
    }

    /**
     * Cache with tags using Laravel's Cache facade
     */
    protected function cacheWithTags(string $key, mixed $value, array $tags, int $ttl = 3600): void
    {
        Cache::tags($tags)->put($key, $value, $ttl);
    }

    /**
     * Get cached value with tags using Laravel's Cache facade
     */
    protected function getCachedWithTags(string $key, array $tags): mixed
    {
        return Cache::tags($tags)->get($key);
    }

    /**
     * Clear cache by tags using Laravel's Cache facade
     */
    protected function clearCacheByTags(array $tags): void
    {
        Cache::tags($tags)->flush();
    }

    /**
     * Increment cache value using Laravel's Cache facade
     */
    protected function incrementCache(string $key, int $value = 1): int
    {
        return Cache::increment($key, $value);
    }

    /**
     * Decrement cache value using Laravel's Cache facade
     */
    protected function decrementCache(string $key, int $value = 1): int
    {
        return Cache::decrement($key, $value);
    }

    /**
     * Get or set cache value using Laravel's Cache facade
     */
    protected function getOrSetCache(string $key, mixed $value, int $ttl = 3600): mixed
    {
        return Cache::remember($key, $ttl, fn() => $value);
    }

    /**
     * Cache multiple values using Laravel's Cache facade
     */
    protected function cacheMultiple(array $values, int $ttl = 3600): void
    {
        Cache::putMany($values, $ttl);
    }

    /**
     * Get multiple cache values using Laravel's Cache facade
     */
    protected function getMultipleCache(array $keys): array
    {
        return Cache::many($keys);
    }

    /**
     * Forget multiple cache keys using Laravel's Cache facade
     */
    protected function forgetMultipleCache(array $keys): void
    {
        Cache::forget($keys);
    }

    /**
     * Clear all cache using Laravel's Cache facade
     */
    protected function clearAllCache(): void
    {
        Cache::flush();
    }

    /**
     * Get cache store name
     */
    protected function getCacheStore(): string
    {
        return config('cache.default');
    }

    /**
     * Check if cache is available
     */
    protected function isCacheAvailable(): bool
    {
        try {
            Cache::has('test');
            return true;
        } catch (\Exception $e) {
            Log::warning('Cache not available', ['error' => $e->getMessage()]);
            return false;
        }
    }
} 