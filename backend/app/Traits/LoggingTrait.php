<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

trait LoggingTrait
{
    /**
     * Log info message with context
     */
    protected function logInfo(string $message, array $context = []): void
    {
        $context['service'] = static::class;
        $context['timestamp'] = now()->toISOString();
        
        Log::info($message, $context);
    }

    /**
     * Log error message with context
     */
    protected function logError(string $message, array $context = []): void
    {
        $context['service'] = static::class;
        $context['timestamp'] = now()->toISOString();
        
        Log::error($message, $context);
    }

    /**
     * Log warning message with context
     */
    protected function logWarning(string $message, array $context = []): void
    {
        $context['service'] = static::class;
        $context['timestamp'] = now()->toISOString();
        
        Log::warning($message, $context);
    }

    /**
     * Log debug message with context
     */
    protected function logDebug(string $message, array $context = []): void
    {
        $context['service'] = static::class;
        $context['timestamp'] = now()->toISOString();
        
        Log::debug($message, $context);
    }

    /**
     * Log service method entry
     */
    protected function logMethodEntry(string $method, array $params = []): void
    {
        $this->logDebug("Method entry: {$method}", [
            'method' => $method,
            'params' => $params
        ]);
    }

    /**
     * Log service method exit
     */
    protected function logMethodExit(string $method, mixed $result = null): void
    {
        $this->logDebug("Method exit: {$method}", [
            'method' => $method,
            'result' => $result
        ]);
    }

    /**
     * Log external API call
     */
    protected function logApiCall(string $service, string $endpoint, array $params = [], mixed $response = null): void
    {
        $this->logInfo("External API call", [
            'service' => $service,
            'endpoint' => $endpoint,
            'params' => $params,
            'response' => $response
        ]);
    }

    /**
     * Log external API error
     */
    protected function logApiError(string $service, string $endpoint, string $error, array $params = []): void
    {
        $this->logError("External API error", [
            'service' => $service,
            'endpoint' => $endpoint,
            'error' => $error,
            'params' => $params
        ]);
    }
} 