<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\UnifiedTrainingService;

class RunAutomaticTraining extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'training:run-automatic {--domain= : Process specific domain} {--user= : Process specific user}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run automatic training based on PowerMTA data and reputation scores';

    protected $trainingService;

    public function __construct(UnifiedTrainingService $trainingService)
    {
        parent::__construct();
        $this->trainingService = $trainingService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting automatic training process...');

        try {
            $domainId = $this->option('domain');
            $userId = $this->option('user');
            
            $user = null;
            if ($userId) {
                $user = \App\Models\User::find($userId);
                if (!$user) {
                    $this->error("User with ID {$userId} not found.");
                    return Command::FAILURE;
                }
            }

            $results = $this->trainingService->runAutomaticTraining($user, $domainId);

            $this->info("Automatic training completed successfully!");
            $this->info("Senders processed: {$results['senders_processed']}");
            $this->info("Senders updated: {$results['senders_updated']}");

            if (!empty($results['errors'])) {
                $this->warn("Errors encountered:");
                foreach ($results['errors'] as $error) {
                    $this->error("  - {$error}");
                }
            }

            // Display training statistics
            $stats = $this->trainingService->getTrainingStatistics($user);
            $this->info("\nTraining Statistics:");
            $this->info("Total active senders: {$stats['total_senders']}");
            $this->info("Average reputation: " . round($stats['average_reputation'], 2));
            $this->info("Total daily limits: {$stats['total_daily_limits']}");
            $this->info("Total daily sent: {$stats['total_daily_sent']}");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Automatic training failed: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
} 