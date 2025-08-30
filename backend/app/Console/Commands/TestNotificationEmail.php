<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Notifications\AdminNotification;

class TestNotificationEmail extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'test:notification-email 
                            {email : The email address to send the test notification to}
                            {--user-id= : Use a specific user ID instead of creating a temporary user}';

    /**
     * The console command description.
     */
    protected $description = 'Send a test notification email to verify system SMTP configuration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $userId = $this->option('user-id');
        
        $this->info("📧 Sending test notification email to {$email}...");
        
        try {
            // Get or create a user for the notification
            if ($userId) {
                $user = User::findOrFail($userId);
                $this->info("Using existing user: {$user->name} ({$user->email})");
            } else {
                // Create a temporary user object for testing
                $user = new User([
                    'name' => 'Test User',
                    'email' => $email,
                    'email_verified_at' => now(),
                ]);
                // Don't save to database, just use for notification
            }
            
            // Send test notification using Laravel's notification system
            $notification = new AdminNotification(
                'System SMTP Test Notification',
                'This is a test notification sent via Laravel\'s notification system to verify that system SMTP configuration is working correctly for notifications, queue jobs, and other system emails.',
                'info'
            );
            
            // Use notify() method which will use the system SMTP configuration
            $user->notify($notification);
            
            $this->info("✅ Test notification sent successfully!");
            $this->info("📝 This notification used the system SMTP configuration from the database.");
            $this->info("📬 Check the email inbox for {$email} to verify delivery.");
            
        } catch (\Exception $e) {
            $this->error("❌ Failed to send test notification: " . $e->getMessage());
            $this->error("Stack trace: " . $e->getTraceAsString());
            return 1;
        }
        
        return 0;
    }
}
