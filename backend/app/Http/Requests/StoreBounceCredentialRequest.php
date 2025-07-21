<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBounceCredentialRequest extends FormRequest
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
        return [
            'domain_id' => [
                'nullable',
                'exists:domains,id',
                Rule::unique('bounce_credentials')->where(function ($query) {
                    return $query->where('user_id', auth()->id());
                })
            ],
            'email' => 'required|email|max:255',
            'protocol' => 'required|in:imap,pop3',
            'host' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'username' => 'required|string|max:255',
            'password' => 'required|string|min:1',
            'encryption' => 'required|in:ssl,tls,none',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'settings' => 'nullable|array',
            'settings.mailbox' => 'nullable|string|max:255',
            'settings.timeout' => 'nullable|integer|min:5|max:300',
            'settings.delete_processed' => 'nullable|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'domain_id.unique' => 'A bounce credential already exists for this domain.',
            'email.required' => 'The bounce email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'protocol.required' => 'Please select a protocol (IMAP or POP3).',
            'protocol.in' => 'Protocol must be either IMAP or POP3.',
            'host.required' => 'The mail server host is required.',
            'port.required' => 'The port number is required.',
            'port.min' => 'Port number must be at least 1.',
            'port.max' => 'Port number cannot exceed 65535.',
            'username.required' => 'The username is required.',
            'password.required' => 'The password is required.',
            'password.min' => 'The password cannot be empty.',
            'encryption.required' => 'Please select an encryption type.',
            'encryption.in' => 'Encryption must be SSL, TLS, or none.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Ensure only one default credential per user (for non-domain specific)
            if ($this->input('is_default') && !$this->input('domain_id')) {
                $existingDefault = \App\Models\BounceCredential::where('user_id', auth()->id())
                    ->where('is_default', true)
                    ->whereNull('domain_id')
                    ->exists();

                if ($existingDefault) {
                    $validator->errors()->add('is_default', 'You already have a default bounce credential. Only one default is allowed.');
                }
            }

            // Domain-specific credentials cannot be default
            if ($this->input('is_default') && $this->input('domain_id')) {
                $validator->errors()->add('is_default', 'Domain-specific credentials cannot be set as default.');
            }

            // Validate domain ownership
            if ($this->input('domain_id')) {
                $domainExists = \App\Models\Domain::where('id', $this->input('domain_id'))
                    ->where('user_id', auth()->id())
                    ->exists();

                if (!$domainExists) {
                    $validator->errors()->add('domain_id', 'The selected domain does not exist or you do not have permission to access it.');
                }
            }
        });
    }
}
