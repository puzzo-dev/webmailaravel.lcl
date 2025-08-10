<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\PasswordReset;

class PasswordResetRequested extends Notification implements ShouldQueue
{
    use Queueable;

    protected $passwordReset;
    protected $resetData;

    /**
     * Create a new notification instance.
     */
    public function __construct(PasswordReset $passwordReset, array $resetData = [])
    {
        $this->passwordReset = $passwordReset;
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
        $resetUrl = url("/reset-password?token={$this->passwordReset->token}&email=" . urlencode($this->passwordReset->email));
        $expiresIn = now()->diffInMinutes($this->passwordReset->expires_at);
        
        return (new MailMessage)
            ->subject('🔐 Password Reset Request')
            ->greeting('Hello!')
            ->line('We received a request to reset your password for your account.')
            ->line('')
            ->line('**Request Details:**')
            ->line('📧 **Email:** ' . $this->passwordReset->email)
            ->line('🌐 **IP Address:** ' . ($this->resetData['ip'] ?? 'Unknown'))
            ->line('⏰ **Time:** ' . $this->passwordReset->created_at->format('Y-m-d H:i:s'))
            ->line('⏳ **Expires in:** ' . $expiresIn . ' minutes')
            ->line('')
            ->line('If you requested this password reset, click the button below to reset your password:')
            ->action('Reset Password', $resetUrl)
            ->line('')
            ->line('**Important Security Information:**')
            ->line('• This link will expire in ' . $expiresIn . ' minutes for your security')
            ->line('• If you did not request this password reset, please ignore this email')
            ->line('• Your password will not be changed unless you click the link above')
            ->line('• If you continue to receive these emails, please contact our support team')
            ->line('')
            ->line('Thank you for helping us keep your account secure!')
            ->line('')
            ->line('Best regards,')
            ->line('The Security Team');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $expiresIn = now()->diffInMinutes($this->passwordReset->expires_at);
        
        return [
            'title' => '🔐 Password Reset Requested',
            'message' => "A password reset was requested for your account from IP {$this->resetData['ip']} on {$this->passwordReset->created_at->format('Y-m-d H:i:s')}. The reset link will expire in {$expiresIn} minutes. If you didn't request this, please ignore this notification.",
            'type' => 'security',
            'notification_type' => 'password_reset',
            'ip_address' => $this->resetData['ip'] ?? 'Unknown',
            'device' => $this->resetData['device'] ?? 'Unknown',
            'expires_at' => $this->passwordReset->expires_at->toISOString(),
            'expires_in_minutes' => $expiresIn,
            'action_url' => '/account/security',
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $expiresIn = now()->diffInMinutes($this->passwordReset->expires_at);
        $resetUrl = url("/reset-password?token={$this->passwordReset->token}&email=" . urlencode($this->passwordReset->email));
        
        $message = "🔐 <b>Password Reset Requested</b>\n\n";
        $message .= "A password reset was requested for your account.\n\n";
        $message .= "<b>Request Details:</b>\n";
        $message .= "📧 <b>Email:</b> {$this->passwordReset->email}\n";
        $message .= "🌐 <b>IP Address:</b> <code>{$this->resetData['ip']}</code>\n";
        $message .= "💻 <b>Device:</b> {$this->resetData['device']}\n";
        $message .= "⏰ <b>Time:</b> {$this->passwordReset->created_at->format('Y-m-d H:i:s')}\n";
        $message .= "⏳ <b>Expires in:</b> {$expiresIn} minutes\n\n";
        $message .= "🔗 <b>Reset Link:</b> {$resetUrl}\n\n";
        $message .= "⚠️ If you didn't request this, please ignore this message.\n";
        $message .= "🛡️ Your password remains secure until you use the reset link.";
        
        return [
            'text' => $message,
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => false
        ];
    }
}
