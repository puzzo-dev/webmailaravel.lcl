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
    use Dispatchable, InteractsWithSockets;

    public $campaignId;
    public $campaignName;
    public $status;
    public $totalSent;
    public $totalFailed;
    public $userId;
    public $updatedAt;

    /**
     * Create a new event instance.
     */
    public function __construct(Campaign $campaign)
    {
        // Store campaign data as properties instead of the model to avoid serialization issues
        $this->campaignId = $campaign->id;
        $this->campaignName = $campaign->name;
        $this->status = $campaign->status;
        $this->totalSent = $campaign->total_sent;
        $this->totalFailed = $campaign->total_failed;
        $this->userId = $campaign->user_id;
        $this->updatedAt = $campaign->updated_at;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->userId),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'campaign_id' => $this->campaignId,
            'campaign_name' => $this->campaignName,
            'status' => $this->status,
            'total_sent' => $this->totalSent,
            'total_failed' => $this->totalFailed,
            'updated_at' => $this->updatedAt,
        ];
    }
}
