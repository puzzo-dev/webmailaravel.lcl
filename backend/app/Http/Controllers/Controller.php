<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

abstract class Controller
{
    /**
     * Execute a function with error handling
     */
    protected function executeWithErrorHandling(callable $callback, string $operation = 'operation'): JsonResponse
    {
        try {
            $result = $callback();
            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during ' . $operation,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate request and execute with error handling
     */
    protected function validateAndExecute(Request $request, array $rules, callable $callback, string $operation = 'operation'): JsonResponse
    {
        $validator = Validator::make($request->all(), $rules);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Add validated data to request for use in callback
        $request->merge(['validated_data' => $validator->validated()]);

        return $this->executeWithErrorHandling($callback, $operation);
    }

    /**
     * Validate request and execute with error handling (alternative name)
     */
    protected function validateAndExecuteWithErrorHandling(Request $request, array $rules, callable $callback, string $operation = 'operation'): JsonResponse
    {
        return $this->validateAndExecute($request, $rules, $callback, $operation);
    }

    /**
     * Get paginated results
     */
    protected function getPaginatedResults(Builder $query, Request $request, string $dataKey = 'data', array $relations = []): array
    {
        $perPage = $request->get('per_page', 15);
        $page = $request->get('page', 1);
        
        // Load relations if specified
        if (!empty($relations)) {
            $query->with($relations);
        }
        
        $results = $query->paginate($perPage, ['*'], 'page', $page);
        
        return [
            $dataKey => $results->items(),
            'pagination' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
                'from' => $results->firstItem(),
                'to' => $results->lastItem(),
            ]
        ];
    }

    /**
     * Check if the current user can access a resource
     */
    protected function canAccessResource($resource): bool
    {
        // Check if resource has user_id and matches current user
        if (isset($resource->user_id)) {
            return $resource->user_id === Auth::id();
        }
        
        // For resources without user_id, allow access for now
        return true;
    }

    /**
     * Return a forbidden response
     */
    protected function forbiddenResponse(string $message = 'Access denied'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], 403);
    }
}
