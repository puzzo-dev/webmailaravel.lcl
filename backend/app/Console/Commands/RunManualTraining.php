<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\UnifiedTrainingService;
use App\Models\User;

class RunManualTraining extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'training:run-manual {--user-id= : Run manual training for specific user ID} {--domain= : Process specific domain}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run manual training to increase sender limits by percentage daily';

    protected $trainingService;

    /**
     * Create a new command instance.
     */
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
        $this->info('Starting manual training process...');

        try {
            $userId = $this->option('user-id');
            $domainId = $this->option('domain');
            
            $user = null;
            if ($userId) {
                $user = User::find($userId);
                if (!$user) {
                    $this->error("User with ID {$userId} not found.");
                    return Command::FAILURE;
                }
            }
            
            $results = $this->trainingService->runManualTraining($user, $domainId);
            
            if ($user) {
                $this->info("Manual training completed for user: {$user->email}");
            } elseif ($domainId) {
                $this->info("Manual training completed for domain: {$domainId}");
            } else {
                $this->info("Manual training completed for all users");
            }
            
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
            $this->error("Manual training failed: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
