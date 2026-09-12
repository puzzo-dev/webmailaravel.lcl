<?php

namespace App\Jobs;

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

    public $timeout = 300;
    public $tries = 3;
    public $backoff = [60, 180, 360];

    protected $credentialId;

    public function __construct($credentialId = null)
    {
        $this->credentialId = $credentialId;
    }

    public function handle(BounceProcessingService $bounceService): void
    {
        $lockKey = "bounce_processing_lock";

        if (!$this->credentialId && Cache::has($lockKey)) {
            Log::info('Bounce processing already in progress, skipping');
            return;
        }

        if (!$this->credentialId) {
            Cache::put($lockKey, true, 300);
        }

        try {
            if ($this->credentialId) {
                $this->processSpecificCredential($bounceService);
            } else {
                $this->processAllCredentials($bounceService);
            }
        } finally {
            if (!$this->credentialId) {
                Cache::forget($lockKey);
            }
        }
    }

    private function processSpecificCredential(BounceProcessingService $bounceService): void
    {
        $credential = BounceCredential::find($this->credentialId);

        if (!$credential || !$credential->is_active) {
            Log::warning('Bounce credential not found or inactive', ['credential_id' => $this->credentialId]);
            return;
        }

        Log::info('Processing bounces for specific credential', [
            'credential_id' => $this->credentialId,
            'user_id' => $credential->user_id
        ]);

        $result = $bounceService->processCredentialBounces($credential);

        Log::info('Bounce processing completed for credential', [
            'credential_id' => $this->credentialId,
            'processed' => $result['processed'],
            'suppressed' => $result['suppressed']
        ]);
    }

    private function processAllCredentials(BounceProcessingService $bounceService): void
    {
        Log::info('Processing bounces for all credentials');

        $results = $bounceService->processAllBounces();

        $totalProcessed = collect($results)->sum('processed');
        $totalSuppressed = collect($results)->sum('suppressed');

        Log::info('Batch bounce processing completed', [
            'credentials_processed' => count($results),
            'total_processed' => $totalProcessed,
            'total_suppressed' => $totalSuppressed
        ]);

        Cache::put('bounce_processing_summary', [
            'last_run' => now()->toISOString(),
            'credentials_processed' => count($results),
            'total_processed' => $totalProcessed,
            'total_suppressed' => $totalSuppressed,
            'success_rate' => count(array_filter($results, fn($r) => ($r['success'] ?? false) === true)) / max(count($results), 1) * 100
        ], 3600);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Bounce processing job failed permanently', [
            'credential_id' => $this->credentialId,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);
    }
}
