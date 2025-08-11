<?php

require_once __DIR__ . '/backend/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use App\Http\Controllers\TrackingController;

// Bootstrap Laravel application
$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "Testing Cloudflare IP Detection and Geolocation...\n\n";

// Test different IP scenarios using reflection to access protected methods
$controller = new TrackingController();
$reflection = new ReflectionClass($controller);

$getRealClientIPMethod = $reflection->getMethod('getRealClientIP');
$getRealClientIPMethod->setAccessible(true);

$isBehindCloudflareMethod = $reflection->getMethod('isBehindCloudflare');
$isBehindCloudflareMethod->setAccessible(true);

$getCloudflareCountryMethod = $reflection->getMethod('getCloudflareCountry');
$getCloudflareCountryMethod->setAccessible(true);

$getIPDetailsMethod = $reflection->getMethod('getIPDetails');
$getIPDetailsMethod->setAccessible(true);

$getLocationMethod = $reflection->getMethod('getLocation');
$getLocationMethod->setAccessible(true);

// Test different IP scenarios
$testScenarios = [
    [
        'name' => 'Direct IP (no proxy)',
        'remote_addr' => '8.8.8.8',
        'headers' => []
    ],
    [
        'name' => 'Behind Cloudflare',
        'remote_addr' => '172.64.0.1', // Cloudflare IP
        'headers' => [
            'CF-Connecting-IP' => '203.0.113.195', // Real visitor IP
            'CF-Ray' => '12345-LAX',
            'CF-IPCountry' => 'US',
            'X-Forwarded-For' => '203.0.113.195'
        ]
    ],
    [
        'name' => 'Behind generic proxy',
        'remote_addr' => '192.168.1.1',
        'headers' => [
            'X-Forwarded-For' => '198.51.100.42',
            'X-Real-IP' => '198.51.100.42'
        ]
    ]
];

foreach ($testScenarios as $scenario) {
    echo "=== Testing: {$scenario['name']} ===\n";
    
    // Create a mock request
    $request = Request::create('http://test.com/track', 'GET');
    $request->server->set('REMOTE_ADDR', $scenario['remote_addr']);
    
    // Set headers
    foreach ($scenario['headers'] as $header => $value) {
        $request->headers->set($header, $value);
    }
    
    // Test IP detection
    echo "Server IP: {$scenario['remote_addr']}\n";
    echo "Laravel request->ip(): " . $request->ip() . "\n";
    
    // Test our enhanced IP detection
    $realIP = $getRealClientIPMethod->invoke($controller, $request);
    echo "Real client IP: $realIP\n";
    
    // Test Cloudflare detection
    $isBehindCF = $isBehindCloudflareMethod->invoke($controller, $request);
    echo "Behind Cloudflare: " . ($isBehindCF ? 'Yes' : 'No') . "\n";
    
    if ($isBehindCF) {
        $cfCountry = $getCloudflareCountryMethod->invoke($controller, $request);
        echo "Cloudflare Country: " . ($cfCountry ?: 'Not available') . "\n";
    }
    
    // Test detailed IP info
    $ipDetails = $getIPDetailsMethod->invoke($controller, $request);
    echo "IP Details:\n";
    foreach ($ipDetails as $key => $value) {
        if ($value !== null) {
            echo "  $key: $value\n";
        }
    }
    
    // Test geolocation (only if IP is valid public IP)
    if (filter_var($realIP, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        echo "Testing geolocation for $realIP...\n";
        try {
            $geoData = $getLocationMethod->invoke($controller, $realIP);
            if ($geoData['success']) {
                echo "  Country: " . ($geoData['country'] ?? 'Unknown') . "\n";
                echo "  City: " . ($geoData['city'] ?? 'Unknown') . "\n";
                echo "  Source: " . ($geoData['source'] ?? 'Unknown') . "\n";
                if (isset($geoData['cf_country'])) {
                    echo "  Cloudflare Country: " . $geoData['cf_country'] . "\n";
                }
            } else {
                echo "  Geolocation failed: " . ($geoData['error'] ?? 'Unknown error') . "\n";
            }
        } catch (Exception $e) {
            echo "  Geolocation error: " . $e->getMessage() . "\n";
        }
    } else {
        echo "Skipping geolocation for private/invalid IP: $realIP\n";
    }
    
    echo "\n";
}

echo "Test completed!\n";
