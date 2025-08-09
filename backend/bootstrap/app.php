<?php

use App\Http\Middleware\AdminAuthorizationMiddleware;
use App\Http\Middleware\ApiKeyAuth;
use App\Http\Middleware\CheckActiveSubscription;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\JWTFromCookie;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Add JWT from cookie middleware globally for API routes
        $middleware->api(prepend: [
            JWTFromCookie::class,
        ]);

        // Register aliases for route-specific middleware
        $middleware->alias([
            'role' => CheckRole::class,
            'subscription' => CheckActiveSubscription::class,
            'training.check' => \App\Http\Middleware\TrainingCheckMiddleware::class,
            'api.key' => ApiKeyAuth::class,
            'admin' => AdminAuthorizationMiddleware::class,
        ]);

        // CORS middleware is already included by default in Laravel 11
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => $e->getMessage(),
                ], 401);
            }
        });
    })->create();
