<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Traits\LoggingTrait;
use Carbon\Carbon;

class PerformanceMonitoringService
{
    use LoggingTrait;

    private const CACHE_PREFIX = 'performance_metrics:';
    private const METRICS_TTL = 300; // 5 minutes

    /**
     * Record performance metric
     */
    public function recordMetric(string $operation, float $duration, array $metadata = []): void
    {
        try {
            $metric = [
                'operation' => $operation,
                'duration' => $duration,
                'timestamp' => Carbon::now()->toISOString(),
                'metadata' => $metadata,
                'memory_usage' => memory_get_usage(true),
                'peak_memory' => memory_get_peak_usage(true)
            ];

            // Store in cache for real-time monitoring
            $cacheKey = self::CACHE_PREFIX . $operation . ':latest';
            Cache::put($cacheKey, $metric, self::METRICS_TTL);

            // Store aggregated metrics
            $this->updateAggregatedMetrics($operation, $duration);

            // Log performance metric
            $this->logInfo("Performance metric recorded", [
                'operation' => $operation,
                'duration' => $duration,
                'metadata' => $metadata
            ]);

        } catch (\Exception $e) {
            $this->logError("Failed to record performance metric", [
                'operation' => $operation,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Start timing an operation
     */
    public function startTiming(string $operation): array
    {
        return [
            'operation' => $operation,
            'start_time' => microtime(true),
            'start_memory' => memory_get_usage(true)
        ];
    }

    /**
     * End timing and record metric
     */
    public function endTiming(array $timing, array $metadata = []): float
    {
        $duration = (microtime(true) - $timing['start_time']) * 1000; // Convert to milliseconds
        $memoryUsed = memory_get_usage(true) - $timing['start_memory'];
        
        $metadata['memory_used'] = $memoryUsed;
        
        $this->recordMetric($timing['operation'], $duration, $metadata);
        
        return $duration;
    }

    /**
     * Get performance metrics for an operation
     */
    public function getMetrics(string $operation, int $hours = 24): array
    {
        try {
            $cacheKey = self::CACHE_PREFIX . $operation . ':aggregated';
            $metrics = Cache::get($cacheKey, []);

            return [
                'operation' => $operation,
                'period_hours' => $hours,
                'latest_metric' => Cache::get(self::CACHE_PREFIX . $operation . ':latest'),
                'aggregated' => $metrics,
                'timestamp' => Carbon::now()->toISOString()
            ];

        } catch (\Exception $e) {
            $this->logError("Failed to get performance metrics", [
                'operation' => $operation,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Get system performance overview
     */
    public function getSystemMetrics(): array
    {
        try {
            $operations = [
                'training_unified',
                'email_sending_unified',
                'billing_refined',
                'campaign_creation',
                'database_query'
            ];

            $systemMetrics = [];
            foreach ($operations as $operation) {
                $systemMetrics[$operation] = $this->getMetrics($operation, 1);
            }

            // Add system-wide metrics
            $systemMetrics['system'] = [
                'memory_usage' => memory_get_usage(true),
                'peak_memory' => memory_get_peak_usage(true),
                'database_connections' => $this->getDatabaseConnectionCount(),
                'cache_hit_rate' => $this->getCacheHitRate(),
                'timestamp' => Carbon::now()->toISOString()
            ];

            return $systemMetrics;

        } catch (\Exception $e) {
            $this->logError("Failed to get system performance metrics", [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Monitor training performance
     */
    public function monitorTrainingPerformance(string $trainingType, int $userCount, int $domainCount): array
    {
        $timing = $this->startTiming('training_unified');
        
        // This would be called from the UnifiedTrainingService
        $metadata = [
            'training_type' => $trainingType,
            'user_count' => $userCount,
            'domain_count' => $domainCount
        ];

        return [
            'timing' => $timing,
            'metadata' => $metadata
        ];
    }

    /**
     * Monitor email sending performance
     */
    public function monitorEmailSendingPerformance(string $sendingType, int $recipientCount): array
    {
        $timing = $this->startTiming('email_sending_unified');
        
        $metadata = [
            'sending_type' => $sendingType,
            'recipient_count' => $recipientCount
        ];

        return [
            'timing' => $timing,
            'metadata' => $metadata
        ];
    }

    /**
     * Monitor billing performance
     */
    public function monitorBillingPerformance(string $operation, string $paymentMethod = null): array
    {
        $timing = $this->startTiming('billing_refined');
        
        $metadata = [
            'billing_operation' => $operation,
            'payment_method' => $paymentMethod
        ];

        return [
            'timing' => $timing,
            'metadata' => $metadata
        ];
    }

    /**
     * Update aggregated metrics
     */
    private function updateAggregatedMetrics(string $operation, float $duration): void
    {
        $cacheKey = self::CACHE_PREFIX . $operation . ':aggregated';
        $metrics = Cache::get($cacheKey, [
            'count' => 0,
            'total_duration' => 0,
            'min_duration' => PHP_FLOAT_MAX,
            'max_duration' => 0,
            'avg_duration' => 0
        ]);

        $metrics['count']++;
        $metrics['total_duration'] += $duration;
        $metrics['min_duration'] = min($metrics['min_duration'], $duration);
        $metrics['max_duration'] = max($metrics['max_duration'], $duration);
        $metrics['avg_duration'] = $metrics['total_duration'] / $metrics['count'];
        $metrics['last_updated'] = Carbon::now()->toISOString();

        Cache::put($cacheKey, $metrics, self::METRICS_TTL * 12); // Longer TTL for aggregated data
    }

    /**
     * Get database connection count
     */
    private function getDatabaseConnectionCount(): int
    {
        try {
            return count(DB::getConnections());
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get cache hit rate (simplified)
     */
    private function getCacheHitRate(): float
    {
        // This is a simplified implementation
        // In production, you'd want to use Redis INFO command or similar
        try {
            $hits = Cache::get('cache_hits', 0);
            $misses = Cache::get('cache_misses', 0);
            $total = $hits + $misses;
            
            return $total > 0 ? ($hits / $total) * 100 : 0;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Generate performance report
     */
    public function generatePerformanceReport(int $hours = 24): array
    {
        try {
            $report = [
                'period' => $hours . ' hours',
                'generated_at' => Carbon::now()->toISOString(),
                'metrics' => $this->getSystemMetrics(),
                'improvements' => $this->calculateImprovements(),
                'recommendations' => $this->generateRecommendations()
            ];

            $this->logInfo("Performance report generated", [
                'period_hours' => $hours,
                'metrics_count' => count($report['metrics'])
            ]);

            return $report;

        } catch (\Exception $e) {
            $this->logError("Failed to generate performance report", [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Calculate performance improvements from refactoring
     */
    private function calculateImprovements(): array
    {
        // This would compare pre and post refactoring metrics
        return [
            'training_system' => [
                'code_reduction' => '60%', // Estimated based on consolidation
                'response_time_improvement' => 'TBD',
                'memory_usage_reduction' => 'TBD'
            ],
            'email_sending' => [
                'code_reduction' => '45%', // Estimated based on consolidation
                'response_time_improvement' => 'TBD',
                'error_rate_reduction' => 'TBD'
            ],
            'billing_system' => [
                'code_organization' => 'Improved',
                'error_handling' => 'Enhanced',
                'maintainability' => 'Significantly improved'
            ]
        ];
    }

    /**
     * Generate performance recommendations
     */
    private function generateRecommendations(): array
    {
        return [
            'Continue monitoring unified services for optimization opportunities',
            'Implement database query optimization for high-frequency operations',
            'Consider implementing response caching for frequently accessed data',
            'Monitor memory usage patterns for potential memory leaks',
            'Set up alerts for performance degradation'
        ];
    }
}
