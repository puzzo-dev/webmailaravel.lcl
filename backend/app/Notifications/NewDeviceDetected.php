<?php

namespace App\Notifications;

use App\Models\Device;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewDeviceDetected extends Notification implements ShouldQueue
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
            ->subject('New Device Detected')
            ->line('A new device has been detected and registered to your account.')
            ->line("Device: {$this->device->device_name} ({$this->device->device_id})")
            ->line("IP Address: {$this->device->ip_address}")
            ->line("Last Seen: " . $this->device->last_seen?->format('Y-m-d H:i:s'))
            ->action('Manage Devices', url('/devices'))
            ->line('If this was not you, please review your device list.');
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
            'last_seen' => $this->device->last_seen,
            'type' => 'new_device_detected',
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
            'last_seen' => $this->device->last_seen,
            'type' => 'new_device_detected',
            'message' => 'New device detected and registered.',
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
        $lastSeen = $this->device->last_seen ? $this->device->last_seen->format('Y-m-d H:i:s') : 'Unknown';
        
        return [
            'text' => "📱 <b>New Device Detected</b>\n\n" .
                     "Device: <b>{$deviceName}</b>\n" .
                     "ID: <code>{$deviceId}</code>\n" .
                     "IP Address: <code>{$ipAddress}</code>\n" .
                     "Last Seen: <b>{$lastSeen}</b>\n\n" .
                     "Manage devices: " . url('/devices'),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ];
    }
}
