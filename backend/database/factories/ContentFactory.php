<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Content>
 */
class ContentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true),
            'subject' => fake()->sentence(),
            'html_body' => '<p>' . fake()->paragraph() . '</p>',
            'text_body' => fake()->paragraph(),
            'is_active' => true,
        ];
    }
}
