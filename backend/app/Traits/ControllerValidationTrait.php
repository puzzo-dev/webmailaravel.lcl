<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

trait ControllerValidationTrait
{
    use ValidationTrait;

    /**
     * Validate request with Laravel Validator
     */
    protected function validateRequest(Request $request, array $rules, array $messages = []): JsonResponse|null
    {
        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        return null; // No error
    }

    /**
     * Validate request and return data if valid
     */
    protected function validateRequestData(Request $request, array $rules, array $messages = []): array|JsonResponse
    {
        $error = $this->validateRequest($request, $rules, $messages);
        
        if ($error) {
            return $error;
        }

        return $request->only(array_keys($rules));
    }

    /**
     * Validate required fields from request
     */
    protected function validateRequiredFields(Request $request, array $requiredFields): JsonResponse|null
    {
        $data = $request->all();
        $validation = $this->validateRequiredFields($data, $requiredFields);

        if (!$validation['is_valid']) {
            return $this->validationErrorResponse([
                'required_fields' => $validation['errors']
            ]);
        }

        return null; // No error
    }

    /**
     * Validate email from request
     */
    protected function validateEmailField(Request $request, string $field = 'email'): JsonResponse|null
    {
        $email = $request->input($field);
        
        if (!$email || !$this->validateEmail($email)) {
            return $this->validationErrorResponse([
                $field => ['The ' . $field . ' must be a valid email address.']
            ]);
        }

        return null; // No error
    }

    /**
     * Validate numeric range from request
     */
    protected function validateNumericRange(Request $request, string $field, float $min, float $max): JsonResponse|null
    {
        $value = $request->input($field);
        
        if (!$this->validateNumericRange($value, $min, $max)) {
            return $this->validationErrorResponse([
                $field => ["The {$field} must be between {$min} and {$max}."]
            ]);
        }

        return null; // No error
    }

    /**
     * Validate string length from request
     */
    protected function validateStringLength(Request $request, string $field, int $min, int $max): JsonResponse|null
    {
        $value = $request->input($field);
        
        if (!$this->validateStringLength($value, $min, $max)) {
            return $this->validationErrorResponse([
                $field => ["The {$field} must be between {$min} and {$max} characters."]
            ]);
        }

        return null; // No error
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
     * Validate and sanitize email from request
     */
    protected function validateAndSanitizeEmail(Request $request, string $field = 'email'): string|null
    {
        $email = $request->input($field);
        return $this->validateAndSanitizeEmail($email);
    }

    /**
     * Validate file upload
     */
    protected function validateFileUpload(Request $request, string $field, array $allowedMimes, int $maxSize = 10240): JsonResponse|null
    {
        if (!$request->hasFile($field)) {
            return $this->validationErrorResponse([
                $field => ['The ' . $field . ' file is required.']
            ]);
        }

        $file = $request->file($field);
        
        if (!$file->isValid()) {
            return $this->validationErrorResponse([
                $field => ['The uploaded file is invalid.']
            ]);
        }

        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return $this->validationErrorResponse([
                $field => ['The file type is not allowed.']
            ]);
        }

        if ($file->getSize() > $maxSize * 1024) {
            return $this->validationErrorResponse([
                $field => ['The file size exceeds the maximum allowed size.']
            ]);
        }

        return null; // No error
    }
} 