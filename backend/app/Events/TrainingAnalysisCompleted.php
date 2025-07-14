<?php

namespace App\Events;

use App\Models\TrainingConfig;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TrainingAnalysisCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $trainingConfig;
    public $analysisData;

    /**
     * Create a new event instance.
     */
    public function __construct(TrainingConfig $trainingConfig, array $analysisData = [])
    {
        $this->trainingConfig = $trainingConfig;
        $this->analysisData = $analysisData;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->trainingConfig->user_id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'domain_name' => $this->trainingConfig->domain->name,
            'daily_limit' => $this->trainingConfig->daily_limit,
            'last_analysis' => $this->trainingConfig->last_analysis,
            'analysis_data' => $this->analysisData,
        ];
    }
}
