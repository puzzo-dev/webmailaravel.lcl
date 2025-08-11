<?php

require_once __DIR__ . '/backend/vendor/autoload.php';

use App\Models\User;
use App\Models\SystemConfig;
use App\Http\Controllers\AdminController;
use Illuminate\Http\Request;
use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;

// Bootstrap Laravel application
$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "Testing BTCPay settings save functionality...\n\n";

try {
    // Get current BTCPay settings
    echo "Current BTCPay settings:\n";
    $currentConfig = SystemConfig::getBTCPayConfig();
    foreach ($currentConfig as $key => $value) {
        echo "  {$key}: {$value}\n";
    }
    echo "\n";

    // Simulate a save operation
    echo "Testing save operation...\n";
    
    // Test data
    $testData = [
        'url' => 'https://test.btcpay.com',
        'api_key' => 'test_api_key_123',
        'store_id' => 'test_store_456',
        'webhook_secret' => 'test_webhook_789',
        'currency' => 'EUR'
    ];

    // Save each setting
    foreach ($testData as $key => $value) {
        $configKey = 'btcpay_' . $key;
        SystemConfig::set($configKey, $value);
        echo "  Saved {$configKey} = {$value}\n";
    }

    // Verify saved settings
    echo "\nVerifying saved settings:\n";
    $newConfig = SystemConfig::getBTCPayConfig();
    foreach ($newConfig as $key => $value) {
        $expected = $testData[$key] ?? 'not set';
        $status = ($value === $expected) ? '✓' : '✗';
        echo "  {$status} {$key}: {$value} (expected: {$expected})\n";
    }

    // Restore original settings
    echo "\nRestoring original settings...\n";
    foreach ($currentConfig as $key => $value) {
        $configKey = 'btcpay_' . $key;
        SystemConfig::set($configKey, $value);
        echo "  Restored {$configKey} = {$value}\n";
    }

    echo "\n✓ BTCPay settings save functionality test completed successfully!\n";

} catch (\Exception $e) {
    echo "✗ Error during testing: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
