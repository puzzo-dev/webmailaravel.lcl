<?php

namespace App\Events;

use App\Models\Device;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeviceLimitExceeded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $device;

    /**
     * Create a new event instance.
     */
    public function __construct(Device $device)
    {
        $this->device = $device;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->device->user_id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->device->device_id,
            'device_name' => $this->device->device_name,
            'ip_address' => $this->device->ip_address,
            'message' => 'Device limit exceeded. Maximum 2 devices allowed.',
        ];
    }
}
