<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use App\Traits\ControllerValidationTrait;
use App\Traits\ControllerLoggingTrait;
use App\Traits\ControllerAuthorizationTrait;
use App\Traits\ControllerPaginationTrait;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;

abstract class BaseController extends Controller
{
    use ApiResponseTrait,
        ControllerValidationTrait,
        ControllerLoggingTrait,
        ControllerAuthorizationTrait,
        ControllerPaginationTrait;

    public function __construct()
    {
        // No dependencies needed - using Laravel's built-in features
    }

    /**
     * Handle controller method execution with standardized error handling
     */
    protected function executeControllerMethod(callable $method, string $action, array $context = []): JsonResponse
    {
        try {
            $this->logControllerAction($action, $context);
            
            $result = $method();
            
            $this->logApiResponse($action, $result, $result->getStatusCode());
            
            return $result;
            
        } catch (\Exception $e) {
            $this->logControllerError($action, $e->getMessage(), $context);
            
            return $this->serverErrorResponse('An error occurred while processing your request', $e->getMessage());
        }
    }

    /**
     * Validate request and execute method with standardized validation
     */
    protected function validateAndExecute(Request $request, array $rules, callable $method, string $action, array $context = []): JsonResponse
    {
        $validationResult = $this->validateRequestData($request, $rules);
        
        if ($validationResult instanceof JsonResponse) {
            $this->logValidationFailure($action, $validationResult->getData()['errors']->toArray());
            return $validationResult;
        }

        // Store validated data in request for access in controllers
        $request->merge(['validated_data' => $validationResult]);

        return $this->executeControllerMethod($method, $action, $context);
    }

    /**
     * Authorize and execute method with standardized authorization
     */
    protected function authorizeAndExecute(callable $authorizationCheck, callable $method, string $action, array $context = []): JsonResponse
    {
        $authorizationError = $authorizationCheck();
        
        if ($authorizationError) {
            return $authorizationError;
        }

        return $this->executeControllerMethod($method, $action, $context);
    }

    /**
     * Validate, authorize, and execute method with standardized patterns
     */
    protected function validateAuthorizeAndExecute(Request $request, array $rules, callable $authorizationCheck, callable $method, string $action, array $context = []): JsonResponse
    {
        $validationResult = $this->validateRequestData($request, $rules);
        
        if ($validationResult instanceof JsonResponse) {
            $this->logValidationFailure($action, $validationResult->getData()['errors']->toArray());
            return $validationResult;
        }

        $authorizationError = $authorizationCheck();
        
        if ($authorizationError) {
            return $authorizationError;
        }

        // Store validated data in request for access in controllers
        $request->merge(['validated_data' => $validationResult]);

        return $this->executeControllerMethod($method, $action, $context);
    }

    /**
     * Get paginated results with standardized pagination
     */
    protected function getPaginatedResults(Builder $query, Request $request, string $action, array $with = []): JsonResponse
    {
        try {
            $paginationParams = $this->getPaginationParams($request);
            $query = $this->applyPaginationFilters($query, $request);
            
            $results = $this->paginateResultsWithOrder(
                $query,
                $paginationParams['order_by'],
                $paginationParams['direction'],
                $paginationParams['per_page'],
                $with
            );

            $this->logControllerAction($action, [
                'total' => $results['pagination']['total'],
                'per_page' => $results['pagination']['per_page']
            ]);

            return $this->paginatedResponse($results, ucfirst($action) . ' retrieved successfully');

        } catch (\Exception $e) {
            $this->logControllerError($action, $e->getMessage());
            return $this->serverErrorResponse('Failed to retrieve ' . $action, $e->getMessage());
        }
    }

    /**
     * Get resource with standardized error handling
     */
    protected function getResource($resource, string $action, $id = null): JsonResponse
    {
        if (!$resource) {
            return $this->notFoundResponse(ucfirst($action) . ' not found');
        }

        $this->logResourceViewed($action, $resource->id ?? $id);
        return $this->showResponse($resource, ucfirst($action) . ' retrieved successfully');
    }

    /**
     * Create resource with standardized creation
     */
    protected function createResource(callable $creationMethod, string $action, array $context = []): JsonResponse
    {
        return $this->executeControllerMethod(function () use ($creationMethod, $action, $context) {
            $resource = $creationMethod();
            
            $this->logResourceCreated($action, $resource->id ?? null, $context);
            
            return $this->createdResponse($resource, ucfirst($action) . ' created successfully');
        }, $action, $context);
    }

    /**
     * Update resource with standardized updates
     */
    protected function updateResource($resource, callable $updateMethod, string $action, array $changes = []): JsonResponse
    {
        return $this->executeControllerMethod(function () use ($resource, $updateMethod, $action, $changes) {
            if (!$resource) {
                return $this->notFoundResponse(ucfirst($action) . ' not found');
            }

            $updatedResource = $updateMethod($resource);
            
            $this->logResourceUpdated($action, $resource->id ?? null, $changes);
            
            return $this->updateResponse($updatedResource, ucfirst($action) . ' updated successfully');
        }, $action);
    }

    /**
     * Delete resource with standardized deletion
     */
    protected function deleteResource($resource, callable $deletionMethod, string $action): JsonResponse
    {
        return $this->executeControllerMethod(function () use ($resource, $deletionMethod, $action) {
            if (!$resource) {
                return $this->notFoundResponse(ucfirst($action) . ' not found');
            }

            $deletionMethod($resource);
            
            $this->logResourceDeleted($action, $resource->id ?? null);
            
            return $this->deleteResponse(ucfirst($action) . ' deleted successfully');
        }, $action);
    }

    /**
     * Handle external service calls with standardized logging
     */
    protected function callExternalService(callable $serviceCall, string $service, string $action, array $params = []): mixed
    {
        try {
            $this->logExternalServiceCall($service, $action, $params);
            
            $result = $serviceCall();
            
            $this->logExternalServiceResponse($service, $action, $result);
            
            return $result;
            
        } catch (\Exception $e) {
            $this->logExternalServiceError($service, $action, $e->getMessage(), $params);
            throw $e;
        }
    }

    /**
     * Handle bulk operations with standardized patterns
     */
    protected function handleBulkOperation(array $items, callable $operation, string $action): JsonResponse
    {
        return $this->executeControllerMethod(function () use ($items, $operation, $action) {
            $results = [];
            $errors = [];
            
            foreach ($items as $item) {
                try {
                    $results[] = $operation($item);
                } catch (\Exception $e) {
                    $errors[] = [
                        'item' => $item,
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            $this->logBulkOperation($action, count($results), count($errors));
            
            return $this->actionResponse([
                'processed' => count($results),
                'errors' => count($errors),
                'results' => $results,
                'errors_details' => $errors
            ], ucfirst($action) . ' bulk operation completed');
        }, $action);
    }
} 