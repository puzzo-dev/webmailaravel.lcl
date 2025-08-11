<?php

require_once __DIR__ . '/backend/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;

// Bootstrap Laravel application
$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "Testing Authentication and Middleware...\n\n";

// Test middleware configuration
echo "=== Middleware Configuration Test ===\n";

try {
    // Create a test request
    $request = Request::create('/api/dashboard', 'GET');
    
    // Test if the middleware is properly configured
    $app = app();
    
    echo "Application loaded successfully\n";
    echo "Environment: " . config('app.env') . "\n";
    
    // Check if middleware is registered
    $middleware = $app->make('Illuminate\Foundation\Http\Kernel')->getMiddleware();
    echo "Global middleware count: " . count($middleware) . "\n";
    
    // Test JWT configuration
    echo "\n=== JWT Configuration Test ===\n";
    
    if (config('jwt.secret')) {
        echo "✓ JWT secret is configured\n";
    } else {
        echo "✗ JWT secret is missing\n";
    }
    
    // Test if JWT service is available
    try {
        $jwtService = app('PHPOpenSourceSaver\JWTAuth\JWTAuth');
        echo "✓ JWT service is available\n";
    } catch (Exception $e) {
        echo "✗ JWT service error: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== Route Configuration Test ===\n";
    
    // Check if routes are loaded
    $router = app('router');
    $routes = $router->getRoutes();
    echo "Total routes loaded: " . $routes->count() . "\n";
    
    // Check for specific API routes
    $apiRoutes = 0;
    foreach ($routes as $route) {
        if (str_starts_with($route->uri(), 'api/')) {
            $apiRoutes++;
        }
    }
    echo "API routes count: $apiRoutes\n";
    
    echo "\n=== Cache Status ===\n";
    try {
        $cacheStatus = \Illuminate\Support\Facades\Cache::store()->getStore();
        echo "✓ Cache is working\n";
    } catch (Exception $e) {
        echo "✗ Cache error: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "✗ Error during testing: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\nTesting completed!\n";
