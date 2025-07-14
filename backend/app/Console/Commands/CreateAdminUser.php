<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\SystemConfig;
use App\Services\AdminService;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:create-admin 
                            {--email= : Admin user email}
                            {--password= : Admin user password}
                            {--name= : Admin user name}
                            {--country= : Admin user country}
                            {--city= : Admin user city}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an admin user with proper role and permissions';

    /**
     * Execute the console command.
     */
    public function handle(AdminService $adminService): int
    {
        $this->info('Creating admin user...');

        // Get input values
        $email = $this->option('email') ?: $this->ask('Enter admin email');
        $password = $this->option('password') ?: $this->secret('Enter admin password');
        $name = $this->option('name') ?: $this->ask('Enter admin name (optional)');
        $country = $this->option('country') ?: $this->ask('Enter country (optional)');
        $city = $this->option('city') ?: $this->ask('Enter city (optional)');

        // Validate email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email address');
            return 1;
        }

        // Validate password
        if (strlen($password) < 8) {
            $this->error('Password must be at least 8 characters long');
            return 1;
        }

        // Check if user already exists
        if (User::where('email', $email)->exists()) {
            $this->error('User with this email already exists');
            return 1;
        }

        try {
            // Create admin user
            $result = $adminService->createAdminUser($email, $password, [
                'name' => $name,
                'country' => $country,
                'city' => $city
            ]);

            if ($result['success']) {
                $this->info('Admin user created successfully!');
                $this->info("Email: {$email}");
                $this->info("Role: admin");
                
                if ($name) {
                    $this->info("Name: {$name}");
                }
                
                return 0;
            } else {
                $this->error('Failed to create admin user: ' . $result['error']);
                return 1;
            }

        } catch (\Exception $e) {
            $this->error('Error creating admin user: ' . $e->getMessage());
            return 1;
        }
    }
} 