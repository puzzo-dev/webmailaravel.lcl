<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'subject' => 'required_without:enable_content_switching|string|max:255',
            'content' => 'required_without:enable_content_switching|string',
            'enable_content_switching' => 'boolean',
            'content_variations' => 'required_if:enable_content_switching,true|array',
            'content_variations.*.subject' => 'required_with:content_variations|string|max:255',
            'content_variations.*.content' => 'required_with:content_variations|string',
            'enable_template_variables' => 'boolean',
            'template_variables' => 'nullable|array',
            'enable_open_tracking' => 'boolean',
            'enable_click_tracking' => 'boolean',
            'enable_unsubscribe_link' => 'boolean',
            'recipient_field_mapping' => 'nullable|array',
            'attachments.*' => 'file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif,zip|max:10240',
        ];
    }

    public function messages(): array
    {
        return [
            'content_variations.required_if' => 'Content variations are required when content switching is enabled.',
            'subject.required_without' => 'Subject is required when content switching is disabled.',
            'content.required_without' => 'Content is required when content switching is disabled.',
        ];
    }
}
