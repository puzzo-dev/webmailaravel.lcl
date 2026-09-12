<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\EmailVerificationToken;

class EmailVerificationRequested extends Notification implements ShouldQueue
{
    use Queueable;

    protected $verificationToken;
    protected $verificationData;

    /**
     * Create a new notification instance.
     */
    public function __construct(EmailVerificationToken $verificationToken, array $verificationData = [])
    {
        $this->verificationToken = $verificationToken;
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
        $verifyUrl = url("/verify-email?token={$this->verificationToken->token}&email=" . urlencode($this->verificationToken->email));
        $expiresIn = now()->diffInHours($this->verificationToken->expires_at);
        
        return (new MailMessage)
            ->subject('📧 Please Verify Your Email Address')
            ->greeting('Welcome!')
            ->line('Thank you for creating an account with us. To complete your registration and ensure account security, please verify your email address.')
            ->line('')
            ->line('**Verification Details:**')
            ->line('📧 **Email:** ' . $this->verificationToken->email)
            ->line('⏰ **Requested:** ' . $this->verificationToken->created_at->format('Y-m-d H:i:s'))
            ->line('⏳ **Expires in:** ' . $expiresIn . ' hours')
            ->line('')
            ->line('Click the button below to verify your email address:')
            ->action('Verify Email Address', $verifyUrl)
            ->line('')
            ->line('**Why verify your email?**')
            ->line('• Secure your account and enable password recovery')
            ->line('• Receive important account notifications')
            ->line('• Access all platform features')
            ->line('• Ensure you receive campaign updates and reports')
            ->line('')
            ->line('**Important Notes:**')
            ->line('• This verification link will expire in ' . $expiresIn . ' hours')
            ->line('• If you didn\'t create this account, please ignore this email')
            ->line('• You can request a new verification link if this one expires')
            ->line('')
            ->line('Welcome to our platform!')
            ->line('')
            ->line('Best regards,')
            ->line('The Team');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $expiresIn = now()->diffInHours($this->verificationToken->expires_at);
        
        return [
            'title' => '📧 Email Verification Required',
            'message' => "Please verify your email address ({$this->verificationToken->email}) to complete your account setup. The verification link will expire in {$expiresIn} hours. Click to verify your email and unlock all platform features.",
            'type' => 'info',
            'notification_type' => 'email_verification',
            'email' => $this->verificationToken->email,
            'expires_at' => $this->verificationToken->expires_at->toISOString(),
            'expires_in_hours' => $expiresIn,
            'action_url' => '/verify-email',
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $expiresIn = now()->diffInHours($this->verificationToken->expires_at);
        $verifyUrl = url("/verify-email?token={$this->verificationToken->token}&email=" . urlencode($this->verificationToken->email));
        
        $message = "📧 <b>Email Verification Required</b>\n\n";
        $message .= "Welcome! Please verify your email address to complete your account setup.\n\n";
        $message .= "<b>Verification Details:</b>\n";
        $message .= "📧 <b>Email:</b> {$this->verificationToken->email}\n";
        $message .= "⏰ <b>Requested:</b> {$this->verificationToken->created_at->format('Y-m-d H:i:s')}\n";
        $message .= "⏳ <b>Expires in:</b> {$expiresIn} hours\n\n";
        $message .= "🔗 <b>Verification Link:</b> {$verifyUrl}\n\n";
        $message .= "✅ <b>Benefits of verification:</b>\n";
        $message .= "• Secure account recovery\n";
        $message .= "• Receive important notifications\n";
        $message .= "• Access all platform features\n\n";
        $message .= "Welcome to our platform! 🎉";
        
        return [
            'text' => $message,
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => false
        ];
    }
}
