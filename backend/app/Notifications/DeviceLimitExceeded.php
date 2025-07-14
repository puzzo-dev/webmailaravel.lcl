<?php

namespace App\Notifications;

use App\Models\Device;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DeviceLimitExceeded extends Notification implements ShouldQueue
{
    use Queueable;

    public $device;

    /**
     * Create a new notification instance.
     */
    public function __construct(Device $device)
    {
        $this->device = $device;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast', \App\Channels\TelegramChannel::class];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Device Limit Exceeded')
            ->line('You have exceeded the maximum number of devices allowed (2).')
            ->line("Device: {$this->device->device_name} ({$this->device->device_id})")
            ->line("IP Address: {$this->device->ip_address}")
            ->action('Manage Devices', url('/devices'))
            ->line('Please remove an existing device before adding a new one.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'device_id' => $this->device->device_id,
            'device_name' => $this->device->device_name,
            'ip_address' => $this->device->ip_address,
            'type' => 'device_limit_exceeded',
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): array
    {
        return [
            'device_id' => $this->device->device_id,
            'device_name' => $this->device->device_name,
            'ip_address' => $this->device->ip_address,
            'type' => 'device_limit_exceeded',
            'message' => 'Device limit exceeded. Maximum 2 devices allowed.',
        ];
    }

    /**
     * Get the Telegram representation of the notification.
     */
    public function toTelegram(object $notifiable): array
    {
        $deviceName = $this->device->device_name;
        $deviceId = $this->device->device_id;
        $ipAddress = $this->device->ip_address;
        
        return [
            'text' => "⚠️ <b>Device Limit Exceeded</b>\n\n" .
                     "You have exceeded the maximum number of devices (2).\n\n" .
                     "Device: <b>{$deviceName}</b>\n" .
                     "ID: <code>{$deviceId}</code>\n" .
                     "IP Address: <code>{$ipAddress}</code>\n\n" .
                     "Please remove an existing device before adding a new one.\n\n" .
                     "Manage devices: " . url('/devices'),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}
