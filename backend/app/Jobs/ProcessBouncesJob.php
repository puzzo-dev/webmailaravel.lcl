<?php

namespace App\Jobs;

use App\Models\Domain;
use App\Models\BounceCredential;
use App\Services\BounceProcessingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ProcessBouncesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 3;
    public $backoff = [60, 180, 360]; // Retry delays in seconds

    protected $domainId;
    protected $credentialId;

    /**
     * Create a new job instance.
     */
    public function __construct($domainId = null, $credentialId = null)
    {
        $this->domainId = $domainId;
        $this->credentialId = $credentialId;
        // Remove explicit queue assignment - use default queue
    }

    /**
     * Execute the job.
     */
    public function handle(BounceProcessingService $bounceService): void
    {
        $lockKey = "bounce_processing_lock";
        
        // Prevent concurrent processing for global jobs
        if (!$this->credentialId && !$this->domainId && Cache::has($lockKey)) {
            Log::info('Bounce processing already in progress, skipping');
            return;
        }

        if (!$this->credentialId && !$this->domainId) {
            Cache::put($lockKey, true, 300); // 5 minute lock
        }

        try {
            if ($this->credentialId) {
                $this->processSpecificCredential($bounceService);
            } elseif ($this->domainId) {
                $this->processSpecificDomain($bounceService);
            } else {
                $this->processAllCredentials($bounceService);
            }
        } finally {
            if (!$this->credentialId && !$this->domainId) {
                Cache::forget($lockKey);
            }
        }
    }

    /**
     * Process specific bounce credential
     */
    private function processSpecificCredential(BounceProcessingService $bounceService): void
    {
        $credential = BounceCredential::find($this->credentialId);
        
        if (!$credential || !$credential->is_active) {
            Log::warning('Bounce credential not found or inactive', ['credential_id' => $this->credentialId]);
            return;
        }

        Log::info('Processing bounces for specific credential', [
            'credential_id' => $this->credentialId,
            'domain_id' => $credential->domain_id,
            'user_id' => $credential->user_id
        ]);

        $result = $bounceService->processCredentialBounces($credential);
        
        Log::info('Bounce processing completed for credential', [
            'credential_id' => $this->credentialId,
            'processed' => $result['processed'],
            'suppressed' => $result['suppressed']
        ]);
    }

    /**
     * Process specific domain (backwards compatibility)
     */
    private function processSpecificDomain(BounceProcessingService $bounceService): void
    {
        $domain = Domain::findOrFail($this->domainId);
        
        Log::info('Processing bounces for specific domain', [
            'domain_id' => $domain->id,
            'domain_name' => $domain->name
        ]);

        $result = $bounceService->processDomainBounces($domain);
        
        Log::info('Bounce processing completed for domain', [
            'domain_id' => $domain->id,
            'domain_name' => $domain->name,
            'result' => $result
        ]);
    }

    /**
     * Process all active credentials
     */
    private function processAllCredentials(BounceProcessingService $bounceService): void
    {
        Log::info('Processing bounces for all credentials');
        
        $results = $bounceService->processAllDomains();
        
        $totalProcessed = collect($results)->sum('processed');
        $totalSuppressed = collect($results)->sum('suppressed');
        
        Log::info('Batch bounce processing completed', [
            'credentials_processed' => count($results),
            'total_processed' => $totalProcessed,
            'total_suppressed' => $totalSuppressed
        ]);

        // Store processing summary in cache for admin dashboard
        Cache::put('bounce_processing_summary', [
            'last_run' => now()->toISOString(),
            'credentials_processed' => count($results),
            'total_processed' => $totalProcessed,
            'total_suppressed' => $totalSuppressed,
            'success_rate' => count(array_filter($results, fn($r) => ($r['success'] ?? false) === true)) / max(count($results), 1) * 100
        ], 3600);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Bounce processing job failed permanently', [
            'domain_id' => $this->domainId,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);
    }
} 