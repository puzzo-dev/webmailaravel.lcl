<?php

namespace App\Traits;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

trait ValidationTrait
{
    /**
     * Validate data using Laravel's Validator
     */
    protected function validateData(array $data, array $rules, array $messages = []): array
    {
        $validator = Validator::make($data, $rules, $messages);

        if ($validator->fails()) {
            return [
                'is_valid' => false,
                'errors' => $validator->errors()->toArray()
            ];
        }

        return [
            'is_valid' => true,
            'data' => $validator->validated()
        ];
    }

    /**
     * Validate required fields using Laravel's validation
     */
    protected function validateRequiredFields(array $data, array $requiredFields): array
    {
        $rules = [];
        foreach ($requiredFields as $field) {
            $rules[$field] = 'required';
        }

        return $this->validateData($data, $rules);
    }

    /**
     * Validate email format using Laravel's validation
     */
    protected function validateEmail(string $email): bool
    {
        $validator = Validator::make(['email' => $email], [
            'email' => 'required|email'
        ]);

        return !$validator->fails();
    }

    /**
     * Validate multiple emails using Laravel's validation
     */
    protected function validateEmails(array $emails): array
    {
        $validator = Validator::make(['emails' => $emails], [
            'emails.*' => 'email'
        ]);

        if ($validator->fails()) {
            return [
                'valid' => [],
                'invalid' => $emails,
                'valid_count' => 0,
                'invalid_count' => count($emails)
            ];
        }

        return [
            'valid' => $emails,
            'invalid' => [],
            'valid_count' => count($emails),
            'invalid_count' => 0
        ];
    }

    /**
     * Validate numeric range using Laravel's validation
     */
    protected function validateNumericRange(float $value, float $min, float $max): bool
    {
        $validator = Validator::make(['value' => $value], [
            'value' => "numeric|min:{$min}|max:{$max}"
        ]);

        return !$validator->fails();
    }

    /**
     * Validate string length using Laravel's validation
     */
    protected function validateStringLength(string $value, int $min, int $max): bool
    {
        $validator = Validator::make(['value' => $value], [
            'value' => "string|min:{$min}|max:{$max}"
        ]);

        return !$validator->fails();
    }

    /**
     * Validate array structure using Laravel's validation
     */
    protected function validateArrayStructure(array $data, array $requiredKeys): array
    {
        $rules = [];
        foreach ($requiredKeys as $key) {
            $rules[$key] = 'required';
        }

        return $this->validateData($data, $rules);
    }

    /**
     * Sanitize string input
     */
    protected function sanitizeString(string $input): string
    {
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Sanitize array of strings
     */
    protected function sanitizeStringArray(array $input): array
    {
        return array_map([$this, 'sanitizeString'], $input);
    }

    /**
     * Validate and sanitize email
     */
    protected function validateAndSanitizeEmail(string $email): ?string
    {
        $email = trim($email);
        
        if ($this->validateEmail($email)) {
            return strtolower($email);
        }
        
        return null;
    }

    /**
     * Validate URL using Laravel's validation
     */
    protected function validateUrl(string $url): bool
    {
        $validator = Validator::make(['url' => $url], [
            'url' => 'required|url'
        ]);

        return !$validator->fails();
    }

    /**
     * Validate IP address using Laravel's validation
     */
    protected function validateIpAddress(string $ip): bool
    {
        $validator = Validator::make(['ip' => $ip], [
            'ip' => 'required|ip'
        ]);

        return !$validator->fails();
    }

    /**
     * Validate date format using Laravel's validation
     */
    protected function validateDateFormat(string $date, string $format = 'Y-m-d'): bool
    {
        $validator = Validator::make(['date' => $date], [
            'date' => "required|date_format:{$format}"
        ]);

        return !$validator->fails();
    }

    /**
     * Validate file upload using Laravel's validation
     */
    protected function validateFileUpload($file, array $allowedMimes, int $maxSize = 10240): array
    {
        $validator = Validator::make(['file' => $file], [
            'file' => "required|file|mimes:" . implode(',', $allowedMimes) . "|max:{$maxSize}"
        ]);

        if ($validator->fails()) {
            return [
                'is_valid' => false,
                'errors' => $validator->errors()->toArray()
            ];
        }

        return [
            'is_valid' => true,
            'data' => $validator->validated()
        ];
    }

    /**
     * Validate JSON string using Laravel's validation
     */
    protected function validateJson(string $json): bool
    {
        $validator = Validator::make(['json' => $json], [
            'json' => 'required|json'
        ]);

        return !$validator->fails();
    }

    /**
     * Validate UUID using Laravel's validation
     */
    protected function validateUuid(string $uuid): bool
    {
        $validator = Validator::make(['uuid' => $uuid], [
            'uuid' => 'required|uuid'
        ]);

        return !$validator->fails();
    }
} 