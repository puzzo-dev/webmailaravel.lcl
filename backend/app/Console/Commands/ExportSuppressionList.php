<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SuppressionList;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ExportSuppressionList extends Command
{
    protected $signature = 'suppression:export 
                            {--filename= : Custom filename for export}
                            {--type= : Filter by type (unsubscribe, fbl, bounce, complaint, manual)}
                            {--output= : Output format (txt, csv)}';

    protected $description = 'Export suppression list to file';

    public function handle(): int
    {
        $filename = $this->option('filename');
        $type = $this->option('type');
        $output = $this->option('output') ?: 'csv';

        $this->info("Exporting suppression list...");
        if ($type) {
            $this->info("Filtering by type: {$type}");
        }
        $this->info("Output format: {$output}");

        try {
            // Get statistics
            $total = SuppressionList::count();
            $byType = SuppressionList::selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray();

            $this->info("\xF0\x9F\x93\x8A Current suppression list statistics:");
            $this->info("   - Total entries: {$total}");
            $this->info("   - Unsubscribes: " . ($byType['unsubscribe'] ?? 0));
            $this->info("   - FBL complaints: " . ($byType['fbl'] ?? 0));
            $this->info("   - Bounces: " . ($byType['bounce'] ?? 0));
            $this->info("   - Complaints: " . ($byType['complaint'] ?? 0));
            $this->info("   - Manual: " . ($byType['manual'] ?? 0));

            // Export suppression list
            $filename = $filename ?: 'suppression_list_' . date('Y-m-d_H-i-s') . '.' . $output;
            $filepath = 'suppression_lists/' . $filename;

            $query = SuppressionList::select('email', 'type', 'source', 'reason', 'created_at');
            if ($type) {
                $query->where('type', $type);
            }
            $emails = $query->orderBy('created_at', 'desc')->get();

            if ($output === 'csv') {
                $content = "Email,Type,Source,Reason,Created At\n";
                foreach ($emails as $email) {
                    $content .= "\"{$email->email}\",\"{$email->type}\",\"{$email->source}\",\"{$email->reason}\",\"{$email->created_at}\"\n";
                }
            } else {
                $content = '';
                foreach ($emails as $email) {
                    $content .= $email->email . "\n";
                }
            }
            Storage::disk('local')->put($filepath, $content);

            $this->info("\xE2\x9C\x85 Suppression list exported successfully!");
            $this->info("\xF0\x9F\x93\x81 File saved to: {$filepath}");

            Log::info('Suppression list exported via CLI', [
                'filepath' => $filepath,
                'type_filter' => $type,
                'output_format' => $output
            ]);

            return 0;
        } catch (\Exception $e) {
            $this->error("\xE2\x9D\x8C Error exporting suppression list: {$e->getMessage()}");
            Log::error('Suppression list export failed via CLI', [
                'error' => $e->getMessage()
            ]);
            return 1;
        }
    }
} 