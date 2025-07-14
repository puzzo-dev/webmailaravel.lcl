<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\RedisSchedulerService;
use Illuminate\Support\Facades\Log;

class ProcessDomainMonitoring extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'domains:monitor 
                            {--force : Force run monitoring regardless of schedule}
                            {--clear : Clear all monitoring data}';

    /**
     * The console command description.
     */
    protected $description = 'Process domain monitoring using Redis scheduler';

    private $redisScheduler;

    public function __construct(RedisSchedulerService $redisScheduler)
    {
        parent::__construct();
        $this->redisScheduler = $redisScheduler;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('clear')) {
            $this->info('Clearing all monitoring data...');
            $this->redisScheduler->clearMonitoringData();
            $this->info('Monitoring data cleared successfully.');
            return;
        }

        if ($this->option('force')) {
            $this->info('Force running domain monitoring...');
            $results = $this->redisScheduler->forceRunMonitoring();
            $this->displayResults($results);
            return;
        }

        $this->info('Processing domain monitoring...');
        
        // Run scheduled monitoring
        $this->redisScheduler->scheduleMonitoring();
        
        // Process any scheduled individual checks
        $this->redisScheduler->processScheduledChecks();
        
        // Show monitoring status
        $status = $this->redisScheduler->getMonitoringStatus();
        $this->displayStatus($status);
        
        $this->info('Domain monitoring processing completed.');
    }

    /**
     * Display monitoring results
     */
    private function displayResults($results)
    {
        if (!$results) {
            $this->warn('No monitoring results available.');
            return;
        }

        $this->info("Monitoring Results:");
        $this->info("Total Domains: " . $results['total_domains']);
        $this->info("Domains Needing Attention: " . $results['domains_needing_attention']);
        $this->info("Last Run: " . $results['last_run']);

        if ($results['domains_needing_attention'] > 0) {
            $this->warn("\nDomains requiring attention:");
            foreach ($results['results'] as $result) {
                if ($result['needs_attention'] ?? false) {
                    $this->line("- {$result['domain']} (Health: {$result['analytics']['overall_health']['score']}%)");
                }
            }
        }
    }

    /**
     * Display monitoring status
     */
    private function displayStatus($status)
    {
        $this->info("\nMonitoring Status:");
        $this->info("Last Run: " . ($status['last_run'] ? $status['last_run']->format('Y-m-d H:i:s') : 'Never'));
        $this->info("Next Run: " . $status['next_run']->format('Y-m-d H:i:s'));
        $this->info("Should Run Now: " . ($status['should_run_now'] ? 'Yes' : 'No'));
    }
}
