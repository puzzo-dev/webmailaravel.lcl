<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\SuppressionList;

class ProcessFBLFile extends Command
{
    protected $signature = 'fbl:process 
                            {filepath : Path to the FBL file}
                            {--source= : Source identifier for the FBL file}
                            {--type=fbl : Type of suppression (fbl, bounce, complaint)}';

    protected $description = 'Process FBL (Feedback Loop) file and add recipients to suppression list';

    public function handle(): int
    {
        $filepath = $this->argument('filepath');
        $source = $this->option('source') ?: 'cli_fbl';
        $type = $this->option('type');

        $this->info("Processing FBL file: {$filepath}");
        $this->info("Source: {$source}");
        $this->info("Type: {$type}");

        try {
            if (!Storage::disk('local')->exists($filepath)) {
                $this->error("File not found: {$filepath}");
                return 1;
            }

            $content = Storage::disk('local')->get($filepath);
            $lines = array_filter(array_map('trim', explode("\n", $content)));
            $processed = 0;
            $added = 0;
            $skipped = 0;

            foreach ($lines as $line) {
                $processed++;
                if (stripos($line, 'email') !== false || stripos($line, 'address') !== false) {
                    continue;
                }
                $data = str_getcsv($line);
                if (count($data) < 1) {
                    $skipped++;
                    continue;
                }
                $email = trim($data[0]);
                if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $metadata = [
                        'fbl_file' => $filepath,
                        'processed_at' => now()->toISOString(),
                        'line_number' => $processed,
                        'raw_data' => $line
                    ];
                    if (count($data) > 1) {
                        $metadata['reason'] = trim($data[1] ?? '');
                    }
                    if (count($data) > 2) {
                        $metadata['date'] = trim($data[2] ?? '');
                    }
                    SuppressionList::addEmail(
                        $email,
                        $type ?: 'fbl',
                        $source,
                        'FBL complaint from ' . $source,
                        $metadata
                    );
                    $added++;
                } else {
                    $skipped++;
                }
            }

            $this->info("\xE2\x9C\x85 FBL file processed successfully!");
            $this->info("\xF0\x9F\x93\x8A Statistics:");
            $this->info("   - Processed: {$processed} lines");
            $this->info("   - Added to suppression list: {$added} emails");
            $this->info("   - Skipped: {$skipped} lines");

            Log::info('FBL file processed via CLI', [
                'filepath' => $filepath,
                'source' => $source,
                'processed' => $processed,
                'added' => $added,
                'skipped' => $skipped
            ]);
            return 0;
        } catch (\Exception $e) {
            $this->error("\xE2\x9D\x8C Error processing FBL file: {$e->getMessage()}");
            Log::error('FBL file processing failed via CLI', [
                'filepath' => $filepath,
                'error' => $e->getMessage()
            ]);
            return 1;
        }
    }
} 