<?php

namespace App\Events;

use App\Models\Campaign;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CampaignStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $campaign;

    /**
     * Create a new event instance.
     */
    public function __construct(Campaign $campaign)
    {
        $this->campaign = $campaign;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->campaign->user_id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'campaign_id' => $this->campaign->id,
            'campaign_name' => $this->campaign->name,
            'status' => $this->campaign->status,
            'total_sent' => $this->campaign->total_sent,
            'total_failed' => $this->campaign->total_failed,
            'updated_at' => $this->campaign->updated_at,
        ];
    }
}
