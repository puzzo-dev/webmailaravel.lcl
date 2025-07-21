<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBounceCredentialRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $credentialId = $this->route('bounce_credential');
        
        return [
            'email' => 'sometimes|email|max:255',
            'protocol' => 'sometimes|in:imap,pop3',
            'host' => 'sometimes|string|max:255',
            'port' => 'sometimes|integer|min:1|max:65535',
            'username' => 'sometimes|string|max:255',
            'password' => 'sometimes|string|min:1',
            'encryption' => 'sometimes|in:ssl,tls,none',
            'is_default' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
            'settings' => 'sometimes|nullable|array',
            'settings.mailbox' => 'sometimes|nullable|string|max:255',
            'settings.timeout' => 'sometimes|nullable|integer|min:5|max:300',
            'settings.delete_processed' => 'sometimes|nullable|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'email.email' => 'Please enter a valid email address.',
            'protocol.in' => 'Protocol must be either IMAP or POP3.',
            'host.string' => 'The mail server host must be a valid string.',
            'port.min' => 'Port number must be at least 1.',
            'port.max' => 'Port number cannot exceed 65535.',
            'username.string' => 'The username must be a valid string.',
            'password.min' => 'The password cannot be empty.',
            'encryption.in' => 'Encryption must be SSL, TLS, or none.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $credentialId = $this->route('bounce_credential');
            $credential = \App\Models\BounceCredential::find($credentialId);

            if (!$credential) {
                return;
            }

            // Ensure only one default credential per user (for non-domain specific)
            if ($this->input('is_default') && !$credential->domain_id) {
                $existingDefault = \App\Models\BounceCredential::where('user_id', auth()->id())
                    ->where('is_default', true)
                    ->whereNull('domain_id')
                    ->where('id', '!=', $credentialId)
                    ->exists();

                if ($existingDefault) {
                    $validator->errors()->add('is_default', 'You already have a default bounce credential. Only one default is allowed.');
                }
            }

            // Domain-specific credentials cannot be default
            if ($this->input('is_default') && $credential->domain_id) {
                $validator->errors()->add('is_default', 'Domain-specific credentials cannot be set as default.');
            }

            // Check if this is the last default credential
            if ($this->has('is_default') && !$this->input('is_default') && $credential->is_default) {
                $otherDefaults = \App\Models\BounceCredential::where('user_id', auth()->id())
                    ->where('is_default', true)
                    ->whereNull('domain_id')
                    ->where('id', '!=', $credentialId)
                    ->count();

                if ($otherDefaults === 0) {
                    $validator->errors()->add('is_default', 'You must have at least one default bounce credential.');
                }
            }
        });
    }
}
