<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SuppressionList>
 */
class SuppressionListFactory extends Factory
{
    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'type' => 'manual',
            'source' => 'manual',
            'reason' => fake()->optional()->word(),
            'suppressed_at' => now(),
        ];
    }
}
