<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use App\Traits\ResponseTrait;

abstract class Controller
{
    use ResponseTrait;

    /**
     * Execute a function with error handling
     */
    protected function executeWithErrorHandling(callable $callback, string $operation = 'operation'): JsonResponse
    {
        try {
            $result = $callback();
            
            if ($result instanceof JsonResponse) {
                return $result;
            }

            return $this->successResponse($result, ucfirst(str_replace('_', ' ', $operation)) . ' completed successfully');
        } catch (\Exception $e) {
            // Return the actual exception message for user-facing errors
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Validate request and execute with error handling
     */
    protected function validateAndExecute(Request $request, array $rules, callable $callback, string $operation = 'operation'): JsonResponse
    {
        try {
            // Use the request's validate method which handles files properly
            $validatedData = $request->validate($rules);
            $request->merge(['validated_data' => $validatedData]);
            
            return $this->executeWithErrorHandling($callback, $operation);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        }
    }



    /**
     * Check if the current user can access a resource
     */
    protected function canAccessResource($resource): bool
    {
        if (isset($resource->user_id)) {
            return $resource->user_id === Auth::id() || Auth::user()->hasRole('admin');
        }
        
        return true;
    }
}