<?php

namespace App\Console\Commands;

use App\Models\Domain;
use App\Services\BounceProcessingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessBounces extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bounces:process {--domain= : Process specific domain by ID} {--all : Process all domains} {--test : Test connection only}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process bounces from IMAP/POP3 servers for suppression list';

    /**
     * Execute the console command.
     */
    public function handle(BounceProcessingService $bounceService): int
    {
        $domainId = $this->option('domain');
        $processAll = $this->option('all');
        $testOnly = $this->option('test');

        try {
            if ($testOnly) {
                return $this->testConnections($bounceService);
            }

            if ($domainId) {
                return $this->processSpecificDomain($bounceService, $domainId);
            } elseif ($processAll) {
                return $this->processAllDomains($bounceService);
            } else {
                $this->error('Please specify --domain=ID or --all option');
                return 1;
            }

        } catch (\Exception $e) {
            $this->error('Bounce processing failed: ' . $e->getMessage());
            Log::error('Bounce processing command failed', [
                'error' => $e->getMessage(),
                'domain_id' => $domainId
            ]);
            return 1;
        }
    }

    /**
     * Process specific domain
     */
    private function processSpecificDomain(BounceProcessingService $bounceService, int $domainId): int
    {
        $domain = Domain::find($domainId);
        
        if (!$domain) {
            $this->error("Domain with ID {$domainId} not found");
            return 1;
        }

        if (!$domain->isBounceProcessingConfigured()) {
            $this->error("Domain {$domain->name} is not configured for bounce processing");
            return 1;
        }

        $this->info("Processing bounces for domain: {$domain->name}");

        $result = $bounceService->processDomainBounces($domain);

        if ($result['success']) {
            $this->info("Successfully processed {$result['processed']} bounces");
            $this->info("Suppressed {$result['suppressed']} emails");
            return 0;
        } else {
            $this->error("Failed to process bounces: {$result['error']}");
            return 1;
        }
    }

    /**
     * Process all domains
     */
    private function processAllDomains(BounceProcessingService $bounceService): int
    {
        $this->info('Processing bounces for all configured domains...');

        $results = $bounceService->processAllDomains();
        $totalProcessed = 0;
        $totalSuppressed = 0;
        $successCount = 0;

        foreach ($results as $domainId => $result) {
            $domain = Domain::find($domainId);
            $domainName = $domain ? $domain->name : "Domain {$domainId}";

            if ($result['success']) {
                $this->info("✓ {$domainName}: {$result['processed']} processed, {$result['suppressed']} suppressed");
                $totalProcessed += $result['processed'];
                $totalSuppressed += $result['suppressed'];
                $successCount++;
            } else {
                $this->error("✗ {$domainName}: {$result['error']}");
            }
        }

        $this->info("\nSummary:");
        $this->info("Domains processed: {$successCount}");
        $this->info("Total bounces processed: {$totalProcessed}");
        $this->info("Total emails suppressed: {$totalSuppressed}");

        return $successCount > 0 ? 0 : 1;
    }

    /**
     * Test connections for all domains
     */
    private function testConnections(BounceProcessingService $bounceService): int
    {
        $this->info('Testing bounce processing connections...');

        $domains = Domain::where('enable_bounce_processing', true)->get();
        $successCount = 0;

        foreach ($domains as $domain) {
            $this->info("Testing connection for domain: {$domain->name}");

            $result = $bounceService->testConnection($domain);

            if ($result['success']) {
                $this->info("✓ {$domain->name}: Connection successful ({$result['message_count']} messages)");
                $successCount++;
            } else {
                $this->error("✗ {$domain->name}: {$result['error']}");
            }
        }

        $this->info("\nConnection test summary: {$successCount}/{$domains->count()} domains connected successfully");

        return $successCount === $domains->count() ? 0 : 1;
    }
} 