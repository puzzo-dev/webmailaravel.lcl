<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

echo "Testing Backend Configuration...\n\n";

// Test database connection
try {
    DB::connection()->getPdo();
    echo "✓ Database connection successful\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
}

// Test JWT configuration
try {
    $jwtSecret = Config::get('jwt.secret');
    if ($jwtSecret) {
        echo "✓ JWT secret configured\n";
    } else {
        echo "✗ JWT secret not configured\n";
    }
} catch (Exception $e) {
    echo "✗ JWT configuration error: " . $e->getMessage() . "\n";
}

// Test User model
try {
    $user = new \App\Models\User();
    echo "✓ User model loaded successfully\n";
} catch (Exception $e) {
    echo "✗ User model error: " . $e->getMessage() . "\n";
}

echo "\nBackend test completed.\n"; 
 

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

echo "Testing Backend Configuration...\n\n";

// Test database connection
try {
    DB::connection()->getPdo();
    echo "✓ Database connection successful\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
}

// Test JWT configuration
try {
    $jwtSecret = Config::get('jwt.secret');
    if ($jwtSecret) {
        echo "✓ JWT secret configured\n";
    } else {
        echo "✗ JWT secret not configured\n";
    }
} catch (Exception $e) {
    echo "✗ JWT configuration error: " . $e->getMessage() . "\n";
}

// Test User model
try {
    $user = new \App\Models\User();
    echo "✓ User model loaded successfully\n";
} catch (Exception $e) {
    echo "✗ User model error: " . $e->getMessage() . "\n";
}

echo "\nBackend test completed.\n"; 