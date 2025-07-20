<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
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
     * Validate request with Laravel Validator
     */
    protected function validateRequest(Request $request, array $rules, array $messages = []): array
    {
        $validator = Validator::make($request->all(), $rules, $messages);

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
     * Validate request and return data if valid
     */
    protected function validateRequestData(Request $request, array $rules, array $messages = []): array
    {
        $validation = $this->validateRequest($request, $rules, $messages);
        
        if (!$validation['is_valid']) {
            return $validation;
        }

        return $validation['data'];
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
     * Validate required fields from request
     */
    protected function validateRequiredFieldsFromRequest(Request $request, array $requiredFields): array
    {
        $data = $request->all();
        return $this->validateRequiredFields($data, $requiredFields);
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
     * Validate email from request
     */
    protected function validateEmailField(Request $request, string $field = 'email'): array
    {
        $email = $request->input($field);
        
        if (!$email || !$this->validateEmail($email)) {
            return [
                'is_valid' => false,
                'errors' => [
                    $field => ['The ' . $field . ' must be a valid email address.']
                ]
            ];
        }

        return ['is_valid' => true];
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
     * Validate numeric range from request
     */
    protected function validateNumericRangeFromRequest(Request $request, string $field, float $min, float $max): array
    {
        $value = $request->input($field);
        
        if (!$this->validateNumericRange($value, $min, $max)) {
            return [
                'is_valid' => false,
                'errors' => [
                    $field => ["The {$field} must be between {$min} and {$max}."]
                ]
            ];
        }

        return ['is_valid' => true];
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
     * Validate string length from request
     */
    protected function validateStringLengthFromRequest(Request $request, string $field, int $min, int $max): array
    {
        $value = $request->input($field);
        
        if (!$this->validateStringLength($value, $min, $max)) {
            return [
                'is_valid' => false,
                'errors' => [
                    $field => ["The {$field} must be between {$min} and {$max} characters."]
                ]
            ];
        }

        return ['is_valid' => true];
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
     * Sanitize request data
     */
    protected function sanitizeRequestData(Request $request, array $fields): array
    {
        $data = [];
        
        foreach ($fields as $field) {
            if ($request->has($field)) {
                $data[$field] = $this->sanitizeString($request->input($field));
            }
        }
        
        return $data;
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
     * Validate and sanitize email from request
     */
    protected function validateAndSanitizeEmailFromRequest(Request $request, string $field = 'email'): string|null
    {
        $email = $request->input($field);
        return $this->validateAndSanitizeEmail($email);
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
     * Validate file upload from request
     */
    protected function validateFileUploadFromRequest(Request $request, string $field, array $allowedMimes, int $maxSize = 10240): array
    {
        if (!$request->hasFile($field)) {
            return [
                'is_valid' => false,
                'errors' => [
                    $field => ['The ' . $field . ' file is required.']
                ]
            ];
        }

        $file = $request->file($field);
        
        if (!$file->isValid()) {
            return [
                'is_valid' => false,
                'errors' => [
                    $field => ['The uploaded file is invalid.']
                ]
            ];
        }

        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return [
                'is_valid' => false,
                'errors' => [
                    $field => ['The file type is not allowed.']
                ]
            ];
        }

        if ($file->getSize() > $maxSize * 1024) {
            return [
                'is_valid' => false,
                'errors' => [
                    $field => ['The file size exceeds the maximum allowed size.']
                ]
            ];
        }

        return ['is_valid' => true];
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