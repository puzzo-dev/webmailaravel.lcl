<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BounceCredential>
 */
class BounceCredentialFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'email' => fake()->safeEmail(),
            'protocol' => 'imap',
            'host' => fake()->domainName(),
            'port' => 993,
            'username' => fake()->userName(),
            'password' => fake()->password(),
            'encryption' => 'ssl',
            'is_active' => true,
            'is_default' => false,
        ];
    }
}
