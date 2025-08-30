<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserLogin extends Notification implements ShouldQueue
{
    use Queueable;

    public $timeout = 30; // Set timeout to 30 seconds
    public $tries = 2; // Only try twice
    public $backoff = [10]; // Wait 10 seconds before retry

    protected $loginData;

    /**
     * Create a new notification instance.
     */
    public function __construct(array $loginData)
    {
        $this->loginData = $loginData;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        $channels = ['database']; // Always store in database
        
        // Temporarily disable email notifications for login alerts to prevent SMTP timeouts
        // Add email channel if user has email notifications enabled
        // if ($notifiable->email_notifications_enabled) {
        //     $channels[] = 'mail';
        // }
        
        // Add Telegram channel if user has Telegram notifications enabled and chat ID
        if ($notifiable->telegram_notifications_enabled && $notifiable->telegram_chat_id) {
            $channels[] = \App\Channels\TelegramChannel::class;
        }
        
        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $location = $this->loginData['location'] ?? 'Unknown location';
        $ip = $this->loginData['ip'] ?? 'Unknown IP';
        $device = $this->loginData['device'] ?? 'Unknown device';
        
        return (new MailMessage)
            ->subject('🔐 Security Alert: New Login to Your Account')
            ->greeting('Hello!')
            ->line('We hope this message finds you well. We\'re writing to inform you about a new login to your account.')
            ->line('')
            ->line('**Login Details:**')
            ->line('📍 **Location:** ' . $location)
            ->line('💻 **Device:** ' . $device)
            ->line('🌐 **IP Address:** ' . $ip)
            ->line('⏰ **Time:** ' . ($this->loginData['time'] ?? now()->format('Y-m-d H:i:s')))
            ->line('')
            ->line('If this was you, no further action is required. However, if you don\'t recognize this login activity, we strongly recommend that you secure your account immediately by changing your password.')
            ->action('Review Account Security', url('/account/security'))
            ->line('Thank you for helping us keep your account safe and secure!')
            ->line('')
            ->line('Best regards,')
            ->line('The Security Team');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $location = $this->loginData['location'] ?? 'Unknown location';
        $ip = $this->loginData['ip'] ?? 'Unknown IP';
        $device = $this->loginData['device'] ?? 'Unknown device';
        $time = $this->loginData['time'] ?? now()->format('Y-m-d H:i:s');
        
        return [
            'title' => '🔐 Security Alert: New Login Detected',
            'message' => "Hello! We noticed a new login to your account on {$time}.\n\n📍 Location: {$location}\n💻 Device: {$device}\n🌐 IP Address: {$ip}\n\nIf this was you, no action is needed. If you don't recognize this activity, please secure your account immediately by changing your password and reviewing your security settings.\n\nThank you for helping us keep your account safe!",
            'type' => 'security',
            'notification_type' => 'login',
            'ip_address' => $ip,
            'location' => $location,
            'device' => $device,
            'browser' => $this->loginData['browser'] ?? 'Unknown Browser',
            'os' => $this->loginData['os'] ?? 'Unknown OS',
            'device_type' => $this->loginData['device_type'] ?? 'Unknown Device',
            'login_time' => $this->loginData['time'] ?? now()->toISOString(),
            'action_url' => '/account/security',
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $location = $this->loginData['location'] ?? 'Unknown location';
        $ip = $this->loginData['ip'] ?? 'Unknown IP';
        $device = $this->loginData['device'] ?? 'Unknown device';
        $time = $this->loginData['time'] ?? now()->format('Y-m-d H:i:s');
        
        $message = "🔐 <b>Security Alert: New Login to Your Account</b>\n\n";
        $message .= "Hello! We noticed a new login to your account.\n\n";
        $message .= "<b>Login Details:</b>\n";
        $message .= "📍 <b>Location:</b> {$location}\n";
        $message .= "💻 <b>Device:</b> {$device}\n";
        $message .= "🌐 <b>IP Address:</b> <code>{$ip}</code>\n";
        $message .= "⏰ <b>Time:</b> {$time}\n\n";
        $message .= "✅ If this was you, no action is needed.\n";
        $message .= "⚠️ If you don't recognize this activity, please secure your account immediately.\n\n";
        $message .= "Thank you for helping us keep your account safe! 🛡️";
        
        return [
            'text' => $message,
            'parse_mode' => 'HTML'
        ];
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        \Illuminate\Support\Facades\Log::error('UserLogin notification failed', [
            'error' => $exception->getMessage(),
            'login_data' => $this->loginData
        ]);
    }
}
