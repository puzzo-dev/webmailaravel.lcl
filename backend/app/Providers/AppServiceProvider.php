<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\CampaignService;
use App\Services\FileUploadService;
use App\Services\BTCPayService;
use App\Services\BillingService;
use App\Services\PowerMTAService;
use App\Services\TelegramService;
use App\Services\GeoIPService;
use App\Services\DeviceService;
use App\Services\SessionService;
use App\Services\BackupService;
use App\Services\RateLimitService;
use App\Services\AnalyticsService;
use App\Services\SecurityService;
use App\Services\AdminService;
use App\Services\TrainingService;
use App\Traits\HttpClientTrait;
use App\Traits\CacheServiceTrait;
use App\Traits\LoggingTrait;
use App\Traits\ValidationTrait;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register shared traits
        $this->app->singleton(HttpClientTrait::class);
        $this->app->singleton(CacheServiceTrait::class);
        $this->app->singleton(LoggingTrait::class);
        $this->app->singleton(ValidationTrait::class);

        // Register core services
        $this->app->singleton(FileUploadService::class);
        $this->app->singleton(GeoIPService::class);
        $this->app->singleton(TelegramService::class);
        $this->app->singleton(PowerMTAService::class);
        $this->app->singleton(BTCPayService::class);
        $this->app->singleton(BillingService::class);
        $this->app->singleton(DeviceService::class);
        $this->app->singleton(SessionService::class);
        $this->app->singleton(BackupService::class);
        $this->app->singleton(RateLimitService::class);
        $this->app->singleton(AnalyticsService::class);
        $this->app->singleton(SecurityService::class);
        $this->app->singleton(AdminService::class);
        $this->app->singleton(TrainingService::class);

        // Register CampaignService with FileUploadService dependency
        $this->app->singleton(CampaignService::class, function ($app) {
            return new CampaignService($app->make(FileUploadService::class));
        });

        // Register BTCPayService with shared traits
        $this->app->singleton(BTCPayService::class, function ($app) {
            $service = new BTCPayService();
            $service->setHttpClient($app->make(HttpClientTrait::class));
            $service->setCacheService($app->make(CacheServiceTrait::class));
            $service->setLoggingService($app->make(LoggingTrait::class));
            return $service;
        });

        // Register BillingService with shared traits
        $this->app->singleton(BillingService::class, function ($app) {
            $service = new BillingService();
            $service->setHttpClient($app->make(HttpClientTrait::class));
            $service->setCacheService($app->make(CacheServiceTrait::class));
            $service->setLoggingService($app->make(LoggingTrait::class));
            return $service;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configure notification channels
        $this->configureNotificationChannels();
    }

    /**
     * Configure notification channels
     */
    protected function configureNotificationChannels(): void
    {
        // Laravel's built-in notification system handles all notification channels
        // No additional configuration needed for basic channels (mail, database, broadcast)
        
        // For Telegram notifications, we'll use Laravel's notification system
        // with custom Telegram channel implementation
    }
}
