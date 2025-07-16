<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

    /**
     * Log controller action with request context
     */
    protected function logControllerAction(string $action, array $context = []): void
    {
        $this->logInfo("Controller action: {$action}", array_merge($context, [
            'user_id' => Auth::id(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'method' => request()->method(),
            'url' => request()->fullUrl()
        ]));
    }

    /**
     * Log controller error with request context
     */
    protected function logControllerError(string $action, string $error, array $context = []): void
    {
        $this->logError("Controller error: {$action}", array_merge($context, [
            'error' => $error,
            'user_id' => Auth::id(),
            'ip' => request()->ip(),
            'method' => request()->method(),
            'url' => request()->fullUrl()
        ]));
    }

    /**
     * Log API request with context
     */
    protected function logApiRequest(string $endpoint, array $params = []): void
    {
        $this->logInfo("API request: {$endpoint}", [
            'user_id' => Auth::id(),
            'params' => $params,
            'ip' => request()->ip(),
            'method' => request()->method()
        ]);
    }

    /**
     * Log API response with context
     */
    protected function logApiResponse(string $endpoint, $response, int $statusCode): void
    {
        $this->logInfo("API response: {$endpoint}", [
            'user_id' => Auth::id(),
            'status_code' => $statusCode,
            'response_size' => is_string($response) ? strlen($response) : 'unknown'
        ]);
    }

    /**
     * Log validation failure with context
     */
    protected function logValidationFailure(string $action, array $errors): void
    {
        $this->logWarning("Validation failure: {$action}", [
            'user_id' => Auth::id(),
            'errors' => $errors,
            'ip' => request()->ip()
        ]);
    }

    /**
     * Log authorization failure with context
     */
    protected function logAuthorizationFailure(string $action, string $reason): void
    {
        $this->logWarning("Authorization failure: {$action}", [
            'user_id' => Auth::id(),
            'reason' => $reason,
            'ip' => request()->ip(),
            'requested_resource' => request()->fullUrl()
        ]);
    }

    /**
     * Log resource access with context
     */
    protected function logResourceAccess(string $resource, string $action, $resourceId = null): void
    {
        $this->logInfo("Resource access: {$resource}.{$action}", [
            'user_id' => Auth::id(),
            'resource_id' => $resourceId,
            'ip' => request()->ip()
        ]);
    }

    /**
     * Log resource creation with context
     */
    protected function logResourceCreated(string $resource, $resourceId = null, array $context = []): void
    {
        $this->logInfo("Resource created: {$resource}", array_merge($context, [
            'user_id' => Auth::id(),
            'resource_id' => $resourceId,
            'ip' => request()->ip()
        ]));
    }

    /**
     * Log resource update with context
     */
    protected function logResourceUpdated(string $resource, $resourceId = null, array $changes = []): void
    {
        $this->logInfo("Resource updated: {$resource}", [
            'user_id' => Auth::id(),
            'resource_id' => $resourceId,
            'changes' => $changes,
            'ip' => request()->ip()
        ]);
    }

    /**
     * Log resource deletion with context
     */
    protected function logResourceDeleted(string $resource, $resourceId = null): void
    {
        $this->logInfo("Resource deleted: {$resource}", [
            'user_id' => Auth::id(),
            'resource_id' => $resourceId,
            'ip' => request()->ip()
        ]);
    }

    /**
     * Log external service call with context
     */
    protected function logExternalServiceCall(string $service, string $action, array $params = []): void
    {
        $this->logInfo("External service call: {$service}.{$action}", [
            'user_id' => Auth::id(),
            'params' => $params,
            'ip' => request()->ip()
        ]);
    }

    /**
     * Log external service error with context
     */
    protected function logExternalServiceError(string $service, string $action, string $error, array $params = []): void
    {
        $this->logError("External service error: {$service}.{$action}", [
            'user_id' => Auth::id(),
            'error' => $error,
            'params' => $params,
            'ip' => request()->ip()
        ]);
    }
} 