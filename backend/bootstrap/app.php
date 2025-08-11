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
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule) {
        // Billing & Subscription Management
        $schedule->command('billing:send-renewal-reminders')
                 ->dailyAt('09:00')
                 ->withoutOverlapping()
                 ->runInBackground();

        // Email Processing & Bounces
        $schedule->job(new \App\Jobs\ProcessBouncesJob())
                 ->everyThirtyMinutes()
                 ->name('process-bounces');

        $schedule->command('app:process-fblfile')
                 ->hourly()
                 ->withoutOverlapping()
                 ->runInBackground();

        // PowerMTA File Processing
        $schedule->call(function () {
            $bounceService = app(\App\Services\BounceProcessingService::class);
            $results = $bounceService->processPowerMTAFiles();
            \Illuminate\Support\Facades\Log::info('Scheduled PowerMTA processing completed', $results);
        })->hourly()->name('powermta-bounce-processing');

        // Domain & Reputation Monitoring
        $schedule->command('app:monitor-domains')
                 ->everyThirtyMinutes()
                 ->withoutOverlapping()
                 ->runInBackground();

        $schedule->command('app:analyze-reputation-command')
                 ->hourly()
                 ->withoutOverlapping()
                 ->runInBackground();

        // Training System (unified)
        $schedule->command('training:run automatic')
                 ->dailyAt('02:00')
                 ->name('automatic-training');

        $schedule->command('training:run system')
                 ->dailyAt('03:00')
                 ->when(function () {
                     return now()->diffInDays(now()->startOfWeek()->addDay()) % 2 === 0;
                 })
                 ->name('system-manual-training');

        // System Maintenance
        $schedule->command('queue:restart')->hourly();
        $schedule->command('queue:flush')->weekly();
        $schedule->command('model:prune')->daily()->runInBackground();
    })
    ->withMiddleware(function (Middleware $middleware): void {
        // Add trusted proxies middleware globally to handle Cloudflare
        $middleware->web(prepend: [
            \App\Http\Middleware\TrustedProxies::class,
        ]);
        
        $middleware->api(prepend: [
            \App\Http\Middleware\TrustedProxies::class,
        ]);
        
        // Add JWT from cookie middleware globally for API routes
        $middleware->api(append: [
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
