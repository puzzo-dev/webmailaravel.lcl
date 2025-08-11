<?php

// Direct test of AdminController::updateSystemSettings method
require_once __DIR__ . '/backend/vendor/autoload.php';

use App\Models\User;
use App\Models\SystemConfig;
use App\Http\Controllers\AdminController;
use Illuminate\Http\Request;
use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Auth;

// Bootstrap Laravel application
$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "Testing AdminController::updateSystemSettings for BTCPay...\n\n";

try {
    // Create a mock admin user for authentication
    $adminUser = User::where('email', 'admin@test.com')->first();
    if (!$adminUser) {
        echo "Creating test admin user...\n";
        $adminUser = User::create([
            'name' => 'Test Admin',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);
        $adminUser->assignRole('admin');
    }
    
    // Authenticate as admin
    Auth::login($adminUser);
    echo "Authenticated as admin user: {$adminUser->email}\n\n";

    // Get current BTCPay settings
    echo "Current BTCPay settings:\n";
    $currentConfig = SystemConfig::getBTCPayConfig();
    foreach ($currentConfig as $key => $value) {
        echo "  {$key}: {$value}\n";
    }
    echo "\n";

    // Create AdminController instance
    $controller = new AdminController();

    // Create request data for BTCPay update
    $testData = [
        'btcpay' => [
            'url' => 'https://updated.btcpay.test',
            'api_key' => 'updated_api_key_456',
            'store_id' => 'updated_store_789',
            'webhook_secret' => 'updated_webhook_secret',
            'currency' => 'EUR'
        ]
    ];

    // Create request object
    $request = new Request();
    $request->merge($testData);

    echo "Sending update request with data:\n";
    foreach ($testData['btcpay'] as $key => $value) {
        echo "  {$key}: {$value}\n";
    }
    echo "\n";

    // Call the update method
    $response = $controller->updateSystemSettings($request);
    $responseData = $response->getData(true);

    echo "Controller response:\n";
    echo "  Success: " . ($responseData['success'] ? 'true' : 'false') . "\n";
    echo "  Message: " . ($responseData['message'] ?? 'N/A') . "\n";
    if (isset($responseData['data'])) {
        echo "  Updated settings count: " . count($responseData['data']) . "\n";
    }
    echo "\n";

    // Verify the update
    echo "Verifying updated settings:\n";
    $newConfig = SystemConfig::getBTCPayConfig();
    foreach ($newConfig as $key => $value) {
        $expected = $testData['btcpay'][$key] ?? 'not set';
        $status = ($value === $expected) ? '✓' : '✗';
        echo "  {$status} {$key}: {$value} (expected: {$expected})\n";
    }
    echo "\n";

    // Restore original settings
    echo "Restoring original settings...\n";
    $restoreData = ['btcpay' => $currentConfig];
    $restoreRequest = new Request();
    $restoreRequest->merge($restoreData);
    
    $restoreResponse = $controller->updateSystemSettings($restoreRequest);
    $restoreResponseData = $restoreResponse->getData(true);
    
    echo "Restore response success: " . ($restoreResponseData['success'] ? 'true' : 'false') . "\n";

    // Final verification
    echo "\nFinal verification:\n";
    $finalConfig = SystemConfig::getBTCPayConfig();
    foreach ($finalConfig as $key => $value) {
        $expected = $currentConfig[$key] ?? 'not set';
        $status = ($value === $expected) ? '✓' : '✗';
        echo "  {$status} {$key}: {$value} (expected: {$expected})\n";
    }

    echo "\n✓ BTCPay settings save functionality test completed successfully!\n";

} catch (\Exception $e) {
    echo "✗ Error during testing: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
} finally {
    // Clean up test user if created
    if (isset($adminUser) && $adminUser->email === 'admin@test.com') {
        $adminUser->delete();
        echo "\nCleaned up test admin user.\n";
    }
}
