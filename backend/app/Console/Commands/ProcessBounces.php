<?php

namespace App\Console\Commands;

use App\Models\BounceCredential;
use App\Services\BounceProcessingService;
use Illuminate\Console\Command;

class ProcessBounces extends Command
{
    protected $signature = 'bounces:process {--credential= : Process specific credential by ID} {--all : Process all credentials} {--test : Test connection only}';
    protected $description = 'Process bounce emails from IMAP/POP3 mailboxes';

    public function handle(BounceProcessingService $bounceService): int
    {
        $credentialId = $this->option('credential');

        if ($this->option('test')) {
            return $this->testConnection($bounceService);
        }

        if ($credentialId) {
            return $this->processSpecificCredential($bounceService, (int) $credentialId);
        }

        if ($this->option('all')) {
            return $this->processAllCredentials($bounceService);
        }

        $this->error('Please specify --credential=ID or --all option');
        return 1;
    }

    private function processSpecificCredential(BounceProcessingService $bounceService, int $credentialId): int
    {
        $credential = BounceCredential::find($credentialId);

        if (!$credential) {
            $this->error("Credential not found: {$credentialId}");
            return 1;
        }

        $this->info("Processing bounces for credential: {$credential->email}");

        $result = $bounceService->processCredentialBounces($credential);

        $this->info("Processed: {$result['processed']}, Suppressed: {$result['suppressed']}");
        return 0;
    }

    private function processAllCredentials(BounceProcessingService $bounceService): int
    {
        $this->info('Processing bounces for all credentials...');

        $results = $bounceService->processAllBounces();

        $totalProcessed = collect($results)->sum('processed');
        $totalSuppressed = collect($results)->sum('suppressed');

        $this->info("Total processed: {$totalProcessed}, Total suppressed: {$totalSuppressed}");
        return 0;
    }

    private function testConnection(BounceProcessingService $bounceService): int
    {
        $credentials = BounceCredential::active()->get();

        if ($credentials->isEmpty()) {
            $this->warn('No active bounce credentials found');
            return 1;
        }

        foreach ($credentials as $credential) {
            $this->info("Testing connection for: {$credential->email}");
            $result = $bounceService->testCredentialConnection($credential);

            if ($result['success']) {
                $this->info("  ✓ Success - {$result['message_count']} messages");
            } else {
                $this->error("  ✗ Failed - {$result['error']}");
            }
        }

        return 0;
    }
}
