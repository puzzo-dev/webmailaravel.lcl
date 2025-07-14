<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

trait ControllerLoggingTrait
{
    /**
     * Log controller action
     */
    protected function logControllerAction(string $action, array $context = []): void
    {
        Log::info("Controller action: {$action}", array_merge($context, [
            'user_id' => Auth::id(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'method' => request()->method(),
            'url' => request()->fullUrl()
        ]));
    }

    /**
     * Log controller error
     */
    protected function logControllerError(string $action, string $error, array $context = []): void
    {
        Log::error("Controller error: {$action}", array_merge($context, [
            'error' => $error,
            'user_id' => Auth::id(),
            'ip' => request()->ip(),
            'method' => request()->method(),
            'url' => request()->fullUrl()
        ]));
    }

    /**
     * Log API request
     */
    protected function logApiRequest(string $endpoint, array $params = []): void
    {
        Log::info("API request: {$endpoint}", [
            'user_id' => Auth::id(),
            'params' => $params,
            'ip' => request()->ip(),
            'method' => request()->method()
        ]);
    }

    /**
     * Log API response
     */
    protected function logApiResponse(string $endpoint, $response, int $statusCode): void
    {
        Log::info("API response: {$endpoint}", [
            'user_id' => Auth::id(),
            'status_code' => $statusCode,
            'response_size' => is_string($response) ? strlen($response) : 'unknown'
        ]);
    }

    /**
     * Log validation failure
     */
    protected function logValidationFailure(string $action, array $errors): void
    {
        Log::warning("Validation failure: {$action}", [
            'user_id' => Auth::id(),
            'errors' => $errors,
            'ip' => request()->ip()
        ]);
    }

    /**
     * Log authorization failure
     */
    protected function logAuthorizationFailure(string $action, string $reason): void
    {
        Log::warning("Authorization failure: {$action}", [
            'user_id' => Auth::id(),
            'reason' => $reason,
            'ip' => request()->ip(),
            'requested_resource' => request()->fullUrl()
        ]);
    }

    /**
     * Log resource access
     */
    protected function logResourceAccess(string $resource, string $action, $resourceId = null): void
    {
        Log::info("Resource access: {$resource}.{$action}", [
            'user_id' => Auth::id(),
            'resource_id' => $resourceId,
            'ip' => request()->ip()
        ]);
    }

    /**
     * Log resource creation
     */
    protected function logResourceCreated(string $resource, $resourceId = null, array $context = []): void
    {
        Log::info("Resource created: {$resource}", array_merge($context, [
            'user_id' => Auth::id(),
            'resource_id' => $resourceId,
            'ip' => request()->ip()
        ]));
    }

    /**
     * Log resource update
     */
    protected function logResourceUpdated(string $resource, $resourceId = null, array $changes = []): void
    {
        Log::info("Resource updated: {$resource}", [
            'user_id' => Auth::id(),
            'resource_id' => $resourceId,
            'changes' => $changes,
            'ip' => request()->ip()
        ]);
    }

    /**
     * Log resource deletion
     */
    protected function logResourceDeleted(string $resource, $resourceId = null): void
    {
        Log::info("Resource deleted: {$resource}", [
            'user_id' => Auth::id(),
            'resource_id' => $resourceId,
            'ip' => request()->ip()
        ]);
    }

    /**
     * Log external service call
     */
    protected function logExternalServiceCall(string $service, string $action, array $params = []): void
    {
        Log::info("External service call: {$service}.{$action}", [
            'user_id' => Auth::id(),
            'params' => $params,
            'ip' => request()->ip()
        ]);
    }

    /**
     * Log external service error
     */
    protected function logExternalServiceError(string $service, string $action, string $error, array $params = []): void
    {
        Log::error("External service error: {$service}.{$action}", [
            'user_id' => Auth::id(),
            'error' => $error,
            'params' => $params,
            'ip' => request()->ip()
        ]);
    }
} 