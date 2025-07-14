<?php

namespace App\Jobs;

use App\Models\Domain;
use App\Services\BounceProcessingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessBouncesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 3;
    public $backoff = [60, 180, 360]; // Retry delays in seconds

    protected $domainId;

    /**
     * Create a new job instance.
     */
    public function __construct(?int $domainId = null)
    {
        $this->domainId = $domainId;
    }

    /**
     * Execute the job.
     */
    public function handle(BounceProcessingService $bounceService): void
    {
        try {
            if ($this->domainId) {
                // Process specific domain
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
            } else {
                // Process all domains that need it
                Log::info('Processing bounces for all domains');
                
                $results = $bounceService->processAllDomains();
                
                Log::info('Bounce processing completed for all domains', [
                    'results' => $results
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Bounce processing job failed', [
                'domain_id' => $this->domainId,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts()
            ]);

            // Mark job as failed if this is the last attempt
            if ($this->attempts() >= $this->tries) {
                Log::error('Bounce processing job failed permanently', [
                    'domain_id' => $this->domainId,
                    'attempts' => $this->attempts()
                ]);
            }

            throw $e;
        }
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