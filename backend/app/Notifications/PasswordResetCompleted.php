<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetCompleted extends Notification implements ShouldQueue
{
    use Queueable;

    protected $resetData;

    /**
     * Create a new notification instance.
     */
    public function __construct(array $resetData = [])
    {
        $this->resetData = $resetData;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('✅ Password Successfully Reset')
            ->greeting('Hello!')
            ->line('Your password has been successfully reset.')
            ->line('')
            ->line('**Reset Details:**')
            ->line('📧 **Email:** ' . $notifiable->email)
            ->line('🌐 **IP Address:** ' . ($this->resetData['ip'] ?? 'Unknown'))
            ->line('💻 **Device:** ' . ($this->resetData['device'] ?? 'Unknown'))
            ->line('⏰ **Time:** ' . ($this->resetData['time'] ?? now()->format('Y-m-d H:i:s')))
            ->line('')
            ->line('**What this means:**')
            ->line('• Your old password is no longer valid')
            ->line('• You can now log in with your new password')
            ->line('• All active sessions have been logged out for security')
            ->line('')
            ->line('**If you didn\'t reset your password:**')
            ->line('• Someone may have unauthorized access to your account')
            ->line('• Please contact our support team immediately')
            ->line('• Change your password again as soon as possible')
            ->action('Secure Your Account', url('/account/security'))
            ->line('')
            ->line('Thank you for keeping your account secure!')
            ->line('')
            ->line('Best regards,')
            ->line('The Security Team');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => '✅ Password Successfully Reset',
            'message' => "Your password has been successfully reset from IP {$this->resetData['ip']} using {$this->resetData['device']} on {$this->resetData['time']}. If you didn't perform this action, please contact support immediately.",
            'type' => 'security',
            'notification_type' => 'password_reset_completed',
            'ip_address' => $this->resetData['ip'] ?? 'Unknown',
            'device' => $this->resetData['device'] ?? 'Unknown',
            'reset_time' => $this->resetData['time'] ?? now()->toISOString(),
            'action_url' => '/account/security',
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $message = "✅ <b>Password Successfully Reset</b>\n\n";
        $message .= "Your password has been successfully reset.\n\n";
        $message .= "<b>Reset Details:</b>\n";
        $message .= "📧 <b>Email:</b> {$notifiable->email}\n";
        $message .= "🌐 <b>IP Address:</b> <code>{$this->resetData['ip']}</code>\n";
        $message .= "💻 <b>Device:</b> {$this->resetData['device']}\n";
        $message .= "⏰ <b>Time:</b> {$this->resetData['time']}\n\n";
        $message .= "🔐 <b>Security Notes:</b>\n";
        $message .= "• Your old password is no longer valid\n";
        $message .= "• All active sessions have been logged out\n";
        $message .= "• You can now log in with your new password\n\n";
        $message .= "⚠️ If you didn't reset your password, contact support immediately!";
        
        return [
            'text' => $message,
            'parse_mode' => 'HTML'
        ];
    }
}
