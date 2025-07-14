<?php

namespace App\Console\Commands;

use App\Jobs\AnalyzeReputationJob;
use App\Models\Domain;
use App\Services\PowerMTAService;
use Illuminate\Console\Command;
use Carbon\Carbon;

class AnalyzeReputationCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reputation:analyze 
                            {--domain= : Specific domain to analyze}
                            {--date= : Date to analyze (Y-m-d format)}
                            {--all : Analyze all domains}
                            {--days=7 : Number of days to analyze (when using --all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Analyze sender reputation from PowerMTA data';

    /**
     * Execute the console command.
     */
    public function handle(PowerMTAService $powerMTAService): int
    {
        $this->info('Starting reputation analysis...');

        // Check PowerMTA status first
        $status = $powerMTAService->getStatus();
        if ($status['status'] !== 'online') {
            $this->error('PowerMTA service is not available: ' . ($status['error'] ?? 'Unknown error'));
            return 1;
        }

        $this->info('PowerMTA service is online.');

        $domain = $this->option('domain');
        $date = $this->option('date') ?? now()->format('Y-m-d');
        $analyzeAll = $this->option('all');
        $days = (int) $this->option('days');

        if ($domain) {
            // Analyze specific domain
            $domainModel = Domain::where('domain', $domain)->first();
            
            if (!$domainModel) {
                $this->error("Domain '{$domain}' not found.");
                return 1;
            }

            $this->analyzeDomain($domainModel, $date);
        } elseif ($analyzeAll) {
            // Analyze all domains
            $domains = Domain::all();
            $this->info("Analyzing {$domains->count()} domains for the last {$days} days...");

            $bar = $this->output->createProgressBar($domains->count() * $days);
            $bar->start();

            foreach ($domains as $domainModel) {
                for ($i = 0; $i < $days; $i++) {
                    $analysisDate = now()->subDays($i)->format('Y-m-d');
                    $this->analyzeDomain($domainModel, $analysisDate, false);
                    $bar->advance();
                }
            }

            $bar->finish();
            $this->newLine();
        } else {
            $this->error('Please specify either --domain or --all option.');
            return 1;
        }

        $this->info('Reputation analysis completed successfully.');
        return 0;
    }

    /**
     * Analyze a specific domain
     */
    protected function analyzeDomain(Domain $domain, string $date, bool $showOutput = true): void
    {
        if ($showOutput) {
            $this->info("Analyzing domain: {$domain->domain} for date: {$date}");
        }

        try {
            // Dispatch job for background processing
            AnalyzeReputationJob::dispatch($domain->id, $date);
            
            if ($showOutput) {
                $this->info("Job dispatched for domain: {$domain->domain}");
            }
        } catch (\Exception $e) {
            if ($showOutput) {
                $this->error("Failed to analyze domain {$domain->domain}: " . $e->getMessage());
            }
        }
    }
} 
 
 
 
 
 