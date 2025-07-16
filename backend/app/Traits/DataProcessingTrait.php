<?php

namespace App\Traits;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

trait DataProcessingTrait
{
    /**
     * Process data in chunks
     */
    protected function processDataInChunks(Collection $data, callable $processor, int $chunkSize = 1000): array
    {
        $results = [];
        $errors = [];
        $processed = 0;
        
        $data->chunk($chunkSize)->each(function ($chunk, $index) use ($processor, &$results, &$errors, &$processed) {
            try {
                $chunkResults = $processor($chunk);
                $results = array_merge($results, $chunkResults);
                $processed += $chunk->count();
                
                $this->logChunkProcessed($index, $chunk->count());
                
            } catch (\Exception $e) {
                $errors[] = [
                    'chunk_index' => $index,
                    'error' => $e->getMessage(),
                    'items_count' => $chunk->count()
                ];
                
                $this->logChunkError($index, $e->getMessage());
            }
        });
        
        return [
            'processed' => $processed,
            'results' => $results,
            'errors' => $errors,
            'total_chunks' => $data->count() / $chunkSize
        ];
    }

    /**
     * Transform data with mapping
     */
    protected function transformData(Collection $data, array $mapping): Collection
    {
        return $data->map(function ($item) use ($mapping) {
            $transformed = [];
            
            foreach ($mapping as $newKey => $oldKey) {
                if (is_callable($oldKey)) {
                    $transformed[$newKey] = $oldKey($item);
                } else {
                    $transformed[$newKey] = data_get($item, $oldKey);
                }
            }
            
            return $transformed;
        });
    }

    /**
     * Filter data with conditions
     */
    protected function filterData(Collection $data, array $conditions): Collection
    {
        return $data->filter(function ($item) use ($conditions) {
            foreach ($conditions as $field => $condition) {
                $value = data_get($item, $field);
                
                if (is_callable($condition)) {
                    if (!$condition($value)) {
                        return false;
                    }
                } elseif (is_array($condition)) {
                    if (!in_array($value, $condition)) {
                        return false;
                    }
                } else {
                    if ($value !== $condition) {
                        return false;
                    }
                }
            }
            
            return true;
        });
    }

    /**
     * Aggregate data by field
     */
    protected function aggregateData(Collection $data, string $groupBy, array $aggregations): Collection
    {
        return $data->groupBy($groupBy)->map(function ($group) use ($aggregations) {
            $result = [];
            
            foreach ($aggregations as $field => $operation) {
                $values = $group->pluck($field)->filter();
                
                switch ($operation) {
                    case 'sum':
                        $result[$field] = $values->sum();
                        break;
                    case 'avg':
                        $result[$field] = $values->avg();
                        break;
                    case 'count':
                        $result[$field] = $values->count();
                        break;
                    case 'min':
                        $result[$field] = $values->min();
                        break;
                    case 'max':
                        $result[$field] = $values->max();
                        break;
                    case 'unique':
                        $result[$field] = $values->unique()->values();
                        break;
                }
            }
            
            return $result;
        });
    }

    /**
     * Normalize data structure
     */
    protected function normalizeData(Collection $data, array $schema): Collection
    {
        return $data->map(function ($item) use ($schema) {
            $normalized = [];
            
            foreach ($schema as $field => $config) {
                $value = data_get($item, $field);
                
                // Apply type casting
                if (isset($config['type'])) {
                    $value = $this->castValue($value, $config['type']);
                }
                
                // Apply default value
                if ($value === null && isset($config['default'])) {
                    $value = $config['default'];
                }
                
                // Apply transformation
                if (isset($config['transform']) && is_callable($config['transform'])) {
                    $value = $config['transform']($value);
                }
                
                $normalized[$field] = $value;
            }
            
            return $normalized;
        });
    }

    /**
     * Cast value to specific type
     */
    protected function castValue($value, string $type)
    {
        if ($value === null) {
            return null;
        }
        
        switch ($type) {
            case 'string':
                return (string) $value;
            case 'integer':
                return (int) $value;
            case 'float':
                return (float) $value;
            case 'boolean':
                return (bool) $value;
            case 'array':
                return is_array($value) ? $value : [$value];
            case 'date':
                return Carbon::parse($value);
            case 'datetime':
                return Carbon::parse($value);
            case 'json':
                return is_string($value) ? json_decode($value, true) : $value;
            default:
                return $value;
        }
    }

    /**
     * Validate data against schema
     */
    protected function validateDataSchema(Collection $data, array $schema): array
    {
        $errors = [];
        $validCount = 0;
        
        $data->each(function ($item, $index) use ($schema, &$errors, &$validCount) {
            $itemErrors = [];
            
            foreach ($schema as $field => $rules) {
                $value = data_get($item, $field);
                
                // Required field check
                if (isset($rules['required']) && $rules['required'] && $value === null) {
                    $itemErrors[] = "Field '{$field}' is required";
                    continue;
                }
                
                // Type validation
                if (isset($rules['type']) && $value !== null) {
                    if (!$this->validateType($value, $rules['type'])) {
                        $itemErrors[] = "Field '{$field}' must be of type '{$rules['type']}'";
                    }
                }
                
                // Range validation
                if (isset($rules['min']) && $value !== null) {
                    if ($value < $rules['min']) {
                        $itemErrors[] = "Field '{$field}' must be at least {$rules['min']}";
                    }
                }
                
                if (isset($rules['max']) && $value !== null) {
                    if ($value > $rules['max']) {
                        $itemErrors[] = "Field '{$field}' must be at most {$rules['max']}";
                    }
                }
                
                // Pattern validation
                if (isset($rules['pattern']) && $value !== null) {
                    if (!preg_match($rules['pattern'], $value)) {
                        $itemErrors[] = "Field '{$field}' does not match required pattern";
                    }
                }
                
                // Custom validation
                if (isset($rules['validate']) && is_callable($rules['validate'])) {
                    if (!$rules['validate']($value)) {
                        $itemErrors[] = "Field '{$field}' failed custom validation";
                    }
                }
            }
            
            if (!empty($itemErrors)) {
                $errors[] = [
                    'index' => $index,
                    'errors' => $itemErrors
                ];
            } else {
                $validCount++;
            }
        });
        
        return [
            'valid_count' => $validCount,
            'error_count' => count($errors),
            'errors' => $errors
        ];
    }

    /**
     * Validate value type
     */
    protected function validateType($value, string $type): bool
    {
        switch ($type) {
            case 'string':
                return is_string($value);
            case 'integer':
                return is_int($value) || (is_string($value) && ctype_digit($value));
            case 'float':
                return is_float($value) || is_numeric($value);
            case 'boolean':
                return is_bool($value) || in_array($value, [0, 1, '0', '1', true, false]);
            case 'array':
                return is_array($value);
            case 'email':
                return filter_var($value, FILTER_VALIDATE_EMAIL) !== false;
            case 'url':
                return filter_var($value, FILTER_VALIDATE_URL) !== false;
            case 'date':
                return Carbon::canParse($value);
            default:
                return true;
        }
    }

    /**
     * Merge data from multiple sources
     */
    protected function mergeDataSources(array $sources, string $keyField = 'id'): Collection
    {
        $merged = collect();
        
        foreach ($sources as $sourceName => $sourceData) {
            $sourceCollection = collect($sourceData);
            
            if ($merged->isEmpty()) {
                $merged = $sourceCollection;
            } else {
                $merged = $merged->map(function ($item) use ($sourceCollection, $keyField, $sourceName) {
                    $matchingItem = $sourceCollection->firstWhere($keyField, $item[$keyField] ?? null);
                    
                    if ($matchingItem) {
                        return array_merge($item, [$sourceName => $matchingItem]);
                    }
                    
                    return $item;
                });
            }
        }
        
        return $merged;
    }

    /**
     * Calculate statistics for numeric data
     */
    protected function calculateStatistics(Collection $data, string $field): array
    {
        $values = $data->pluck($field)->filter()->map('floatval');
        
        if ($values->isEmpty()) {
            return [
                'count' => 0,
                'sum' => 0,
                'average' => 0,
                'min' => 0,
                'max' => 0,
                'median' => 0,
                'standard_deviation' => 0
            ];
        }
        
        $count = $values->count();
        $sum = $values->sum();
        $average = $sum / $count;
        $min = $values->min();
        $max = $values->max();
        
        // Calculate median
        $sorted = $values->sort()->values();
        $median = $count % 2 === 0 
            ? ($sorted[$count / 2 - 1] + $sorted[$count / 2]) / 2
            : $sorted[floor($count / 2)];
        
        // Calculate standard deviation
        $variance = $values->map(function ($value) use ($average) {
            return pow($value - $average, 2);
        })->sum() / $count;
        $standardDeviation = sqrt($variance);
        
        return [
            'count' => $count,
            'sum' => $sum,
            'average' => $average,
            'min' => $min,
            'max' => $max,
            'median' => $median,
            'standard_deviation' => $standardDeviation
        ];
    }

    /**
     * Log chunk processed
     */
    protected function logChunkProcessed(int $index, int $count): void
    {
        Log::debug('Data chunk processed', [
            'chunk_index' => $index,
            'items_count' => $count
        ]);
    }

    /**
     * Log chunk error
     */
    protected function logChunkError(int $index, string $error): void
    {
        Log::error('Data chunk processing error', [
            'chunk_index' => $index,
            'error' => $error
        ]);
    }
} 