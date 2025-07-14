<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\SuppressionListService;
use Illuminate\Support\Facades\Log;

class ExportSuppressionList extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'suppression:export 
                            {--filename= : Custom filename for export}
                            {--type= : Filter by type (unsubscribe, fbl, bounce, complaint, manual)}
                            {--output= : Output format (txt, csv)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Export suppression list to file';

    /**
     * Execute the console command.
     */
    public function handle(SuppressionListService $suppressionListService): int
    {
        $filename = $this->option('filename');
        $type = $this->option('type');
        $output = $this->option('output') ?: 'txt';

        $this->info("Exporting suppression list...");
        
        if ($type) {
            $this->info("Filtering by type: {$type}");
        }
        
        $this->info("Output format: {$output}");

        try {
            // Get statistics first
            $stats = $suppressionListService->getStatistics();
            
            $this->info("📊 Current suppression list statistics:");
            $this->info("   - Total entries: {$stats['total']}");
            $this->info("   - Unsubscribes: {$stats['types']['unsubscribe']}");
            $this->info("   - FBL complaints: {$stats['types']['fbl']}");
            $this->info("   - Bounces: {$stats['types']['bounce']}");
            $this->info("   - Complaints: {$stats['types']['complaint']}");
            $this->info("   - Manual: {$stats['types']['manual']}");

            // Export the suppression list
            $filepath = $suppressionListService->exportSuppressionList($filename);

            $this->info("✅ Suppression list exported successfully!");
            $this->info("📁 File saved to: {$filepath}");

            Log::info('Suppression list exported via CLI', [
                'filepath' => $filepath,
                'type_filter' => $type,
                'output_format' => $output
            ]);

            return 0;

        } catch (\Exception $e) {
            $this->error("❌ Error exporting suppression list: {$e->getMessage()}");
            
            Log::error('Suppression list export failed via CLI', [
                'error' => $e->getMessage()
            ]);

            return 1;
        }
    }
} 