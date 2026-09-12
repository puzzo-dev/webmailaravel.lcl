<?php

namespace App\Services;

use App\Mail\TestEmail;
use App\Models\Sender;
use App\Models\SmtpConfig;
use Illuminate\Support\Facades\Mail;

class SenderService
{
    /**
     * Test SMTP configuration by sending a test email.
     *
     * Uses exception-safe configuration restoration via a finally block
     * to prevent global mail config corruption on failure.
     */
    public function testSmtpConfig(SmtpConfig $smtpConfig, Sender $sender, string $testEmail): array
    {
        $originalConfig = config('mail');

        try {
            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp' => [
                    'transport' => 'smtp',
                    'host' => $smtpConfig->host,
                    'port' => $smtpConfig->port,
                    'username' => $smtpConfig->username,
                    'password' => $smtpConfig->password,
                    'encryption' => $smtpConfig->encryption,
                    'timeout' => 30,
                    'local_domain' => $smtpConfig->host,
                ],
                'mail.from.address' => $sender->email,
                'mail.from.name' => $sender->name,
            ]);

            app('mail.manager')->purge('smtp');

            Mail::to($testEmail)->send(new TestEmail($sender));

            return [
                'success' => true,
                'message' => 'Test email sent successfully',
                'sender' => $sender->email,
                'test_email' => $testEmail,
                'smtp_config' => [
                    'host' => $smtpConfig->host,
                    'port' => $smtpConfig->port,
                    'username' => $smtpConfig->username,
                    'encryption' => $smtpConfig->encryption,
                ],
            ];
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();

            if (str_contains($errorMessage, 'Test Email - SMTP Configuration Test')) {
                $errorMessage = 'Failed to send test email: Invalid email template configuration';
            }

            return [
                'success' => false,
                'error' => $errorMessage,
                'sender' => $sender->email,
                'test_email' => $testEmail,
                'smtp_config' => [
                    'host' => $smtpConfig->host,
                    'port' => $smtpConfig->port,
                    'username' => $smtpConfig->username,
                    'encryption' => $smtpConfig->encryption,
                ],
            ];
        } finally {
            // Always restore original configuration, even on success or failure
            config(['mail' => $originalConfig]);
            app('mail.manager')->purge('smtp');
        }
    }
}
