<?php

namespace App\Console\Commands;

use App\Services\UnifiedTrainingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RunSystemManualTraining extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'system:manual-training {--dry-run : Show what would be updated without making changes}';

    /**
     * The console command description.
     */
    protected $description = 'Run system manual training to increase sender limits based on configuration';

    /**
     * Execute the console command.
     */
    public function handle(UnifiedTrainingService $trainingService): int
    {
        $isDryRun = $this->option('dry-run');
        
        $this->info('Starting system manual training...');
        
        if ($isDryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
            $this->warn('Note: Dry run mode not fully implemented in unified service yet');
        }
        
        try {
            $result = $trainingService->runManualTraining();
            
            $this->info("System manual training completed successfully:");
            $this->info("Training type: {$result['type']}");
            $this->info("Senders processed: {$result['senders_processed']}");
            $this->info("Senders updated: {$result['senders_updated']}");
            
            if (!empty($result['errors'])) {
                $this->warn("Errors encountered:");
                foreach ($result['errors'] as $error) {
                    $this->error("  - {$error}");
                }
            }
            
            // Display training statistics
            $stats = $trainingService->getTrainingStatistics();
            $this->info("\nTraining Statistics:");
            $this->info("Total active senders: {$stats['total_senders']}");
            $this->info("Average reputation: " . round($stats['average_reputation'], 2));
            $this->info("Total daily limits: {$stats['total_daily_limits']}");
            $this->info("Total daily sent: {$stats['total_daily_sent']}");
            
            Log::info('System manual training completed via command', $result);
            
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error('System manual training failed: ' . $e->getMessage());
            Log::error('System manual training command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Command::FAILURE;
        }
    }
}
