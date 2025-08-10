<?php

namespace Database\Seeders;

use App\Models\SystemConfig;
use Illuminate\Database\Seeder;

class WebmailConfigSeeder extends Seeder
{
    /**
     * Run the database seeds to set up webmail configuration.
     */
    public function run(): void
    {
        // Set webmail configuration
        SystemConfig::set('WEBMAIL_ENABLED', true);
        SystemConfig::set('WEBMAIL_URL', 'https://webmail.example.com');
        
        $this->command->info('Webmail configuration has been set successfully.');
    }
}
