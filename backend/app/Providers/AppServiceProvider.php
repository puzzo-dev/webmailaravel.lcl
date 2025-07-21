<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\CampaignService;

use App\Services\BTCPayService;
use App\Services\PowerMTAService;

use App\Services\GeoIPService;

use App\Services\SessionService;
use App\Services\BackupService;

use App\Services\AnalyticsService;
use App\Services\SecurityService;
use App\Services\AdminService;
use App\Services\AutomaticTrainingService;
use App\Services\SuppressionListService;
use App\Traits\CacheManagementTrait;
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
        $this->app->singleton(CacheManagementTrait::class);
        $this->app->singleton(ValidationTrait::class);

        // Register core services
        $this->app->singleton(GeoIPService::class);

        $this->app->singleton(PowerMTAService::class);
        $this->app->singleton(BTCPayService::class);

        $this->app->singleton(SessionService::class);
        $this->app->singleton(BackupService::class);

        $this->app->singleton(AnalyticsService::class);
        $this->app->singleton(SecurityService::class);
        $this->app->singleton(AdminService::class);
        $this->app->singleton(AutomaticTrainingService::class);
        $this->app->singleton(SuppressionListService::class);

        // Register CampaignService (no dependencies needed, uses traits)
        $this->app->singleton(CampaignService::class);

        // Register BTCPayService with shared traits
        $this->app->singleton(BTCPayService::class, function ($app) {
            $service = new BTCPayService();
            $service->setCacheService($app->make(CacheManagementTrait::class));
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
        
        // Configure system-wide SMTP for notifications
        $this->configureSystemMail();
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

    /**
     * Configure system-wide SMTP for notifications
     */
    protected function configureSystemMail(): void
    {
        // Configure system SMTP for notifications (not campaigns)
        // This ensures notifications use system-wide SMTP settings
        \App\Services\NotificationMailService::configureSystemMail();
    }
}
