<?php

// Test script for .env sync functionality
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\SystemConfig;

echo "Testing .env sync functionality...\n\n";

// Set some test SMTP configuration
echo "1. Setting test SMTP configuration in database...\n";
SystemConfig::set('SYSTEM_SMTP_HOST', 'host1.iscotenants.com');
SystemConfig::set('SYSTEM_SMTP_PORT', '2525');
SystemConfig::set('SYSTEM_SMTP_USERNAME', 'test@example.com');
SystemConfig::set('SYSTEM_SMTP_PASSWORD', 'testpassword');
SystemConfig::set('SYSTEM_SMTP_ENCRYPTION', 'tls');
SystemConfig::set('SYSTEM_SMTP_FROM_ADDRESS', 'noreply@msz-pl.com');
SystemConfig::set('SYSTEM_SMTP_FROM_NAME', 'MSZ-PL Campaign System');

echo "2. Reading current .env file before sync...\n";
$envFile = __DIR__ . '/.env';
$envContentBefore = file_exists($envFile) ? file_get_contents($envFile) : '';
echo "Current MAIL_HOST in .env: " . (preg_match('/MAIL_HOST=(.*)/', $envContentBefore, $matches) ? $matches[1] : 'Not found') . "\n";

echo "\n3. Calling syncToEnvFile()...\n";
try {
    SystemConfig::syncToEnvFile();
    echo "✅ Sync completed successfully!\n";
} catch (Exception $e) {
    echo "❌ Sync failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n4. Reading .env file after sync...\n";
$envContentAfter = file_get_contents($envFile);
echo "New MAIL_HOST in .env: " . (preg_match('/MAIL_HOST=(.*)/', $envContentAfter, $matches) ? $matches[1] : 'Not found') . "\n";
echo "New MAIL_PORT in .env: " . (preg_match('/MAIL_PORT=(.*)/', $envContentAfter, $matches) ? $matches[1] : 'Not found') . "\n";

echo "\n5. Verifying configuration values...\n";
$expectedMappings = [
    'SYSTEM_SMTP_HOST' => 'MAIL_HOST',
    'SYSTEM_SMTP_PORT' => 'MAIL_PORT',
    'SYSTEM_SMTP_USERNAME' => 'MAIL_USERNAME',
    'SYSTEM_SMTP_PASSWORD' => 'MAIL_PASSWORD',
    'SYSTEM_SMTP_ENCRYPTION' => 'MAIL_ENCRYPTION',
    'SYSTEM_SMTP_FROM_ADDRESS' => 'MAIL_FROM_ADDRESS',
    'SYSTEM_SMTP_FROM_NAME' => 'MAIL_FROM_NAME',
];

foreach ($expectedMappings as $systemKey => $envKey) {
    $systemValue = SystemConfig::get($systemKey);
    
    // Get the raw value from .env file
    if (preg_match("/{$envKey}=(.*)$/m", $envContentAfter, $matches)) {
        $rawEnvValue = $matches[1];
        // Remove quotes and trim for comparison
        $envValue = trim($rawEnvValue, '"\'');
    } else {
        $rawEnvValue = null;
        $envValue = null;
    }
    
    if ($systemValue === $envValue) {
        echo "✅ {$envKey}: {$systemValue}\n";
    } else {
        echo "❌ {$envKey}: Expected '{$systemValue}', got raw '{$rawEnvValue}', parsed '{$envValue}'\n";
    }
}

echo "\nTest completed!\n";
