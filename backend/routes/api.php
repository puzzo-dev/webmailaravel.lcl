<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SenderController;
use App\Http\Controllers\DomainController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PowerMTAController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\SecurityController;
use App\Http\Controllers\TrackingController;
use App\Http\Controllers\SuppressionListController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SystemSettingsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes - Webhooks are now processed via traits during operations
// Route::post('/webhooks/telegram', [TelegramController::class, 'webhook']);

// Test route for debugging
Route::get('/security/test', function () {
    return response()->json(['message' => 'Security routes working']);
});

// Security routes (temporarily outside auth middleware for testing)
Route::prefix('security')->group(function () {
    Route::get('/sessions', [SecurityController::class, 'getActiveSessions']);
    Route::get('/devices', [SecurityController::class, 'getTrustedDevices']);
});

// Auth routes (public)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
});

// Public tracking routes (no authentication required)
Route::prefix('tracking')->group(function () {
    Route::get('/open/{emailId}', [TrackingController::class, 'trackOpen']);
    Route::get('/click/{emailId}/{linkId}', [TrackingController::class, 'trackClick']);
    Route::get('/unsubscribe/{emailId}', [TrackingController::class, 'unsubscribe']);
});

// Protected routes (require JWT authentication)
Route::middleware(['auth:api'])->group(function () {
    // Test route to verify authentication
    Route::get('/test-auth', function () {
        return response()->json([
            'success' => true,
            'message' => 'Authentication working',
            'user' => auth()->user()
        ]);
    });

    // User profile routes
    Route::prefix('user')->group(function () {
        Route::get('/profile', [UserController::class, 'getProfile']);
        Route::put('/profile', [UserController::class, 'updateProfile']);
        Route::put('/password', [UserController::class, 'changePassword']);
        Route::get('/devices', [UserController::class, 'getDevices']);
        Route::get('/sessions', [UserController::class, 'getSessions']);
        Route::get('/me', [AuthController::class, 'me']);
        
        // User settings routes
        Route::get('/settings', [UserController::class, 'getSettings']);
        Route::put('/settings/general', [UserController::class, 'updateGeneralSettings']);
        Route::put('/settings/notifications', [UserController::class, 'updateNotificationSettings']);
        Route::put('/settings/security', [UserController::class, 'updateSecuritySettings']);
        Route::put('/settings/api', [UserController::class, 'updateApiSettings']);
        Route::put('/settings/telegram', [UserController::class, 'updateTelegramSettings']);
        Route::post('/settings/api/generate-key', [UserController::class, 'generateApiKey']);
        Route::post('/settings/telegram/test', [UserController::class, 'testTelegram']);
    });



    // Campaign routes (require active subscription)
    Route::prefix('campaigns')->middleware(['subscription'])->group(function () {
        Route::get('/', [CampaignController::class, 'index']);
        Route::post('/', [CampaignController::class, 'store']);
        Route::get('/{campaign}', [CampaignController::class, 'show']);
        Route::put('/{campaign}', [CampaignController::class, 'update']);
        Route::delete('/{campaign}', [CampaignController::class, 'destroy']);
        Route::post('/{campaign}/start', [CampaignController::class, 'startCampaign']);
        Route::post('/{campaign}/pause', [CampaignController::class, 'pauseCampaign']);
        Route::post('/{campaign}/resume', [CampaignController::class, 'resumeCampaign']);
        Route::post('/{campaign}/stop', [CampaignController::class, 'stopCampaign']);
        Route::get('/{campaign}/stats', [CampaignController::class, 'getCampaignStatistics']);
        Route::get('/{campaign}/tracking', [CampaignController::class, 'trackingStats']);
        Route::get('/template-variables', [CampaignController::class, 'getTemplateVariables']);
        Route::get('/{campaign}/template-variables', [CampaignController::class, 'getCampaignTemplateVariables']);
        Route::get('/{campaign}/unsubscribe-list', [CampaignController::class, 'downloadUnsubscribeList']);
        Route::get('/{campaign}/unsubscribe-list/{format}', [CampaignController::class, 'downloadUnsubscribeList']);
        Route::post('/upload-content', [CampaignController::class, 'uploadContent']);
        
        // Admin campaign management routes (admin only)
        Route::middleware(['role:admin'])->group(function () {
            Route::put('/{campaign}/admin-update', [CampaignController::class, 'updateCampaign']);
            Route::put('/bulk-update', [CampaignController::class, 'updateCampaigns']);
        });
    });

    // User management routes (admin only)
    Route::prefix('users')->middleware(['role:admin'])->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
        Route::post('/{user}/devices', [UserController::class, 'addDevice']);
        Route::delete('/{user}/devices/{device}', [UserController::class, 'removeDevice']);
        Route::get('/{user}/sessions', [UserController::class, 'sessions']);
        Route::delete('/{user}/sessions/{session}', [UserController::class, 'terminateSession']);
    });

    // Domain routes (no subscription required)
    Route::prefix('domains')->group(function () {
        Route::get('/', [DomainController::class, 'index']);
        Route::post('/', [DomainController::class, 'store']);
        Route::get('/{domain}', [DomainController::class, 'show']);
        Route::put('/{domain}', [DomainController::class, 'update']);
        Route::delete('/{domain}', [DomainController::class, 'destroy']);
        Route::post('/{domain}/smtp', [DomainController::class, 'addSmtpConfig']);
        Route::get('/{domain}/smtp', [DomainController::class, 'getSmtpConfig']);
        Route::delete('/{domain}/smtp', [DomainController::class, 'deleteSmtpConfig']);
        Route::put('/{domain}/bounce-processing', [DomainController::class, 'updateBounceProcessing']);
        Route::post('/{domain}/bounce-processing/test', [DomainController::class, 'testBounceConnection']);
        Route::get('/{domain}/bounce-processing/stats', [DomainController::class, 'getBounceStatistics']);
        Route::post('/{domain}/bounce-processing/process', [DomainController::class, 'processBounces']);
        
        // Admin domain management routes (admin only)
        Route::middleware(['role:admin'])->group(function () {
            Route::put('/{domain}/admin-update', [DomainController::class, 'updateDomain']);
            Route::put('/bulk-update', [DomainController::class, 'updateDomains']);
        });
    });

    // Content routes (require active subscription)
    Route::prefix('contents')->middleware(['subscription'])->group(function () {
        Route::get('/', [ContentController::class, 'index']);
        Route::post('/', [ContentController::class, 'store']);
        Route::get('/{content}', [ContentController::class, 'show']);
        Route::put('/{content}', [ContentController::class, 'update']);
        Route::delete('/{content}', [ContentController::class, 'destroy']);
        Route::post('/{content}/preview', [ContentController::class, 'preview']);
    });



    // Billing & Subscription routes (consolidated)
    Route::prefix('billing')->group(function () {
        // Subscription management
        Route::get('/subscriptions', [BillingController::class, 'index']);
        Route::post('/subscriptions', [BillingController::class, 'store']);
        Route::get('/subscriptions/{subscription}', [BillingController::class, 'show']);
        Route::put('/subscriptions/{subscription}', [BillingController::class, 'update']);
        Route::delete('/subscriptions/{subscription}', [BillingController::class, 'destroy']);
        Route::post('/subscriptions/{subscription}/renew', [BillingController::class, 'renew']);
        
        // Payment & Invoice management
        Route::post('/invoice', [BillingController::class, 'createInvoice']);
        Route::get('/invoice/{invoice_id}/status', [BillingController::class, 'invoiceStatus']);
        Route::get('/payment-history', [BillingController::class, 'paymentHistory']);
        Route::get('/rates', [BillingController::class, 'rates']);
        Route::get('/plans', [BillingController::class, 'plans']);
        
        // Webhook for payment processing
        Route::post('/webhook', [BillingController::class, 'webhook']);
    });

    // Suppression List routes (require active subscription)
    Route::prefix('suppression-list')->middleware(['subscription'])->group(function () {
        Route::get('/statistics', [SuppressionListController::class, 'getStatistics']);
        Route::post('/export', [SuppressionListController::class, 'export']);
        Route::get('/download/{filename}', [SuppressionListController::class, 'download']);
        Route::post('/import', [SuppressionListController::class, 'import']);
        Route::post('/process-fbl', [SuppressionListController::class, 'processFBLFile']);
        Route::delete('/remove-email', [SuppressionListController::class, 'removeEmail']);
        Route::post('/cleanup', [SuppressionListController::class, 'cleanup']);
    });

    // Sender routes (require active subscription)
    Route::prefix('senders')->middleware(['subscription'])->group(function () {
        Route::get('/', [SenderController::class, 'index']);
        Route::post('/', [SenderController::class, 'store']);
        Route::get('/{sender}', [SenderController::class, 'show']);
        Route::put('/{sender}', [SenderController::class, 'update']);
        Route::delete('/{sender}', [SenderController::class, 'destroy']);
        Route::post('/{sender}/test', [SenderController::class, 'testConnection']);
    });

    // Admin routes
    Route::prefix('admin')->middleware(['role:admin'])->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [UserController::class, 'index']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::get('/campaigns', [CampaignController::class, 'index']);
        Route::put('/campaigns/{campaign}/status', [CampaignController::class, 'updateCampaign']);
        Route::get('/analytics', [AdminController::class, 'analytics']);
        Route::get('/system-status', [AdminController::class, 'systemStatus']);
        Route::post('/system-config', [SystemSettingsController::class, 'updateSystemConfig']);
        Route::get('/system-config', [SystemSettingsController::class, 'index']);

        // Granular config endpoints for BTCPay, Telegram, PowerMTA
        Route::get('/system-config/btcpay', [SystemSettingsController::class, 'getBTCPayConfig']);
        Route::post('/system-config/btcpay', [SystemSettingsController::class, 'updateBTCPayConfig']);
        Route::get('/system-config/telegram', [SystemSettingsController::class, 'getTelegramConfig']);
        Route::post('/system-config/telegram', [SystemSettingsController::class, 'updateTelegramConfig']);
        Route::get('/system-config/powermta', [SystemSettingsController::class, 'getPowerMTAConfig']);
        Route::post('/system-config/powermta', [SystemSettingsController::class, 'updatePowerMTAConfig']);

        // Backup routes (admin only)
        Route::prefix('backups')->group(function () {
            Route::get('/', [BackupController::class, 'index']);
            Route::post('/', [BackupController::class, 'create']);
            Route::get('/statistics', [BackupController::class, 'getStatistics']);
            Route::get('/{backup}', [BackupController::class, 'show']);
            Route::delete('/{backup}', [BackupController::class, 'destroy']);
            Route::post('/{backup}/download', [BackupController::class, 'download']);
            Route::post('/{backup}/restore', [BackupController::class, 'restore']);
        });

        // Admin sender management routes (admin only)
        Route::prefix('senders')->group(function () {
            Route::get('/', [SenderController::class, 'index']);
            Route::put('/{sender}/admin-update', [SenderController::class, 'updateSender']);
            Route::put('/bulk-update', [SenderController::class, 'updateSenders']);
        });

        // Admin domains management routes (admin only)
        Route::prefix('domains')->group(function () {
            Route::get('/', [DomainController::class, 'index']);
        });

        // Admin SMTP configs management routes (admin only)
        Route::prefix('smtp-configs')->group(function () {
            Route::get('/', [DomainController::class, 'getAllSmtpConfigs']);
            Route::get('/{config}', [DomainController::class, 'getSmtpConfigById']);
            Route::post('/', [DomainController::class, 'createSmtpConfig']);
            Route::put('/{config}', [DomainController::class, 'updateSmtpConfigById']);
            Route::delete('/{config}', [DomainController::class, 'deleteSmtpConfig']);
            Route::post('/{config}/test', [DomainController::class, 'testSmtpConfig']);
        });

        // Admin notifications management routes (admin only)
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::post('/', [NotificationController::class, 'store']);
            Route::get('/{notification}', [NotificationController::class, 'show']);
            Route::put('/{notification}/read', [NotificationController::class, 'markAsRead']);
            Route::delete('/{notification}', [NotificationController::class, 'destroy']);
        });

        // Admin logs management routes (admin only)
        Route::prefix('logs')->group(function () {
            Route::get('/files', [LogController::class, 'getLogFiles']);
            Route::get('/', [LogController::class, 'index']);
            Route::get('/{log}', [LogController::class, 'show']);
            Route::delete('/{log}', [LogController::class, 'destroy']);
            Route::get('/{filename}/download', [LogController::class, 'download']);
        });

        // Admin PowerMTA management routes (admin only)
        Route::prefix('powermta')->group(function () {
            Route::get('/status', [PowerMTAController::class, 'getStatus']);
            Route::get('/fbl-accounts', [PowerMTAController::class, 'getFBLAccounts']);
            Route::get('/diagnostic-files', [PowerMTAController::class, 'getDiagnosticFiles']);
            Route::post('/parse-diagnostic', [PowerMTAController::class, 'parseDiagnosticFile']);
            Route::post('/analyze-reputation', [PowerMTAController::class, 'analyzeSenderReputation']);
            Route::get('/reputation-summary', [PowerMTAController::class, 'getReputationSummary']);
            Route::get('/diagnostic-files/{filename}/download', [PowerMTAController::class, 'downloadDiagnosticFile']);
        });

        // Admin billing management routes (admin only)
        Route::prefix('billing')->group(function () {
            Route::get('/stats', [BillingController::class, 'getBillingStats']);
            Route::get('/subscriptions', [BillingController::class, 'getAllSubscriptions']);
            Route::post('/plans', [BillingController::class, 'createPlan']);
            Route::put('/plans/{plan}', [BillingController::class, 'updatePlan']);
            Route::delete('/plans/{plan}', [BillingController::class, 'deletePlan']);
            Route::post('/subscriptions/{subscription}/manual-payment', [BillingController::class, 'processManualPayment']);
        });
    });

    // Log routes
    Route::prefix('logs')->group(function () {
        Route::get('/', [LogController::class, 'index']);
        Route::get('/{log}', [LogController::class, 'show']);
        Route::delete('/{log}', [LogController::class, 'destroy']);
        Route::post('/clear', [LogController::class, 'clear']);
    });

    // Notification routes
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/{notification}', [NotificationController::class, 'show']);
        Route::put('/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
        Route::put('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/', [NotificationController::class, 'deleteAll']);
    });

    // PowerMTA routes
    Route::prefix('powermta')->group(function () {
        Route::get('/status', [PowerMTAController::class, 'getStatus']);
        Route::get('/fbl/accounts', [PowerMTAController::class, 'getFBLAccounts']);
        Route::get('/diagnostics/files', [PowerMTAController::class, 'getDiagnosticFiles']);
        Route::post('/diagnostics/parse', [PowerMTAController::class, 'parseDiagnosticFile']);
        Route::post('/reputation/analyze', [PowerMTAController::class, 'analyzeSenderReputation']);
        Route::get('/reputation/summary', [PowerMTAController::class, 'getReputationSummary']);
        Route::get('/config', [PowerMTAController::class, 'getConfiguration']);
        Route::put('/config', [PowerMTAController::class, 'updateConfiguration']);
    });

    // Legacy routes for backward compatibility - redirect to new billing endpoints
    Route::prefix('btcpay')->group(function () {
        Route::post('/invoice', [BillingController::class, 'createInvoice']);
        Route::get('/invoice/{invoice_id}', [BillingController::class, 'invoiceStatus']);
        Route::get('/rates', [BillingController::class, 'rates']);
        Route::get('/history', [BillingController::class, 'paymentHistory']);
    });
    
    // Legacy subscription routes for backward compatibility
    Route::prefix('subscriptions')->group(function () {
        Route::get('/', [BillingController::class, 'index']);
        Route::post('/', [BillingController::class, 'store']);
        Route::get('/{subscription}', [BillingController::class, 'show']);
        Route::put('/{subscription}', [BillingController::class, 'update']);
        Route::delete('/{subscription}', [BillingController::class, 'destroy']);
        Route::post('/{subscription}/renew', [BillingController::class, 'renew']);
    });

    // Analytics routes (require active subscription)
    Route::prefix('analytics')->middleware(['subscription'])->group(function () {
        Route::get('/', [AnalyticsController::class, 'index']);
        Route::get('/dashboard', [AnalyticsController::class, 'getDashboard']);
        Route::get('/campaigns', [AnalyticsController::class, 'getCampaignAnalytics']);
        Route::get('/users', [AnalyticsController::class, 'getUserAnalytics']);
        Route::get('/revenue', [AnalyticsController::class, 'getRevenueAnalytics']);
        Route::get('/deliverability', [AnalyticsController::class, 'getDeliverabilityAnalytics']);
        Route::get('/reputation', [AnalyticsController::class, 'getReputationAnalytics']);
        Route::get('/trending', [AnalyticsController::class, 'getTrendingMetrics']);
        Route::get('/campaign/{campaign}/performance', [AnalyticsController::class, 'getCampaignPerformanceReport']);
        Route::get('/export', [AnalyticsController::class, 'export']);
    });

    // Security routes
    Route::prefix('security')->group(function () {
        Route::get('/settings', [SecurityController::class, 'getSecuritySettings']);
        Route::post('/2fa/enable', [SecurityController::class, 'enable2FA']);
        Route::post('/2fa/verify', [SecurityController::class, 'verify2FA']);
        Route::delete('/2fa/disable', [SecurityController::class, 'disable2FA']);
        Route::get('/api-keys', [SecurityController::class, 'getApiKeys']);
        Route::post('/api-keys', [SecurityController::class, 'createApiKey']);
        Route::delete('/api-keys/{key}', [SecurityController::class, 'revokeApiKey']);
        Route::get('/activity', [SecurityController::class, 'getActivityLog']);
        Route::post('/password/change', [SecurityController::class, 'changePassword']);
        Route::get('/devices', [SecurityController::class, 'getTrustedDevices']);
        Route::post('/devices/{device}/trust', [SecurityController::class, 'trustDevice']);
        Route::get('/sessions', [SecurityController::class, 'getActiveSessions']);
        Route::delete('/sessions/{session}', [SecurityController::class, 'revokeSession']);
    });

    // Admin System Settings routes (admin only)
    Route::prefix('admin')->group(function () {
        Route::prefix('system-settings')->group(function () {
            Route::get('/', [SystemSettingsController::class, 'index']);
            Route::put('/', [SystemSettingsController::class, 'update']);
            Route::post('/test-smtp', [SystemSettingsController::class, 'testSmtp']);
            Route::get('/env-variables', [SystemSettingsController::class, 'getEnvVariables']);
        });

        // Admin Security Settings routes (admin only)
        Route::prefix('security-settings')->group(function () {
            Route::get('/', [SecurityController::class, 'getSecuritySettings']);
            Route::put('/', [SecurityController::class, 'updateSecuritySettings']);
        });
    });
}); 