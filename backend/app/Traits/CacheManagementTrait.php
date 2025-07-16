<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

trait CacheManagementTrait
{
    /**
     * Get cached data with fallback
     */
    protected function getCachedData(string $key, callable $callback, int $ttl = 3600): mixed
    {
        return Cache::remember($key, $ttl, function () use ($callback, $key) {
            $this->logCacheMiss($key);
            return $callback();
        });
    }

    /**
     * Get cached data with tags
     */
    protected function getCachedDataWithTags(string $key, array $tags, callable $callback, int $ttl = 3600): mixed
    {
        return Cache::tags($tags)->remember($key, $ttl, function () use ($callback, $key) {
            $this->logCacheMiss($key, $tags);
            return $callback();
        });
    }

    /**
     * Set cached data with logging
     */
    protected function setCachedData(string $key, mixed $value, int $ttl = 3600): bool
    {
        $result = Cache::put($key, $value, $ttl);
        
        if ($result) {
            $this->logCacheSet($key, $ttl);
        }
        
        return $result;
    }

    /**
     * Set cached data with tags
     */
    protected function setCachedDataWithTags(string $key, mixed $value, array $tags, int $ttl = 3600): bool
    {
        $result = Cache::tags($tags)->put($key, $value, $ttl);
        
        if ($result) {
            $this->logCacheSet($key, $ttl, $tags);
        }
        
        return $result;
    }

    /**
     * Forget cached data
     */
    protected function forgetCachedData(string $key): bool
    {
        $result = Cache::forget($key);
        
        if ($result) {
            $this->logCacheForget($key);
        }
        
        return $result;
    }

    /**
     * Forget cached data with tags
     */
    protected function forgetCachedDataWithTags(string $key, array $tags): bool
    {
        $result = Cache::tags($tags)->forget($key);
        
        if ($result) {
            $this->logCacheForget($key, $tags);
        }
        
        return $result;
    }

    /**
     * Flush all cached data with tags
     */
    protected function flushCachedDataWithTags(array $tags): bool
    {
        $result = Cache::tags($tags)->flush();
        
        if ($result) {
            $this->logCacheFlush($tags);
        }
        
        return $result;
    }

    /**
     * Check if data exists in cache
     */
    protected function hasCachedData(string $key): bool
    {
        return Cache::has($key);
    }

    /**
     * Get cached data if exists, otherwise return null
     */
    protected function getCachedDataIfExists(string $key): mixed
    {
        if (Cache::has($key)) {
            $this->logCacheHit($key);
            return Cache::get($key);
        }
        
        $this->logCacheMiss($key);
        return null;
    }

    /**
     * Increment cached counter
     */
    protected function incrementCachedCounter(string $key, int $value = 1, int $ttl = 3600): int
    {
        $result = Cache::increment($key, $value);
        
        // Set TTL if key doesn't exist
        if ($result === $value) {
            Cache::put($key, $result, $ttl);
        }
        
        $this->logCacheIncrement($key, $value, $result);
        
        return $result;
    }

    /**
     * Decrement cached counter
     */
    protected function decrementCachedCounter(string $key, int $value = 1): int
    {
        $result = Cache::decrement($key, $value);
        
        $this->logCacheDecrement($key, $value, $result);
        
        return $result;
    }

    /**
     * Get cache statistics
     */
    protected function getCacheStatistics(): array
    {
        return [
            'driver' => config('cache.default'),
            'prefix' => config('cache.prefix'),
            'timestamp' => now()->toISOString()
        ];
    }

    /**
     * Cache user-specific data
     */
    protected function cacheUserData(int $userId, string $key, mixed $value, int $ttl = 3600): bool
    {
        $cacheKey = "user:{$userId}:{$key}";
        return $this->setCachedData($cacheKey, $value, $ttl);
    }

    /**
     * Get cached user data
     */
    protected function getCachedUserData(int $userId, string $key, callable $callback = null, int $ttl = 3600): mixed
    {
        $cacheKey = "user:{$userId}:{$key}";
        
        if ($callback) {
            return $this->getCachedData($cacheKey, $callback, $ttl);
        }
        
        return $this->getCachedDataIfExists($cacheKey);
    }

    /**
     * Forget cached user data
     */
    protected function forgetCachedUserData(int $userId, string $key): bool
    {
        $cacheKey = "user:{$userId}:{$key}";
        return $this->forgetCachedData($cacheKey);
    }

    /**
     * Cache model data with automatic invalidation
     */
    protected function cacheModelData(string $model, int $id, string $key, mixed $value, int $ttl = 3600): bool
    {
        $cacheKey = "model:{$model}:{$id}:{$key}";
        return $this->setCachedData($cacheKey, $value, $ttl);
    }

    /**
     * Get cached model data
     */
    protected function getCachedModelData(string $model, int $id, string $key, callable $callback = null, int $ttl = 3600): mixed
    {
        $cacheKey = "model:{$model}:{$id}:{$key}";
        
        if ($callback) {
            return $this->getCachedData($cacheKey, $callback, $ttl);
        }
        
        return $this->getCachedDataIfExists($cacheKey);
    }

    /**
     * Forget cached model data
     */
    protected function forgetCachedModelData(string $model, int $id, string $key = null): bool
    {
        if ($key) {
            $cacheKey = "model:{$model}:{$id}:{$key}";
            return $this->forgetCachedData($cacheKey);
        }
        
        // Forget all cached data for this model instance
        $pattern = "model:{$model}:{$id}:*";
        return $this->forgetCachedDataByPattern($pattern);
    }

    /**
     * Forget cached data by pattern (Redis only)
     */
    protected function forgetCachedDataByPattern(string $pattern): bool
    {
        if (config('cache.default') === 'redis') {
            $redis = Cache::getRedis();
            $keys = $redis->keys($pattern);
            
            if (!empty($keys)) {
                $redis->del($keys);
                $this->logCacheForgetByPattern($pattern, count($keys));
                return true;
            }
        }
        
        return false;
    }

    /**
     * Cache API response data
     */
    protected function cacheApiResponse(string $endpoint, array $params, mixed $data, int $ttl = 1800): bool
    {
        $cacheKey = "api:{$endpoint}:" . md5(serialize($params));
        return $this->setCachedData($cacheKey, $data, $ttl);
    }

    /**
     * Get cached API response
     */
    protected function getCachedApiResponse(string $endpoint, array $params): mixed
    {
        $cacheKey = "api:{$endpoint}:" . md5(serialize($params));
        return $this->getCachedDataIfExists($cacheKey);
    }

    /**
     * Cache with automatic refresh
     */
    protected function cacheWithAutoRefresh(string $key, callable $callback, int $ttl = 3600, int $refreshThreshold = 300): mixed
    {
        $data = Cache::get($key);
        
        if ($data === null) {
            // Cache miss, fetch new data
            $data = $callback();
            $this->setCachedData($key, $data, $ttl);
            return $data;
        }
        
        // Check if we need to refresh
        $ttlRemaining = Cache::getTimeToLive($key);
        if ($ttlRemaining !== null && $ttlRemaining < $refreshThreshold) {
            // Refresh in background
            $this->refreshCacheInBackground($key, $callback, $ttl);
        }
        
        return $data;
    }

    /**
     * Refresh cache in background
     */
    protected function refreshCacheInBackground(string $key, callable $callback, int $ttl): void
    {
        // In a real implementation, you might dispatch a job here
        try {
            $newData = $callback();
            $this->setCachedData($key, $newData, $ttl);
            $this->logCacheRefresh($key);
        } catch (\Exception $e) {
            $this->logCacheRefreshError($key, $e->getMessage());
        }
    }

    /**
     * Log cache hit
     */
    protected function logCacheHit(string $key, array $tags = []): void
    {
        Log::debug('Cache hit', [
            'key' => $key,
            'tags' => $tags
        ]);
    }

    /**
     * Log cache miss
     */
    protected function logCacheMiss(string $key, array $tags = []): void
    {
        Log::debug('Cache miss', [
            'key' => $key,
            'tags' => $tags
        ]);
    }

    /**
     * Log cache set
     */
    protected function logCacheSet(string $key, int $ttl, array $tags = []): void
    {
        Log::debug('Cache set', [
            'key' => $key,
            'ttl' => $ttl,
            'tags' => $tags
        ]);
    }

    /**
     * Log cache forget
     */
    protected function logCacheForget(string $key, array $tags = []): void
    {
        Log::debug('Cache forget', [
            'key' => $key,
            'tags' => $tags
        ]);
    }

    /**
     * Log cache flush
     */
    protected function logCacheFlush(array $tags): void
    {
        Log::debug('Cache flush', [
            'tags' => $tags
        ]);
    }

    /**
     * Log cache increment
     */
    protected function logCacheIncrement(string $key, int $value, int $result): void
    {
        Log::debug('Cache increment', [
            'key' => $key,
            'value' => $value,
            'result' => $result
        ]);
    }

    /**
     * Log cache decrement
     */
    protected function logCacheDecrement(string $key, int $value, int $result): void
    {
        Log::debug('Cache decrement', [
            'key' => $key,
            'value' => $value,
            'result' => $result
        ]);
    }

    /**
     * Log cache forget by pattern
     */
    protected function logCacheForgetByPattern(string $pattern, int $count): void
    {
        Log::debug('Cache forget by pattern', [
            'pattern' => $pattern,
            'count' => $count
        ]);
    }

    /**
     * Log cache refresh
     */
    protected function logCacheRefresh(string $key): void
    {
        Log::debug('Cache refresh', [
            'key' => $key
        ]);
    }

    /**
     * Log cache refresh error
     */
    protected function logCacheRefreshError(string $key, string $error): void
    {
        Log::error('Cache refresh error', [
            'key' => $key,
            'error' => $error
        ]);
    }
} 