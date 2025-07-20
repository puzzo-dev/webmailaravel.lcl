<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'description' => 'Perfect for small businesses and individuals',
                'price' => 19.99,
                'currency' => 'USD',
                'duration_days' => 30,
                'max_domains' => 1,
                'max_senders_per_domain' => 2,
                'max_total_campaigns' => 10,
                'max_live_campaigns' => 1,
                'daily_sending_limit' => 1000,
                'features' => [
                    'Basic Analytics',
                    'Email Support',
                    'Standard Templates',
                    'Basic Reporting'
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Professional',
                'description' => 'Ideal for growing businesses and marketing teams',
                'price' => 49.99,
                'currency' => 'USD',
                'duration_days' => 30,
                'max_domains' => 3,
                'max_senders_per_domain' => 5,
                'max_total_campaigns' => 50,
                'max_live_campaigns' => 3,
                'daily_sending_limit' => 5000,
                'features' => [
                    'Advanced Analytics',
                    'Priority Support',
                    'Custom Domains',
                    'API Access',
                    'Advanced Reporting',
                    'A/B Testing'
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Enterprise',
                'description' => 'For large organizations with high-volume needs',
                'price' => 99.99,
                'currency' => 'USD',
                'duration_days' => 30,
                'max_domains' => 10,
                'max_senders_per_domain' => 10,
                'max_total_campaigns' => 200,
                'max_live_campaigns' => 10,
                'daily_sending_limit' => 25000,
                'features' => [
                    'Advanced Analytics',
                    'Dedicated Support',
                    'Custom Domains',
                    'API Access',
                    'White-label Options',
                    'Advanced Reporting',
                    'A/B Testing',
                    'Custom Integrations'
                ],
                'is_active' => true,
            ],
        ];

        foreach ($plans as $planData) {
            Plan::create($planData);
        }
    }
} 