<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free',
                'max_campaigns' => 1,
                'max_emails_per_day' => 100,
                'price' => 0,
                'description' => 'Basic plan for getting started',
            ],
            [
                'name' => 'Pro',
                'max_campaigns' => 10,
                'max_emails_per_day' => 1000,
                'price' => 29.99,
                'description' => 'Professional plan for growing businesses',
            ],
            [
                'name' => 'Enterprise',
                'max_campaigns' => -1, // Unlimited
                'max_emails_per_day' => 10000,
                'price' => 99.99,
                'description' => 'Enterprise plan for large-scale operations',
            ],
        ];

        foreach ($plans as $planData) {
            Plan::firstOrCreate(
                ['name' => $planData['name']],
                $planData
            );
        }

        $this->command->info('✅ Plans seeded successfully!');
    }
} 