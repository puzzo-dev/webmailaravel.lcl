<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\SuppressionListService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ProcessFBLFile extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fbl:process 
                            {filepath : Path to the FBL file}
                            {--source= : Source identifier for the FBL file}
                            {--type=fbl : Type of suppression (fbl, bounce, complaint)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process FBL (Feedback Loop) file and add recipients to suppression list';

    /**
     * Execute the console command.
     */
    public function handle(SuppressionListService $suppressionListService): int
    {
        $filepath = $this->argument('filepath');
        $source = $this->option('source') ?: 'cli_fbl';
        $type = $this->option('type');

        $this->info("Processing FBL file: {$filepath}");
        $this->info("Source: {$source}");
        $this->info("Type: {$type}");

        try {
            // Check if file exists
            if (!Storage::disk('local')->exists($filepath)) {
                $this->error("File not found: {$filepath}");
                return 1;
            }

            // Process the FBL file
            $result = $suppressionListService->processFBLFile($filepath, $source);

            if ($result['success']) {
                $this->info("✅ FBL file processed successfully!");
                $this->info("📊 Statistics:");
                $this->info("   - Processed: {$result['processed']} lines");
                $this->info("   - Added to suppression list: {$result['added']} emails");
                $this->info("   - Skipped: {$result['skipped']} lines");

                Log::info('FBL file processed via CLI', [
                    'filepath' => $filepath,
                    'source' => $source,
                    'result' => $result
                ]);

                return 0;
            } else {
                $this->error("❌ Failed to process FBL file: {$result['error']}");
                return 1;
            }

        } catch (\Exception $e) {
            $this->error("❌ Error processing FBL file: {$e->getMessage()}");
            
            Log::error('FBL file processing failed via CLI', [
                'filepath' => $filepath,
                'error' => $e->getMessage()
            ]);

            return 1;
        }
    }
} 