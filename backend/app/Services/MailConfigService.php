<?php

namespace App\Services;

use App\Models\SmtpConfig;
use App\Models\Sender;
use App\Models\SystemConfig;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class MailConfigService
{
    /**
     * Configure a per-sender SMTP mailer and return the mailer name.
     * Used by synchronous (non-queued) sending paths.
     */
    public function configureSenderMailer(Sender $sender): string
    {
        $smtpConfig = $sender->smtpConfig;
        if (!$smtpConfig) {
            throw new \Exception('No SMTP configuration assigned to this sender');
        }

        $mailerName = 'smtp_sender_' . $sender->id;

        Config::set("mail.mailers.{$mailerName}", [
            'transport' => 'smtp',
            'host' => $smtpConfig->host,
            'port' => $smtpConfig->port,
            'username' => $smtpConfig->username,
            'password' => $smtpConfig->password,
            'encryption' => $smtpConfig->encryption,
            'timeout' => 30,
            'local_domain' => $smtpConfig->host,
        ]);

        app('mail.manager')->purge($mailerName);

        return $mailerName;
    }

    /**
     * Configure the system notification mailer from SystemConfig.
     */
    public function configureSystemMailer(): void
    {
        $host = SystemConfig::get('SYSTEM_SMTP_HOST', config('mail.mailers.smtp.host'));
        $port = SystemConfig::get('SYSTEM_SMTP_PORT', config('mail.mailers.smtp.port'));
        $username = SystemConfig::get('SYSTEM_SMTP_USERNAME', config('mail.mailers.smtp.username'));
        $password = SystemConfig::get('SYSTEM_SMTP_PASSWORD', config('mail.mailers.smtp.password'));
        $encryption = SystemConfig::get('SYSTEM_SMTP_ENCRYPTION', config('mail.mailers.smtp.encryption'));

        Config::set('mail.mailers.system_smtp', [
            'transport' => 'smtp',
            'host' => $host,
            'port' => $port,
            'username' => $username,
            'password' => $password,
            'encryption' => $encryption,
            'timeout' => 30,
        ]);

        app('mail.manager')->purge('system_smtp');
    }

    /**
     * Test an SMTP configuration.
     */
    public function testSmtpConfig(SmtpConfig $smtpConfig): array
    {
        $mailerName = 'smtp_test_' . $smtpConfig->id;

        Config::set("mail.mailers.{$mailerName}", [
            'transport' => 'smtp',
            'host' => $smtpConfig->host,
            'port' => $smtpConfig->port,
            'username' => $smtpConfig->username,
            'password' => $smtpConfig->password,
            'encryption' => $smtpConfig->encryption,
            'timeout' => 10,
        ]);

        app('mail.manager')->purge($mailerName);

        try {
            // Attempt a no-op SMTP connection
            $transport = app('mail.manager')->mailer($mailerName)->getSymfonyTransport();
            $transport->start();
            $transport->stop();

            return ['success' => true, 'message' => 'SMTP connection successful'];
        } catch (\Exception $e) {
            Log::error('SMTP test failed', [
                'smtp_config_id' => $smtpConfig->id,
                'error' => $e->getMessage(),
            ]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
