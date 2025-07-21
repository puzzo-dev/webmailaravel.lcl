<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BounceProcessingService;

class ProcessPowerMTAFiles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pmta:process-bounces {--hours=24 : Process files from last N hours}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process PowerMTA CSV files (Acct, Diag, FBL) for bounce detection and suppression list management';

    protected $bounceService;

    public function __construct(BounceProcessingService $bounceService)
    {
        parent::__construct();
        $this->bounceService = $bounceService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting PowerMTA file processing for bounce detection...');
        
        try {
            $results = $this->bounceService->processPowerMTAFiles();
            
            $this->info('✅ PowerMTA processing completed successfully!');
            $this->line('');
            
            // Display results
            $this->displayResults($results);
            
            if (!empty($results['errors'])) {
                $this->warn('⚠️  Some errors occurred during processing:');
                foreach ($results['errors'] as $error) {
                    $this->error("  - {$error}");
                }
            }
            
        } catch (\Exception $e) {
            $this->error('❌ PowerMTA processing failed: ' . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
    
    protected function displayResults(array $results): void
    {
        $this->table(
            ['Metric', 'Count'],
            [
                ['Accounting Files Processed', $results['acct_files_processed']],
                ['Diagnostic Files Processed', $results['diag_files_processed']],
                ['FBL Files Processed', $results['fbl_files_processed']],
                ['Failed Deliveries Added', $results['total_failures_added']],
                ['Hard Bounces Added', $results['total_bounces_added']],
                ['Complaints Added', $results['total_complaints_added']],
                ['Total Emails Suppressed', 
                    $results['total_failures_added'] + 
                    $results['total_bounces_added'] + 
                    $results['total_complaints_added']
                ],
            ]
        );
    }
}
