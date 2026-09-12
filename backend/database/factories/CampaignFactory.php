<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Campaign>
 */
class CampaignFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true),
            'subject' => fake()->sentence(),
            'status' => 'draft',
            'sender_ids' => [],
            'content_ids' => [],
            'recipient_list_path' => 'storage/recipient_lists/' . fake()->word() . '.txt',
            'recipient_count' => 0,
            'total_sent' => 0,
            'total_failed' => 0,
            'enable_content_switching' => false,
        ];
    }

    /**
     * Indicate the campaign is running.
     */
    public function running(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'running',
        ]);
    }

    /**
     * Indicate the campaign is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }
}
