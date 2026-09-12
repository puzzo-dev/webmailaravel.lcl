<?php

namespace App\Console\Commands;

use App\Jobs\AnalyzeReputationJob;
use App\Models\Sender;
use App\Services\PowerMTAService;
use Illuminate\Console\Command;

class AnalyzeReputationCommand extends Command
{
    protected $signature = 'reputation:analyze 
                            {--sender= : Specific sender ID to analyze}
                            {--date= : Date to analyze (Y-m-d format)}
                            {--all : Analyze all senders}
                            {--days=7 : Number of days to analyze (when using --all)}';

    protected $description = 'Analyze sender reputation from PowerMTA data';

    public function handle(PowerMTAService $powerMTAService): int
    {
        $this->info('Starting reputation analysis...');

        $status = $powerMTAService->getStatus();
        if ($status['status'] !== 'online') {
            $this->error('PowerMTA service is not available: ' . ($status['error'] ?? 'Unknown error'));
            return 1;
        }

        $this->info('PowerMTA service is online.');

        $senderId = $this->option('sender');
        $date = $this->option('date') ?? now()->format('Y-m-d');
        $analyzeAll = $this->option('all');
        $days = (int) $this->option('days');

        if ($senderId) {
            $sender = Sender::find($senderId);
            if (!$sender) {
                $this->error("Sender '{$senderId}' not found.");
                return 1;
            }
            $this->analyzeSender($sender, $date);
        } elseif ($analyzeAll) {
            $senders = Sender::where('is_active', true)->get();
            $this->info("Analyzing {$senders->count()} senders for the last {$days} days...");

            $bar = $this->output->createProgressBar($senders->count() * $days);
            $bar->start();

            foreach ($senders as $sender) {
                for ($i = 0; $i < $days; $i++) {
                    $analysisDate = now()->subDays($i)->format('Y-m-d');
                    $this->analyzeSender($sender, $analysisDate, false);
                    $bar->advance();
                }
            }

            $bar->finish();
            $this->newLine();
        } else {
            $this->error('Please specify either --sender=ID or --all option.');
            return 1;
        }

        $this->info('Reputation analysis completed successfully.');
        return 0;
    }

    protected function analyzeSender(Sender $sender, string $date, bool $showOutput = true): void
    {
        if ($showOutput) {
            $this->info("Analyzing sender: {$sender->email} for date: {$date}");
        }

        try {
            AnalyzeReputationJob::dispatch($sender->id, $date);

            if ($showOutput) {
                $this->info("Job dispatched for sender: {$sender->email}");
            }
        } catch (\Exception $e) {
            if ($showOutput) {
                $this->error("Failed to analyze sender {$sender->email}: " . $e->getMessage());
            }
        }
    }
}
