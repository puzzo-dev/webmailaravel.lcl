<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\JWTFromCookie;
use App\Http\Middleware\CheckActiveSubscription;
use App\Http\Middleware\HandleInertiaRequests;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Exclude jwt_token from cookie encryption so the API's
        // JWTFromCookie middleware can read the raw JWT set by
        // the web login flow.
        $middleware->encryptCookies(except: ['jwt_token']);

        // Add JWT from cookie middleware globally for API routes
        $middleware->api(prepend: [
            JWTFromCookie::class,
        ]);

        // Inertia middleware for web routes
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        // Register aliases for route-specific middleware
        $middleware->alias([
            'role' => CheckRole::class,
            'admin' => \App\Http\Middleware\AdminAuthorizationMiddleware::class,
            'subscription' => CheckActiveSubscription::class,
            'training.check' => \App\Http\Middleware\TrainingCheckMiddleware::class,
        ]);

		 $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
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
