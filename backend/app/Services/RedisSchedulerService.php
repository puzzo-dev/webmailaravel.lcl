<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\Domain;
use App\Services\PowerMTAService;

class RedisSchedulerService
{
    private $redis;
    private $powerMTAService;

    public function __construct(PowerMTAService $powerMTAService)
    {
        $this->redis = Redis::connection();
        $this->powerMTAService = $powerMTAService;
    }

    /**
     * Schedule domain monitoring
     */
    public function scheduleMonitoring()
    {
        $key = 'domain_monitoring_schedule';
        $now = Carbon::now();
        
        // Check if we should run monitoring
        if ($this->shouldRunMonitoring()) {
            Log::info('Running scheduled domain monitoring');
            
            // Run monitoring for all domains
            $this->runDomainMonitoring();
            
            // Update last run timestamp
            $this->redis->set($key, $now->toISOString());
            $this->redis->expire($key, 86400 * 7); // Expire after 7 days
        }
    }

    /**
     * Check if monitoring should run (every 24 hours)
     */
    private function shouldRunMonitoring(): bool
    {
        $key = 'domain_monitoring_schedule';
        $lastRun = $this->redis->get($key);
        
        if (!$lastRun) {
            return true;
        }
        
        $lastRunTime = Carbon::parse($lastRun);
        $now = Carbon::now();
        
        return $now->diffInHours($lastRunTime) >= 24;
    }

    /**
     * Run monitoring for all domains
     */
    private function runDomainMonitoring()
    {
        try {
            $domains = Domain::all();
            $results = [];
            
            foreach ($domains as $domain) {
                $result = $this->monitorDomain($domain);
                $results[] = $result;
                
                // Store result in Redis with expiration
                $this->storeDomainResult($domain->id, $result);
            }
            
            // Store overall monitoring results
            $this->storeOverallResults($results);
            
            Log::info('Domain monitoring completed', [
                'domains_monitored' => count($domains),
                'results' => $results
            ]);
            
        } catch (\Exception $e) {
            Log::error('Domain monitoring failed', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Monitor individual domain
     */
    private function monitorDomain(Domain $domain)
    {
        try {
            // Apply training configuration
            $trainingResult = $this->powerMTAService->applyTrainingConfig($domain->id);
            
            // Get domain analytics
            $analytics = $this->powerMTAService->getComprehensiveDomainAnalytics($domain->domain, 24);
            
            // Determine if domain needs attention
            $needsAttention = $this->determineIfDomainNeedsAttention($analytics);
            
            $result = [
                'domain_id' => $domain->id,
                'domain' => $domain->domain,
                'training_result' => $trainingResult,
                'analytics' => $analytics,
                'needs_attention' => $needsAttention,
                'monitored_at' => Carbon::now()->toISOString()
            ];
            
            // Update domain with latest metrics
            $this->updateDomainMetrics($domain, $analytics);
            
            return $result;
            
        } catch (\Exception $e) {
            Log::error('Failed to monitor domain', [
                'domain' => $domain->domain,
                'error' => $e->getMessage()
            ]);
            
            return [
                'domain_id' => $domain->id,
                'domain' => $domain->domain,
                'error' => $e->getMessage(),
                'monitored_at' => Carbon::now()->toISOString()
            ];
        }
    }

    /**
     * Determine if domain needs attention based on metrics
     */
    private function determineIfDomainNeedsAttention($analytics): bool
    {
        $metrics = $analytics['accounting_metrics'];
        $health = $analytics['overall_health'];
        
        // Check for poor health
        if ($health['score'] < 70) {
            return true;
        }
        
        // Check for high bounce rate
        if ($metrics['bounce_rate'] > 5) {
            return true;
        }
        
        // Check for high complaint rate
        if ($metrics['complaint_rate'] > 0.1) {
            return true;
        }
        
        // Check for low delivery rate
        if ($metrics['delivery_rate'] < 90) {
            return true;
        }
        
        // Check for excessive FBL complaints
        if ($analytics['fbl_data']['total_complaints'] > 10) {
            return true;
        }
        
        return false;
    }

    /**
     * Update domain metrics in database
     */
    private function updateDomainMetrics(Domain $domain, $analytics)
    {
        $metrics = $analytics['accounting_metrics'];
        
        $domain->update([
            'total_sent' => $metrics['total_sent'],
            'delivery_rate' => $metrics['delivery_rate'],
            'bounce_rate' => $metrics['bounce_rate'],
            'complaint_rate' => $metrics['complaint_rate'],
            'last_monitored' => Carbon::now(),
            'health_score' => $analytics['overall_health']['score'],
            'health_status' => $analytics['overall_health']['status']
        ]);
    }

    /**
     * Store domain result in Redis
     */
    private function storeDomainResult($domainId, $result)
    {
        $key = "domain_monitoring_result:{$domainId}";
        $this->redis->set($key, json_encode($result));
        $this->redis->expire($key, 86400 * 7); // Expire after 7 days
    }

    /**
     * Store overall monitoring results
     */
    private function storeOverallResults($results)
    {
        $key = 'domain_monitoring_results';
        $summary = [
            'total_domains' => count($results),
            'domains_needing_attention' => count(array_filter($results, function($r) { 
                return $r['needs_attention'] ?? false; 
            })),
            'last_run' => Carbon::now()->toISOString(),
            'results' => $results
        ];
        
        $this->redis->set($key, json_encode($summary));
        $this->redis->expire($key, 86400 * 7); // Expire after 7 days
    }

    /**
     * Get domain monitoring result
     */
    public function getDomainMonitoringResult($domainId)
    {
        $key = "domain_monitoring_result:{$domainId}";
        $result = $this->redis->get($key);
        
        return $result ? json_decode($result, true) : null;
    }

    /**
     * Get all monitoring results
     */
    public function getAllMonitoringResults()
    {
        $key = 'domain_monitoring_results';
        $results = $this->redis->get($key);
        
        return $results ? json_decode($results, true) : null;
    }

    /**
     * Force run monitoring (manual trigger)
     */
    public function forceRunMonitoring()
    {
        Log::info('Force running domain monitoring');
        
        // Run monitoring regardless of schedule
        $this->runDomainMonitoring();
        
        // Update last run timestamp
        $key = 'domain_monitoring_schedule';
        $this->redis->set($key, Carbon::now()->toISOString());
        $this->redis->expire($key, 86400 * 7);
        
        return $this->getAllMonitoringResults();
    }

    /**
     * Get monitoring schedule status
     */
    public function getMonitoringStatus()
    {
        $key = 'domain_monitoring_schedule';
        $lastRun = $this->redis->get($key);
        
        $status = [
            'last_run' => $lastRun ? Carbon::parse($lastRun) : null,
            'next_run' => $lastRun ? Carbon::parse($lastRun)->addHours(24) : Carbon::now(),
            'should_run_now' => $this->shouldRunMonitoring()
        ];
        
        return $status;
    }

    /**
     * Schedule individual domain check
     */
    public function scheduleDomainCheck($domainId, $delayMinutes = 0)
    {
        $key = "domain_check_schedule:{$domainId}";
        $runAt = Carbon::now()->addMinutes($delayMinutes);
        
        $this->redis->set($key, $runAt->toISOString());
        $this->redis->expire($key, 86400); // Expire after 24 hours
        
        Log::info('Domain check scheduled', [
            'domain_id' => $domainId,
            'run_at' => $runAt->toISOString()
        ]);
    }

    /**
     * Process scheduled domain checks
     */
    public function processScheduledChecks()
    {
        $pattern = 'domain_check_schedule:*';
        $keys = $this->redis->keys($pattern);
        
        foreach ($keys as $key) {
            $runAt = $this->redis->get($key);
            
            if ($runAt && Carbon::parse($runAt)->isPast()) {
                $domainId = str_replace('domain_check_schedule:', '', $key);
                
                try {
                    $domain = Domain::find($domainId);
                    if ($domain) {
                        $result = $this->monitorDomain($domain);
                        $this->storeDomainResult($domainId, $result);
                        
                        Log::info('Scheduled domain check completed', [
                            'domain_id' => $domainId,
                            'domain' => $domain->domain
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Scheduled domain check failed', [
                        'domain_id' => $domainId,
                        'error' => $e->getMessage()
                    ]);
                }
                
                // Remove the scheduled check
                $this->redis->del($key);
            }
        }
    }

    /**
     * Clear all monitoring data
     */
    public function clearMonitoringData()
    {
        $patterns = [
            'domain_monitoring_*',
            'domain_check_schedule:*'
        ];
        
        foreach ($patterns as $pattern) {
            $keys = $this->redis->keys($pattern);
            if (!empty($keys)) {
                $this->redis->del($keys);
            }
        }
        
        Log::info('All monitoring data cleared');
    }
}
