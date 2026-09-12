<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SmtpConfig>
 */
class SmtpConfigFactory extends Factory
{
    public function definition(): array
    {
        return [
            'host' => fake()->domainName(),
            'port' => 587,
            'username' => fake()->userName(),
            'password' => fake()->password(),
            'encryption' => 'tls',
            'is_active' => true,
        ];
    }
}
