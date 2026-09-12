<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBounceCredentialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
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

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $credentialId = $this->route('bounce_credential');
            $credential = \App\Models\BounceCredential::find($credentialId);

            if (!$credential) {
                return;
            }

            // Ensure only one default credential per user
            if ($this->input('is_default')) {
                $existingDefault = \App\Models\BounceCredential::where('user_id', auth()->id())
                    ->where('is_default', true)
                    ->where('id', '!=', $credentialId)
                    ->exists();

                if ($existingDefault) {
                    $validator->errors()->add('is_default', 'You already have a default bounce credential. Only one default is allowed.');
                }
            }
        });
    }
}
