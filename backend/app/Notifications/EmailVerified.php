<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailVerified extends Notification implements ShouldQueue
{
    use Queueable;

    protected $verificationData;

    /**
     * Create a new notification instance.
     */
    public function __construct(array $verificationData = [])
    {
        $this->verificationData = $verificationData;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return [\App\Channels\TelegramChannel::class];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('✅ Email Successfully Verified')
            ->greeting('Congratulations!')
            ->line('Your email address has been successfully verified!')
            ->line('')
            ->line('**Verification Details:**')
            ->line('📧 **Email:** ' . $notifiable->email)
            ->line('🌐 **IP Address:** ' . ($this->verificationData['ip'] ?? 'Unknown'))
            ->line('💻 **Device:** ' . ($this->verificationData['device'] ?? 'Unknown'))
            ->line('⏰ **Time:** ' . ($this->verificationData['time'] ?? now()->format('Y-m-d H:i:s')))
            ->line('')
            ->line('**Your account is now fully activated! You can now:**')
            ->line('• Access all platform features')
            ->line('• Receive important account notifications')
            ->line('• Use password recovery if needed')
            ->line('• Create and manage email campaigns')
            ->line('• Access analytics and reporting')
            ->line('')
            ->line('**Next Steps:**')
            ->line('• Complete your profile setup')
            ->line('• Configure your notification preferences')
            ->line('• Explore our platform features')
            ->action('Go to Dashboard', url('/dashboard'))
            ->line('')
            ->line('Thank you for joining our platform!')
            ->line('')
            ->line('Best regards,')
            ->line('The Team');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => '✅ Email Successfully Verified',
            'message' => "Congratulations! Your email address ({$notifiable->email}) has been successfully verified from IP {$this->verificationData['ip']} on {$this->verificationData['time']}. Your account is now fully activated and you can access all platform features.",
            'type' => 'success',
            'notification_type' => 'email_verified',
            'email' => $notifiable->email,
            'ip_address' => $this->verificationData['ip'] ?? 'Unknown',
            'device' => $this->verificationData['device'] ?? 'Unknown',
            'verified_time' => $this->verificationData['time'] ?? now()->toISOString(),
            'action_url' => '/dashboard',
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $message = "✅ <b>Email Successfully Verified</b>\n\n";
        $message .= "Congratulations! Your email address has been successfully verified.\n\n";
        $message .= "<b>Verification Details:</b>\n";
        $message .= "📧 <b>Email:</b> {$notifiable->email}\n";
        $message .= "🌐 <b>IP Address:</b> <code>{$this->verificationData['ip']}</code>\n";
        $message .= "💻 <b>Device:</b> {$this->verificationData['device']}\n";
        $message .= "⏰ <b>Time:</b> {$this->verificationData['time']}\n\n";
        $message .= "🎉 <b>Your account is now fully activated!</b>\n\n";
        $message .= "✨ <b>You can now:</b>\n";
        $message .= "• Access all platform features\n";
        $message .= "• Create email campaigns\n";
        $message .= "• View analytics and reports\n";
        $message .= "• Manage your account settings\n\n";
        $message .= "Welcome to our platform! 🚀";
        
        return [
            'text' => $message,
            'parse_mode' => 'HTML'
        ];
    }
}
