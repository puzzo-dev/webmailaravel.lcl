<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

trait ApiResponseTrait
{
    /**
     * Send standardized success response
     */
    protected function successResponse($data = null, string $message = 'Success', int $code = 200): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
            'timestamp' => now()->toISOString()
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $code);
    }

    /**
     * Send standardized error response
     */
    protected function errorResponse(string $message, $error = null, int $code = 400): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
            'timestamp' => now()->toISOString()
        ];

        if ($error !== null) {
            $response['error'] = $error;
        }

        return response()->json($response, $code);
    }

    /**
     * Send standardized validation error response
     */
    protected function validationErrorResponse($errors, string $message = 'Validation failed'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'timestamp' => now()->toISOString()
        ], 422);
    }

    /**
     * Send standardized not found response
     */
    protected function notFoundResponse(string $message = 'Resource not found'): JsonResponse
    {
        return $this->errorResponse($message, null, 404);
    }

    /**
     * Send standardized unauthorized response
     */
    protected function unauthorizedResponse(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->errorResponse($message, null, 401);
    }

    /**
     * Send standardized forbidden response
     */
    protected function forbiddenResponse(string $message = 'Forbidden'): JsonResponse
    {
        return $this->errorResponse($message, null, 403);
    }

    /**
     * Send standardized server error response
     */
    protected function serverErrorResponse(string $message = 'Internal server error', $error = null): JsonResponse
    {
        return $this->errorResponse($message, $error, 500);
    }

    /**
     * Send standardized created response
     */
    protected function createdResponse($data = null, string $message = 'Resource created successfully'): JsonResponse
    {
        return $this->successResponse($data, $message, 201);
    }

    /**
     * Send standardized no content response
     */
    protected function noContentResponse(): JsonResponse
    {
        return response()->json(null, 204);
    }

    /**
     * Send standardized paginated response
     */
    protected function paginatedResponse($data, string $message = 'Data retrieved successfully'): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data['data'] ?? $data,
            'pagination' => $data['pagination'] ?? null,
            'timestamp' => now()->toISOString()
        ];

        return response()->json($response);
    }

    /**
     * Send standardized list response
     */
    protected function listResponse($data, string $message = 'Data retrieved successfully'): JsonResponse
    {
        return $this->successResponse($data, $message);
    }

    /**
     * Send standardized show response
     */
    protected function showResponse($data, string $message = 'Resource retrieved successfully'): JsonResponse
    {
        return $this->successResponse($data, $message);
    }

    /**
     * Send standardized update response
     */
    protected function updateResponse($data, string $message = 'Resource updated successfully'): JsonResponse
    {
        return $this->successResponse($data, $message);
    }

    /**
     * Send standardized delete response
     */
    protected function deleteResponse(string $message = 'Resource deleted successfully'): JsonResponse
    {
        return $this->successResponse(null, $message);
    }

    /**
     * Send standardized action response
     */
    protected function actionResponse($data = null, string $message = 'Action completed successfully'): JsonResponse
    {
        return $this->successResponse($data, $message);
    }

    /**
     * Send standardized conflict response
     */
    protected function conflictResponse(string $message = 'Resource conflict'): JsonResponse
    {
        return $this->errorResponse($message, null, 409);
    }

    /**
     * Send standardized too many requests response
     */
    protected function tooManyRequestsResponse(string $message = 'Too many requests', int $retryAfter = null): JsonResponse
    {
        $response = $this->errorResponse($message, null, 429);
        
        if ($retryAfter !== null) {
            $response->header('Retry-After', $retryAfter);
        }
        
        return $response;
    }

    /**
     * Send standardized service unavailable response
     */
    protected function serviceUnavailableResponse(string $message = 'Service temporarily unavailable'): JsonResponse
    {
        return $this->errorResponse($message, null, 503);
    }

    /**
     * Send standardized bad gateway response
     */
    protected function badGatewayResponse(string $message = 'Bad gateway'): JsonResponse
    {
        return $this->errorResponse($message, null, 502);
    }

    /**
     * Send standardized gateway timeout response
     */
    protected function gatewayTimeoutResponse(string $message = 'Gateway timeout'): JsonResponse
    {
        return $this->errorResponse($message, null, 504);
    }
} 