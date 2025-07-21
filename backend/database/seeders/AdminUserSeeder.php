<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\SystemConfig;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'email' => 'admin@example.com',
                'username' => 'admin',
                'name' => 'System Administrator',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'country' => 'US',
                'city' => 'New York'
            ]
        );

        // Initialize system configurations
        $this->initializeSystemConfigs();

        $this->command->info('Admin user created successfully!');
        $this->command->info('Email: admin@example.com');
        $this->command->info('Password: password123');
    }

    /**
     * Initialize system configurations
     */
    protected function initializeSystemConfigs(): void
    {
        SystemConfig::initializeDefaults();

        $this->command->info('System configurations initialized.');
    }
} 