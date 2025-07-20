<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

trait ResponseTrait
{
    /**
     * Return a success response
     */
    protected function successResponse($data = null, string $message = 'Success', int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }

    /**
     * Return a created response
     */
    protected function createdResponse($data = null, string $message = 'Resource created successfully', int $statusCode = 201): JsonResponse
    {
        return $this->successResponse($data, $message, $statusCode);
    }

    /**
     * Return an error response
     */
    protected function errorResponse(string $message = 'Error', int $statusCode = 400, $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message
        ];

        if ($errors) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return a validation error response
     */
    protected function validationErrorResponse($errors, string $message = 'Validation failed', int $statusCode = 422): JsonResponse
    {
        return $this->errorResponse($message, $statusCode, $errors);
    }

    /**
     * Return a forbidden response
     */
    protected function forbiddenResponse(string $message = 'Access denied'): JsonResponse
    {
        return $this->errorResponse($message, 403);
    }

    /**
     * Return a paginated response
     */
    protected function paginatedResponse(LengthAwarePaginator $data, string $message = 'Success'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data->items(),
            'pagination' => [
                'current_page' => $data->currentPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
                'last_page' => $data->lastPage(),
                'from' => $data->firstItem(),
                'to' => $data->lastItem()
            ]
        ], 200);
    }
}