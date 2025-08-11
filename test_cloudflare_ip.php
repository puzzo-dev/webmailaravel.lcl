<?php

require_once __DIR__ . '/backend/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use App\Traits\CloudflareIPTrait;
use App\Traits\GeoIPTrait;

// Bootstrap Laravel application
$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "Testing Cloudflare IP Detection and Geolocation...\n\n";

// Create a test class that uses the traits
class IPTestController {
    use CloudflareIPTrait, GeoIPTrait;
}

$tester = new IPTestController();

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
    ],
    [
        'name' => 'Multiple proxy chain',
        'remote_addr' => '10.0.0.1',
        'headers' => [
            'X-Forwarded-For' => '203.0.113.100, 198.51.100.1, 192.0.2.1'
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
    app()->instance('request', $request);
    $realIP = $tester->getRealClientIP($request);
    echo "Real client IP: $realIP\n";
    
    // Test Cloudflare detection
    $isBehindCF = $tester->isBehindCloudflare($request);
    echo "Behind Cloudflare: " . ($isBehindCF ? 'Yes' : 'No') . "\n";
    
    if ($isBehindCF) {
        $cfCountry = $tester->getCloudflareCountry($request);
        echo "Cloudflare Country: " . ($cfCountry ?: 'Not available') . "\n";
    }
    
    // Test detailed IP info
    $ipDetails = $tester->getIPDetails($request);
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
            $geoData = $tester->getLocation($realIP);
            if ($geoData['success']) {
                echo "  Country: " . ($geoData['country'] ?? 'Unknown') . "\n";
                echo "  City: " . ($geoData['city'] ?? 'Unknown') . "\n";
                echo "  Source: " . ($geoData['source'] ?? 'Unknown') . "\n";
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

echo "Test completed!\n\n";

// Test IP validation
echo "=== Testing IP Validation ===\n";
$testIPs = [
    '8.8.8.8' => 'Valid public IP',
    '192.168.1.1' => 'Private IP',
    '127.0.0.1' => 'Localhost',
    '10.0.0.1' => 'Private IP',
    '172.16.0.1' => 'Private IP',
    '203.0.113.1' => 'Valid public IP',
    'invalid' => 'Invalid IP',
    '999.999.999.999' => 'Invalid IP range'
];

foreach ($testIPs as $ip => $description) {
    $isValid = filter_var($ip, FILTER_VALIDATE_IP) !== false;
    $isPublic = filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
    
    echo "$ip ($description): Valid=" . ($isValid ? 'Yes' : 'No') . ", Public=" . ($isPublic ? 'Yes' : 'No') . "\n";
}

echo "\nAll tests completed!\n";
