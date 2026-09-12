<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSuppressionListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required_without:emails|email|max:255',
            'emails' => 'required_without:email|array',
            'emails.*' => 'email|max:255',
            'reason' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:255',
        ];
    }
}
