<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserLogin extends Notification implements ShouldQueue
{
    use Queueable;

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
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Login Detected')
            ->greeting('Hello!')
            ->line('A new login was detected on your account.')
            ->line('Device: ' . ($this->loginData['device'] ?? 'Unknown'))
            ->line('IP Address: ' . ($this->loginData['ip'] ?? 'Unknown'))
            ->line('Location: ' . ($this->loginData['location'] ?? 'Unknown'))
            ->line('Time: ' . ($this->loginData['time'] ?? now()->format('Y-m-d H:i:s')))
            ->line('If this wasn\'t you, please secure your account immediately.')
            ->action('View Account Security', url('/account/security'))
            ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New Login Detected',
            'message' => 'A new login was detected on your account from ' . ($this->loginData['device'] ?? 'unknown device') . ' at ' . ($this->loginData['time'] ?? now()->format('Y-m-d H:i:s')),
            'type' => 'login',
            'device' => $this->loginData['device'] ?? 'Unknown',
            'ip_address' => $this->loginData['ip'] ?? 'Unknown',
            'location' => $this->loginData['location'] ?? 'Unknown',
            'login_time' => $this->loginData['time'] ?? now()->toISOString(),
        ];
    }
}
