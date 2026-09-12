<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:domains,name',
            'is_active' => 'boolean',
            'verification_status' => 'string|in:pending,verified,failed',
        ];
    }
}
