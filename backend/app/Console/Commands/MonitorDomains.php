<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Domain;
use App\Services\PowerMTAService;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class MonitorDomains extends Command
{
    protected $signature = 'domains:monitor 
                            {--force : Force run monitoring regardless of schedule}
                            {--clear : Clear monitoring cache}';

    protected $description = 'Monitor domains using Laravel scheduler';

    protected PowerMTAService $powerMTAService;

    public function __construct(PowerMTAService $powerMTAService)
    {
        parent::__construct();
        $this->powerMTAService = $powerMTAService;
    }

    public function handle()
    {
        if ($this->option('clear')) {
            $this->clearMonitoringData();
            return;
        }

        if ($this->option('force') || $this->shouldRunMonitoring()) {
            $this->runMonitoring();
        } else {
            $this->info('Monitoring not due yet. Use --force to run anyway.');
        }
    }

    protected function shouldRunMonitoring(): bool
    {
        $lastRun = Cache::get('domain_monitoring_last_run');
        
        if (!$lastRun) {
            return true;
        }

        return Carbon::parse($lastRun)->diffInHours(now()) >= 24;
    }

    protected function runMonitoring()
    {
        $this->info('Starting domain monitoring...');
        
        $domains = Domain::all();
        $results = [];

        foreach ($domains as $domain) {
            $this->info("Monitoring domain: {$domain->name}");
            
            try {
                $analytics = $this->powerMTAService->getComprehensiveDomainAnalytics($domain->name, 24);
                $this->updateDomainMetrics($domain, $analytics);
                
                $results[] = [
                    'domain' => $domain->name,
                    'health_score' => $analytics['overall_health']['score'] ?? 0,
                    'status' => 'success'
                ];
            } catch (\Exception $e) {
                $this->error("Failed to monitor {$domain->name}: " . $e->getMessage());
                $results[] = [
                    'domain' => $domain->name,
                    'status' => 'error',
                    'error' => $e->getMessage()
                ];
            }
        }

        // Cache results
        Cache::put('domain_monitoring_results', $results, now()->addDays(7));
        Cache::put('domain_monitoring_last_run', now(), now()->addDays(7));

        $this->info('Domain monitoring completed. Monitored ' . count($domains) . ' domains.');
    }

    protected function updateDomainMetrics(Domain $domain, array $analytics)
    {
        $metrics = $analytics['accounting_metrics'] ?? [];
        
        $domain->update([
            'total_sent' => $metrics['total_sent'] ?? 0,
            'delivery_rate' => $metrics['delivery_rate'] ?? 0,
            'bounce_rate' => $metrics['bounce_rate'] ?? 0,
            'complaint_rate' => $metrics['complaint_rate'] ?? 0,
            'last_monitored' => now(),
            'health_score' => $analytics['overall_health']['score'] ?? 0,
            'health_status' => $analytics['overall_health']['status'] ?? 'unknown'
        ]);
    }

    protected function clearMonitoringData()
    {
        Cache::forget('domain_monitoring_results');
        Cache::forget('domain_monitoring_last_run');
        $this->info('Monitoring data cleared.');
    }
}
