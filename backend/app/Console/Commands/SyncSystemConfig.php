<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SystemConfig;
use App\Services\NotificationMailService;

class SyncSystemConfig extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'config:sync-system 
                            {--test-email= : Send a test email to verify configuration}
                            {--force : Force sync even if configuration exists}';

    /**
     * The console command description.
     */
    protected $description = 'Sync system configuration from database to .env file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Starting system configuration sync...');
        
        try {
            // 1. Sync configuration to .env file
            $this->info('📝 Syncing system configuration to .env file...');
            $syncResult = SystemConfig::syncToEnvFile();
            
            if ($syncResult) {
                $this->info('✅ Configuration synced to .env file successfully');
            } else {
                $this->error('❌ Failed to sync configuration to .env file');
                return 1;
            }
            
            // 2. Reload configuration in memory
            $this->info('🔄 Reloading mail configuration...');
            NotificationMailService::configureSystemMail();
            
            // 3. Display current system SMTP configuration
            $this->displaySystemConfig();
            
            // 4. Test email if requested
            if ($testEmail = $this->option('test-email')) {
                $this->info("📧 Sending test email to {$testEmail}...");
                $this->sendTestEmail($testEmail);
            }
            
            $this->info('🎉 System configuration sync completed successfully');
            return 0;
            
        } catch (\Exception $e) {
            $this->error('❌ Configuration sync failed: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return 1;
        }
    }
    
    private function displaySystemConfig()
    {
        $this->info('📋 Current System SMTP Configuration:');
        
        $config = [
            'Host' => SystemConfig::get('SYSTEM_SMTP_HOST') ?: 'Not configured',
            'Port' => SystemConfig::get('SYSTEM_SMTP_PORT') ?: 'Not configured',
            'Username' => SystemConfig::get('SYSTEM_SMTP_USERNAME') ?: 'Not configured',
            'Encryption' => SystemConfig::get('SYSTEM_SMTP_ENCRYPTION') ?: 'Not configured',
            'From Address' => SystemConfig::get('SYSTEM_SMTP_FROM_ADDRESS') ?: 'Not configured',
            'From Name' => SystemConfig::get('SYSTEM_SMTP_FROM_NAME') ?: 'Not configured',
        ];
        
        foreach ($config as $key => $value) {
            $status = $value === 'Not configured' ? '❌' : '✅';
            $this->line("  {$status} {$key}: {$value}");
        }
        
        // Also show what Laravel is using
        $this->info('📋 Laravel Mail Configuration:');
        $laravelConfig = [
            'Default Mailer' => config('mail.default'),
            'SMTP Host' => config('mail.mailers.smtp.host'),
            'SMTP Port' => config('mail.mailers.smtp.port'),
            'SMTP Username' => config('mail.mailers.smtp.username'),
            'SMTP Encryption' => config('mail.mailers.smtp.encryption'),
            'From Address' => config('mail.from.address'),
            'From Name' => config('mail.from.name'),
        ];
        
        foreach ($laravelConfig as $key => $value) {
            $this->line("  📧 {$key}: " . ($value ?: 'Not set'));
        }
    }
    
    private function sendTestEmail(string $email)
    {
        try {
            // Create a custom mailer instance with current settings
            $transport = new \Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport(
                config('mail.mailers.smtp.host'),
                config('mail.mailers.smtp.port'),
                config('mail.mailers.smtp.encryption') === 'ssl' ? true : (config('mail.mailers.smtp.encryption') === 'tls' ? null : false)
            );

            if (config('mail.mailers.smtp.username')) {
                $transport->setUsername(config('mail.mailers.smtp.username'));
            }
            if (config('mail.mailers.smtp.password')) {
                $transport->setPassword(config('mail.mailers.smtp.password'));
            }

            $mailer = new \Symfony\Component\Mailer\Mailer($transport);

            // Create test email
            $testEmail = (new \Symfony\Component\Mime\Email())
                ->from(config('mail.from.address'))
                ->to($email)
                ->subject('System SMTP Configuration Test - ' . now()->format('Y-m-d H:i:s'))
                ->text('This is a test email sent from the Laravel console command to verify the system SMTP configuration is working correctly.')
                ->html('<p>This is a test email sent from the Laravel console command to verify the system SMTP configuration is working correctly.</p><hr><p><small>Sent at: ' . now()->format('Y-m-d H:i:s') . '</small></p>');

            // Send the email
            $mailer->send($testEmail);
            
            $this->info("✅ Test email sent successfully to {$email}");
            
        } catch (\Exception $e) {
            $this->error("❌ Failed to send test email: " . $e->getMessage());
        }
    }
}
