<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AutomaticTrainingService;

class RunAutomaticTraining extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'training:run-automatic {--domain= : Process specific domain}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run automatic training based on PowerMTA data and reputation scores';

    protected $automaticTrainingService;

    public function __construct(AutomaticTrainingService $automaticTrainingService)
    {
        parent::__construct();
        $this->automaticTrainingService = $automaticTrainingService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting automatic training process...');

        try {
            $results = $this->automaticTrainingService->runAutomaticTraining();

            $this->info("Training completed successfully!");
            $this->info("Domains processed: {$results['domains_processed']}");
            $this->info("Senders updated: {$results['senders_updated']}");

            if (!empty($results['errors'])) {
                $this->warn("Errors encountered:");
                foreach ($results['errors'] as $error) {
                    $this->error("  - {$error}");
                }
            }

            // Show statistics
            $stats = $this->automaticTrainingService->getTrainingStatistics();
            $this->info("\nTraining Statistics:");
            $this->info("  Total domains: {$stats['total_domains']}");
            $this->info("  Total senders: {$stats['total_senders']}");
            $this->info("  Recent updates: {$stats['recent_updates']}");
            $this->info("  Initial limit: {$stats['initial_limit']}");
            $this->info("  Max limit: {$stats['max_limit']}");
            $this->info("  Min limit: {$stats['min_limit']}");

        } catch (\Exception $e) {
            $this->error("Training failed: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
} 