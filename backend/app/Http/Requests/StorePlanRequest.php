<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'currency' => 'required|string|size:3',
            'duration_days' => 'required|integer|min:1',
            'max_senders' => 'required|integer|min:1',
            'max_total_campaigns' => 'required|integer|min:1',
            'max_live_campaigns' => 'required|integer|min:1',
            'daily_sending_limit' => 'required|integer|min:1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
        ];
    }
}
