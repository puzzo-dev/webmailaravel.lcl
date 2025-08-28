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
            return $this->errorResponse('An error occurred during ' . str_replace('_', ' ', $operation), 500, $e->getMessage());
        }
    }

    /**
     * Validate request and execute with error handling
     */
    protected function validateAndExecute(Request $request, array $rules, callable $callback, string $operation = 'operation'): JsonResponse
    {
        // Merge request data with files for proper validation
        $requestData = array_merge($request->all(), $request->allFiles());
        $validator = Validator::make($requestData, $rules);
        
        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $request->merge(['validated_data' => $validator->validated()]);

        return $this->executeWithErrorHandling($callback, $operation);
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