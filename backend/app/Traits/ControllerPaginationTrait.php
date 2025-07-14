<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait ControllerPaginationTrait
{
    /**
     * Paginate query results
     */
    protected function paginateResults(Builder $query, int $perPage = 20, array $with = []): array
    {
        if (!empty($with)) {
            $query->with($with);
        }

        $results = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return [
            'data' => $results->items(),
            'pagination' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
                'from' => $results->firstItem(),
                'to' => $results->lastItem(),
                'has_more_pages' => $results->hasMorePages(),
                'has_previous_pages' => $results->previousPageUrl() !== null,
                'next_page_url' => $results->nextPageUrl(),
                'previous_page_url' => $results->previousPageUrl()
            ]
        ];
    }

    /**
     * Paginate results with custom ordering
     */
    protected function paginateResultsWithOrder(Builder $query, string $orderBy = 'created_at', string $direction = 'desc', int $perPage = 20, array $with = []): array
    {
        if (!empty($with)) {
            $query->with($with);
        }

        $results = $query->orderBy($orderBy, $direction)->paginate($perPage);

        return [
            'data' => $results->items(),
            'pagination' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
                'from' => $results->firstItem(),
                'to' => $results->lastItem(),
                'has_more_pages' => $results->hasMorePages(),
                'has_previous_pages' => $results->previousPageUrl() !== null,
                'next_page_url' => $results->nextPageUrl(),
                'previous_page_url' => $results->previousPageUrl()
            ]
        ];
    }

    /**
     * Get pagination parameters from request
     */
    protected function getPaginationParams(Request $request): array
    {
        return [
            'per_page' => (int) $request->input('per_page', 20),
            'page' => (int) $request->input('page', 1),
            'order_by' => $request->input('order_by', 'created_at'),
            'direction' => $request->input('direction', 'desc')
        ];
    }

    /**
     * Apply pagination filters to query
     */
    protected function applyPaginationFilters(Builder $query, Request $request): Builder
    {
        // Apply search filter
        if ($request->has('search')) {
            $search = $request->input('search');
            $searchFields = $request->input('search_fields', ['name', 'email']);
            
            $query->where(function ($q) use ($search, $searchFields) {
                foreach ($searchFields as $field) {
                    $q->orWhere($field, 'LIKE', "%{$search}%");
                }
            });
        }

        // Apply date range filter
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        // Apply status filter
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // Apply user filter
        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        return $query;
    }

    /**
     * Paginate with filters
     */
    protected function paginateWithFilters(Builder $query, Request $request, array $with = []): array
    {
        $query = $this->applyPaginationFilters($query, $request);
        $params = $this->getPaginationParams($request);

        return $this->paginateResultsWithOrder(
            $query,
            $params['order_by'],
            $params['direction'],
            $params['per_page'],
            $with
        );
    }

    /**
     * Get simple pagination (without total count)
     */
    protected function simplePaginateResults(Builder $query, int $perPage = 20, array $with = []): array
    {
        if (!empty($with)) {
            $query->with($with);
        }

        $results = $query->orderBy('created_at', 'desc')->simplePaginate($perPage);

        return [
            'data' => $results->items(),
            'pagination' => [
                'current_page' => $results->currentPage(),
                'per_page' => $results->perPage(),
                'from' => $results->firstItem(),
                'to' => $results->lastItem(),
                'has_more_pages' => $results->hasMorePages(),
                'has_previous_pages' => $results->previousPageUrl() !== null,
                'next_page_url' => $results->nextPageUrl(),
                'previous_page_url' => $results->previousPageUrl()
            ]
        ];
    }

    /**
     * Get cursor pagination
     */
    protected function cursorPaginateResults(Builder $query, int $perPage = 20, array $with = []): array
    {
        if (!empty($with)) {
            $query->with($with);
        }

        $results = $query->orderBy('id')->cursorPaginate($perPage);

        return [
            'data' => $results->items(),
            'pagination' => [
                'per_page' => $results->perPage(),
                'has_more_pages' => $results->hasMorePages(),
                'next_cursor' => $results->nextCursor()?->encode(),
                'previous_cursor' => $results->previousCursor()?->encode()
            ]
        ];
    }
} 