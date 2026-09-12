<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Traits\ResponseTrait;

abstract class Controller
{
    use AuthorizesRequests, ResponseTrait;

    /**
     * Execute a callback with standardized error handling.
     *
     * Catches Throwable, maps known domain exceptions to proper HTTP status
     * codes, and avoids leaking sensitive internal details to the client.
     */
    protected function executeWithErrorHandling(callable $callback, string $operation = 'operation'): JsonResponse
    {
        try {
            $result = $callback();

            if ($result instanceof JsonResponse) {
                return $result;
            }

            return $this->successResponse(
                $result,
                ucfirst(str_replace('_', ' ', $operation)) . ' completed successfully'
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return $this->errorResponse($e->getMessage() ?: 'This action is unauthorized.', 403);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->errorResponse('Resource not found', 404);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return $this->errorResponse($e->getMessage() ?: 'Error', $e->getStatusCode());
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 400);
        } catch (\Throwable $e) {
            Log::error("Operation '{$operation}' failed: " . $e->getMessage(), [
                'exception' => $e::class,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return $this->errorResponse(
                config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
                500
            );
        }
    }

    /**
     * Validate request data and execute a callback with error handling.
     *
     * The validated data is passed as the first argument to the callback
     * instead of mutating the request object.
     */
    protected function validateAndExecute(
        Request $request,
        array $rules,
        callable $callback,
        string $operation = 'operation'
    ): JsonResponse {
        try {
            $validatedData = $request->validate($rules);

            return $this->executeWithErrorHandling(
                fn () => $callback($validatedData, $request),
                $operation
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        }
    }

    /**
     * Check if the current user can access a resource owned by another user.
     *
     * Returns true when the resource has no user_id, when the authenticated
     * user owns the resource, or when the authenticated user is an admin.
     */
    protected function canAccessResource($resource): bool
    {
        if (!isset($resource->user_id)) {
            return true;
        }

        $user = Auth::user();

        if ($user === null) {
            return false;
        }

        return $resource->user_id === $user->id || $user->hasRole('admin');
    }
}
