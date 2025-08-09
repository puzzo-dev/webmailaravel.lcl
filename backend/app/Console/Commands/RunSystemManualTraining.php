<?php

namespace App\Console\Commands;

use App\Services\ManualTrainingService;
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
    public function handle(ManualTrainingService $manualTrainingService): int
    {
        $isDryRun = $this->option('dry-run');
        
        $this->info('Starting system manual training...');
        
        if ($isDryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }
        
        try {
            $result = $manualTrainingService->runSystemManualTraining($isDryRun);
            
            $this->info("System manual training completed successfully:");
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Senders processed', $result['senders_processed']],
                    ['Senders updated', $result['senders_updated']],
                    ['Average increase', $result['average_increase'] . ' emails/day'],
                    ['Processing time', $result['processing_time'] . ' seconds'],
                ]
            );
            
            if ($result['senders_updated'] > 0) {
                $this->info("✅ Successfully updated {$result['senders_updated']} sender limits");
            } else {
                $this->comment("ℹ️  No senders needed limit updates at this time");
            }
            
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
