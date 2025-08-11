<?php

// Test script for Cloudflare IP detection
require_once __DIR__ . '/backend/vendor/autoload.php';

use App\Traits\CloudflareIPTrait;
use Illuminate\Http\Request;
use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;

// Bootstrap Laravel application
$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

// Create a test class using the trait
class IPTestClass {
    use CloudflareIPTrait;
}

echo "Testing Cloudflare IP Detection\n";
echo "================================\n\n";

$ipTest = new IPTestClass();

// Test 1: Create a mock request with Cloudflare headers
echo "Test 1: Mock Cloudflare Request\n";
echo "-------------------------------\n";

$request = new Request();
$request->headers->set('CF-Connecting-IP', '203.0.113.45');
$request->headers->set('CF-Ray', '123abc456def789');
$request->headers->set('CF-IPCountry', 'US');
$request->headers->set('X-Forwarded-For', '203.0.113.45, 198.51.100.1');

$realIP = $ipTest->getRealClientIP($request);
$details = $ipTest->getIPDetails($request);

echo "Detected Real IP: {$realIP}\n";
echo "Is behind Cloudflare: " . ($ipTest->isBehindCloudflare($request) ? 'Yes' : 'No') . "\n";
echo "Cloudflare Country: " . ($ipTest->getCloudflareCountry($request) ?? 'Not available') . "\n";
echo "Headers detected:\n";
foreach ($details['headers'] as $header => $value) {
    echo "  {$header}: {$value}\n";
}

echo "\n";

// Test 2: Create a mock request with only X-Forwarded-For
echo "Test 2: Mock X-Forwarded-For Request\n";
echo "------------------------------------\n";

$request2 = new Request();
$request2->headers->set('X-Forwarded-For', '198.51.100.1, 10.0.0.1, 192.168.1.1');

$realIP2 = $ipTest->getRealClientIP($request2);
$details2 = $ipTest->getIPDetails($request2);

echo "Detected Real IP: {$realIP2}\n";
echo "Is behind Cloudflare: " . ($ipTest->isBehindCloudflare($request2) ? 'Yes' : 'No') . "\n";
echo "Headers detected:\n";
foreach ($details2['headers'] as $header => $value) {
    echo "  {$header}: {$value}\n";
}

echo "\n";

// Test 3: Check IP validation
echo "Test 3: IP Validation\n";
echo "---------------------\n";

$testIPs = [
    '203.0.113.45' => 'Public IP',
    '192.168.1.1' => 'Private IP',
    '10.0.0.1' => 'Private IP',
    '127.0.0.1' => 'Localhost',
    '::1' => 'IPv6 Localhost',
    '2001:db8::1' => 'IPv6 Documentation',
    'invalid-ip' => 'Invalid IP'
];

foreach ($testIPs as $ip => $description) {
    $isValid = $ipTest->isValidPublicIP($ip);
    $status = $isValid ? '✓ Valid Public' : '✗ Invalid/Private';
    echo "  {$ip} ({$description}): {$status}\n";
}

echo "\n✓ IP Detection Test Completed\n";

// Test with actual request if available
if (isset($_SERVER['HTTP_HOST'])) {
    echo "\nTest 4: Current Request\n";
    echo "----------------------\n";
    
    $currentRequest = Request::createFromGlobals();
    $currentRealIP = $ipTest->getRealClientIP($currentRequest);
    $currentDetails = $ipTest->getIPDetails($currentRequest);
    
    echo "Current Real IP: {$currentRealIP}\n";
    echo "Laravel IP: {$currentDetails['laravel_ip']}\n";
    echo "Is behind Cloudflare: " . ($currentDetails['is_cloudflare'] ? 'Yes' : 'No') . "\n";
    
    if (!empty($currentDetails['headers'])) {
        echo "Headers:\n";
        foreach ($currentDetails['headers'] as $header => $value) {
            echo "  {$header}: {$value}\n";
        }
    }
}
