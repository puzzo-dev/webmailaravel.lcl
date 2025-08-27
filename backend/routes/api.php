<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\BounceCredentialController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\DomainController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\PowerMTAController;
use App\Http\Controllers\PublicConfigController;
use App\Http\Controllers\SecurityController;
use App\Http\Controllers\SenderController;
use App\Http\Controllers\SuppressionListController;
use App\Http\Controllers\TrackingController;
use App\Http\Controllers\UserActivityController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SwaggerController;
use Illuminate\Support\Facades\Route;

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

// API Status and Health Check
Route::get('/', function () {
    return response()->json([
        'message' => 'Email Campaign Management System API',
        'version' => '1.0.0',
        'status' => 'active',
        'timestamp' => now()->toISOString(),
        'endpoints' => [
            'auth' => '/api/auth',
            'campaigns' => '/api/campaigns',
            'analytics' => '/api/analytics',
            'documentation' => '/api/documentation'
        ]
    ]);
});

Route::get('/status', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toISOString(),
        'environment' => app()->environment(),
        'version' => '1.0.0'
    ]);
});

// Public routes - Webhooks are now processed via traits during operations
// Route::post('/webhooks/telegram', [TelegramController::class, 'webhook']);

// Test route for debugging
Route::get('/security/test', function () {
    return response()->json(['message' => 'Security routes working']);
});

// Security routes removed - now handled within authenticated middleware section

// Auth routes (public)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('verification.verify');
    Route::post('/email/verification-notification', [AuthController::class, 'resendVerificationEmail'])->middleware(['auth:api'])->name('verification.send');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    
    // Authenticated email verification routes
    Route::middleware('auth:api')->group(function () {
        Route::post('/send-verification', [AuthController::class, 'sendVerification']);
        Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
    });
});

// Public config routes (no authentication required)
Route::get('/config', [PublicConfigController::class, 'getPublicConfig']);

// Public tracking routes (no authentication required)
Route::prefix('tracking')->group(function () {
    Route::get('/open/{emailId}', [TrackingController::class, 'trackOpen']);
    Route::get('/click/{emailId}/{linkId}', [TrackingController::class, 'trackClick']);
    Route::get('/unsubscribe/{emailId}', [TrackingController::class, 'unsubscribe']);
});

// Public billing routes (no authentication required)
Route::get('/plans', [BillingController::class, 'plans']);

// API Documentation routes (public access)
Route::get('/documentation', function () {
    return response()->json([
        'title' => 'Email Campaign Management API',
        'version' => '1.0.0',
        'description' => 'Comprehensive API for managing email campaigns, users, analytics, domains, senders, and more.',
        'base_url' => request()->getSchemeAndHttpHost(),
        'endpoints' => [
            'Authentication' => [
                'POST /api/auth/login' => 'User login',
                'POST /api/auth/register' => 'User registration',
                'POST /api/auth/logout' => 'User logout',
                'POST /api/auth/refresh' => 'Refresh JWT token',
                'POST /api/auth/forgot-password' => 'Request password reset',
                'POST /api/auth/reset-password' => 'Reset password with token',
            ],
            'User Management' => [
                'GET /api/user/profile' => 'Get user profile',
                'PUT /api/user/profile' => 'Update user profile',
                'PUT /api/user/password' => 'Change password',
                'GET /api/user/settings' => 'Get user settings',
            ],
            'Campaigns' => [
                'GET /api/campaigns' => 'List campaigns',
                'POST /api/campaigns' => 'Create campaign',
                'GET /api/campaigns/{id}' => 'Get campaign details',
                'PUT /api/campaigns/{id}' => 'Update campaign',
                'DELETE /api/campaigns/{id}' => 'Delete campaign',
                'POST /api/campaigns/{id}/send' => 'Send campaign',
            ],
            'Analytics' => [
                'GET /api/analytics/dashboard' => 'Get dashboard analytics',
                'GET /api/analytics/campaigns/{id}' => 'Get campaign analytics',
                'GET /api/analytics/performance' => 'Get performance metrics',
            ],
            'Domains' => [
                'GET /api/domains' => 'List domains',
                'POST /api/domains' => 'Add domain',
                'GET /api/domains/{id}' => 'Get domain details',
                'PUT /api/domains/{id}' => 'Update domain',
                'DELETE /api/domains/{id}' => 'Delete domain',
            ],
            'Senders' => [
                'GET /api/senders' => 'List senders',
                'POST /api/senders' => 'Add sender',
                'GET /api/senders/{id}' => 'Get sender details',
                'PUT /api/senders/{id}' => 'Update sender',
                'DELETE /api/senders/{id}' => 'Delete sender',
            ],
            'Billing' => [
                'GET /api/plans' => 'Get available plans (public)',
                'GET /api/billing/subscription' => 'Get user subscription',
                'POST /api/billing/subscribe' => 'Subscribe to plan',
                'GET /api/billing/history' => 'Get payment history',
            ],
            'Tracking' => [
                'GET /api/tracking/open/{emailId}' => 'Track email open (public)',
                'GET /api/tracking/click/{emailId}/{linkId}' => 'Track link click (public)',
                'GET /api/tracking/unsubscribe/{emailId}' => 'Unsubscribe (public)',
            ]
        ],
        'authentication' => [
            'type' => 'Bearer Token (JWT)',
            'header' => 'Authorization: Bearer {token}',
            'note' => 'Most endpoints require authentication. Public endpoints are marked as (public).'
        ]
    ]);
});

// Protected routes (require JWT authentication)
Route::middleware(['auth:api'])->group(function () {
    // Test route to verify authentication
    Route::get('/test-auth', function () {
        return response()->json([
            'success' => true,
            'message' => 'Authentication working',
            'user' => auth()->user(),
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

    // User Activity routes
    Route::prefix('user/activities')->group(function () {
        Route::get('/', [UserActivityController::class, 'index']);
        Route::get('/stats', [UserActivityController::class, 'stats']);
        Route::post('/', [UserActivityController::class, 'store']);
    });

    // Campaign routes (require active subscription)
    Route::prefix('campaigns')->middleware(['subscription'])->group(function () {
        Route::get('/', [CampaignController::class, 'index']);
        Route::post('/', [CampaignController::class, 'store']);
        Route::get('/{campaign}', [CampaignController::class, 'show']);
        Route::get('/{campaign}/attachments/{index}/download', [CampaignController::class, 'downloadAttachment']);
        Route::put('/{campaign}', [CampaignController::class, 'update']);
        Route::delete('/{campaign}', [CampaignController::class, 'destroy']);
        Route::post('/{campaign}/duplicate', [CampaignController::class, 'duplicateCampaign']);
        Route::post('/{campaign}/start', [CampaignController::class, 'startCampaign'])->middleware('training.check');
        Route::post('/{campaign}/pause', [CampaignController::class, 'pauseCampaign']);
        Route::post('/{campaign}/resume', [CampaignController::class, 'resumeCampaign'])->middleware('training.check');
        Route::post('/{campaign}/stop', [CampaignController::class, 'stopCampaign']);
        Route::get('/{campaign}/stats', [CampaignController::class, 'getCampaignStatistics']);
        Route::get('/{campaign}/tracking', [CampaignController::class, 'trackingStats']);
        Route::get('/template-variables', [CampaignController::class, 'getTemplateVariables']);
        Route::get('/{campaign}/template-variables', [CampaignController::class, 'getCampaignTemplateVariables']);
        Route::get('/{campaign}/unsubscribe-list', [CampaignController::class, 'downloadUnsubscribeList']);
        Route::get('/{campaign}/unsubscribe-list/{format}', [CampaignController::class, 'downloadUnsubscribeList']);
        Route::post('/upload-content', [CampaignController::class, 'uploadContent']);
        Route::post('/send-single', [CampaignController::class, 'sendSingle'])->middleware('training.check');

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

    // Bounce credential routes (no subscription required)
    Route::prefix('bounce-credentials')->group(function () {
        Route::get('/', [BounceCredentialController::class, 'index']);
        Route::post('/', [BounceCredentialController::class, 'store']);
        Route::get('/domains', [BounceCredentialController::class, 'domains']);
        Route::get('/statistics', [BounceCredentialController::class, 'statistics']);
        Route::get('/{credential}', [BounceCredentialController::class, 'show']);
        Route::put('/{credential}', [BounceCredentialController::class, 'update']);
        Route::delete('/{credential}', [BounceCredentialController::class, 'destroy']);
        Route::post('/{credential}/test', [BounceCredentialController::class, 'testConnection']);
        Route::post('/{credential}/set-default', [BounceCredentialController::class, 'setAsDefault']);
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

    // Training routes removed - training is now internal/automatic only

    // Billing & Subscription routes (authenticated users only)
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
        Route::get('/invoice/{invoice_id}/view', [BillingController::class, 'viewInvoice']);
        Route::get('/invoice/{invoice_id}/download', [BillingController::class, 'downloadInvoice']);
        Route::get('/payment-history', [BillingController::class, 'paymentHistory']);

        // Webhook for payment processing
        Route::post('/webhook', [BillingController::class, 'webhook']);
    });

    // Public suppression routes (for unsubscribe links, etc.)
    Route::prefix('suppression-list')->group(function () {
        Route::post('/unsubscribe/{emailId}', [SuppressionListController::class, 'unsubscribe']);
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
        Route::delete('/campaigns/{campaign}', [CampaignController::class, 'destroy']);
        Route::post('/campaigns/{campaign}/start', [CampaignController::class, 'startCampaign']);
        Route::post('/campaigns/{campaign}/pause', [CampaignController::class, 'pauseCampaign']);
        Route::post('/campaigns/{campaign}/resume', [CampaignController::class, 'resumeCampaign']);
        Route::post('/campaigns/{campaign}/stop', [CampaignController::class, 'stopCampaign']);
        Route::get('/analytics', [AdminController::class, 'analytics']);
        Route::get('/system-status', [AdminController::class, 'systemStatus']);
        Route::post('/system-config', [AdminController::class, 'updateSystemConfig']);
        Route::get('/system-config', [AdminController::class, 'getSystemConfig']);

        // Granular config endpoints for Telegram, PowerMTA
        Route::get('/system-config/telegram', [AdminController::class, 'getTelegramConfig']);
        Route::post('/system-config/telegram', [AdminController::class, 'updateTelegramConfig']);
        Route::get('/system-config/powermta', [AdminController::class, 'getPowerMTAConfig']);
        Route::post('/system-config/powermta', [AdminController::class, 'updatePowerMTAConfig']);
        
        // Scheduler and queue management
        Route::post('/run-scheduler', [AdminController::class, 'runScheduler']);
        Route::post('/process-queue', [AdminController::class, 'processQueue']);

        // Backup routes (admin only)
        Route::prefix('backups')->group(function () {
            Route::get('/', [BackupController::class, 'index']);
            Route::post('/', [BackupController::class, 'create']);
            Route::get('/statistics', [BackupController::class, 'getStatistics']);
            Route::get('/{backup}', [BackupController::class, 'show']);
            Route::delete('/{backup}', [BackupController::class, 'destroy']);
            Route::get('/{backup}/download', [BackupController::class, 'download']);
            Route::post('/{backup}/restore', [BackupController::class, 'restore']);
        });

        // Admin sender management routes (admin only)
        Route::prefix('senders')->group(function () {
            Route::get('/', [SenderController::class, 'index']);
            Route::post('/', [SenderController::class, 'store']);
            Route::put('/{sender}/admin-update', [SenderController::class, 'updateSender']);
            Route::delete('/{sender}', [SenderController::class, 'destroy']);
            Route::put('/bulk-update', [SenderController::class, 'updateSenders']);
        });

        // Admin domains management routes (admin only)
        Route::prefix('domains')->group(function () {
            Route::get('/', [DomainController::class, 'index']);
            Route::post('/', [DomainController::class, 'store']);
            Route::put('/{domain}', [DomainController::class, 'update']);
            Route::delete('/{domain}', [DomainController::class, 'destroy']);
            Route::patch('/{domain}/status', [DomainController::class, 'updateStatus']);
            Route::post('/{domain}/test', [DomainController::class, 'testDomainConnection']);
        });

        // Admin SMTP configs management routes (admin only)
        Route::prefix('smtp-configs')->group(function () {
            Route::get('/', [DomainController::class, 'getAllSmtpConfigs']);
            Route::get('/{config}', [DomainController::class, 'getSmtpConfigById']);
            Route::post('/', [DomainController::class, 'createSmtpConfig']);
            Route::put('/{config}', [DomainController::class, 'updateSmtpConfigById']);
        });

        // Complete SMTP configs routes
        Route::prefix('smtp-configs')->group(function () {
            Route::delete('/{config}', [DomainController::class, 'deleteSmtpConfig']);
            Route::post('/{config}/test', [DomainController::class, 'testSmtpConfig']);
        });

        // Admin-only suppression list management
        Route::prefix('suppression-list')->group(function () {
            Route::get('/', [SuppressionListController::class, 'index']);
            Route::get('/statistics', [SuppressionListController::class, 'getStatistics']);
            Route::post('/export', [SuppressionListController::class, 'export']);
            Route::get('/download/{filename}', [SuppressionListController::class, 'download']);
            Route::post('/import', [SuppressionListController::class, 'import']);
            Route::post('/process-fbl', [SuppressionListController::class, 'processFBLFile']);
            Route::delete('/remove-email', [SuppressionListController::class, 'removeEmail']);
            Route::post('/cleanup', [SuppressionListController::class, 'cleanup']);
        });

        // Admin notifications management routes (admin only)
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::post('/', [NotificationController::class, 'store']);
            Route::post('/bulk', [NotificationController::class, 'sendBulk']);
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
            Route::get('/files/{filename}/download', [LogController::class, 'download']);
            Route::delete('/files/{filename}', [LogController::class, 'clearLogFile']);
        });

        // Admin queue management routes (admin only)
        Route::prefix('queue')->group(function () {
            Route::get('/stats', [App\Http\Controllers\QueueController::class, 'getQueueStats']);
            Route::get('/pending', [App\Http\Controllers\QueueController::class, 'getPendingJobs']);
            Route::get('/failed', [App\Http\Controllers\QueueController::class, 'getFailedJobs']);
            Route::get('/campaigns/{campaignId}/failed', [App\Http\Controllers\QueueController::class, 'getCampaignFailedJobs']);
            Route::post('/failed/{id}/retry', [App\Http\Controllers\QueueController::class, 'retryFailedJob']);
            Route::delete('/failed/{id}', [App\Http\Controllers\QueueController::class, 'deleteFailedJob']);
            Route::delete('/failed', [App\Http\Controllers\QueueController::class, 'clearAllFailedJobs']);
            Route::delete('/pending/{id}', [App\Http\Controllers\QueueController::class, 'deletePendingJob']);
            Route::delete('/pending', [App\Http\Controllers\QueueController::class, 'clearAllPendingJobs']);
            Route::get('/{type}/{id}', [App\Http\Controllers\QueueController::class, 'getJobDetail']);
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
            Route::post('/process-bounces', [PowerMTAController::class, 'processBounceFiles']);
        });

        // Unified Training admin routes (admin only) - consolidated from PowerMTA and Training controllers
        Route::prefix('training')->group(function () {
            Route::get('/status', [\App\Http\Controllers\TrainingController::class, 'getTrainingStatus']);
            Route::get('/statistics', [\App\Http\Controllers\TrainingController::class, 'getTrainingStatistics']);
            Route::post('/run', [\App\Http\Controllers\TrainingController::class, 'runTraining']);
            Route::post('/run/users/{user}', [\App\Http\Controllers\TrainingController::class, 'runUserTraining']);
            Route::post('/run/domains/{domain}', [\App\Http\Controllers\TrainingController::class, 'runDomainTraining']);

            // Per-user training management (admin only)
            Route::get('/users/{user}/settings', [\App\Http\Controllers\TrainingController::class, 'getAdminTrainingSettings']);
            Route::put('/users/{user}/settings', [\App\Http\Controllers\TrainingController::class, 'updateAdminTrainingSettings']);
            Route::get('/users/{user}/stats', [\App\Http\Controllers\TrainingController::class, 'getAdminTrainingStats']);
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

        // Admin scheduler management routes (admin only)
        Route::prefix('scheduler')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\SchedulerController::class, 'index']);
            Route::post('/run', [\App\Http\Controllers\Admin\SchedulerController::class, 'runScheduler']);
            Route::post('/command', [\App\Http\Controllers\Admin\SchedulerController::class, 'runCommand']);
            Route::get('/queue-status', [\App\Http\Controllers\Admin\SchedulerController::class, 'queueStatus']);
            Route::post('/test', [\App\Http\Controllers\Admin\SchedulerController::class, 'testScheduler']);
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

    // PowerMTA routes removed - use /admin/powermta endpoints (admin access required)

    // Legacy routes for backward compatibility - redirect to new billing endpoints
    Route::prefix('btcpay')->group(function () {
        Route::post('/invoice', [BillingController::class, 'createInvoice']);
        Route::get('/invoice/{invoice_id}', [BillingController::class, 'invoiceStatus']);
        Route::get('/rates', [BillingController::class, 'rates']);
        Route::get('/history', [BillingController::class, 'paymentHistory']);
    });

    // Legacy subscription routes removed - use /billing/subscriptions endpoints instead

    // Analytics routes
    Route::prefix('analytics')->group(function () {
        // Dashboard route (accessible to all authenticated users)
        Route::get('/dashboard', [AnalyticsController::class, 'getDashboard']);

        // Advanced analytics routes (require active subscription)
        Route::middleware(['subscription'])->group(function () {
            Route::get('/', [AnalyticsController::class, 'index']);
            Route::get('/campaigns', [AnalyticsController::class, 'getCampaignAnalytics']);
            Route::get('/users', [AnalyticsController::class, 'getUserAnalytics']);
            Route::get('/revenue', [AnalyticsController::class, 'getRevenueAnalytics']);
            Route::get('/deliverability', [AnalyticsController::class, 'getDeliverabilityAnalytics']);
            Route::get('/reputation', [AnalyticsController::class, 'getReputationAnalytics']);
            Route::get('/trending', [AnalyticsController::class, 'getTrendingMetrics']);
            Route::get('/campaign/{campaign}/performance', [AnalyticsController::class, 'getCampaignPerformanceReport']);
            Route::get('/campaign/{campaign}/hourly', [AnalyticsController::class, 'getCampaignHourlyStats']);
            Route::get('/campaign/{campaign}/daily', [AnalyticsController::class, 'getCampaignDailyStats']);
            Route::get('/campaign/{campaign}/domains', [AnalyticsController::class, 'getCampaignDomainPerformance']);
            Route::get('/campaign/{campaign}/senders', [AnalyticsController::class, 'getCampaignSenderPerformance']);
            Route::get('/export', [AnalyticsController::class, 'export']);
        });
    });

    // Performance monitoring routes (admin only)
    Route::prefix('performance')->middleware(['role:admin'])->group(function () {
        Route::get('/system', [PerformanceController::class, 'getSystemMetrics']);
        Route::get('/operation/{operation}', [PerformanceController::class, 'getOperationMetrics']);
        Route::get('/report', [PerformanceController::class, 'generateReport']);
        Route::post('/metric', [PerformanceController::class, 'recordMetric']);
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
            Route::get('/', [AdminController::class, 'getSystemSettings']);
            Route::put('/', [AdminController::class, 'updateSystemSettings']);
            Route::post('/test-smtp', [AdminController::class, 'testSmtp']);
            Route::get('/env-variables', [AdminController::class, 'getEnvVariables']);
        });

        // Admin Security Settings routes (admin only)
        Route::prefix('security-settings')->group(function () {
            Route::get('/', [SecurityController::class, 'getSecuritySettings']);
            Route::put('/', [SecurityController::class, 'updateSecuritySettings']);
        });
    });
});

// API key functionality available through existing routes with dual authentication
// Use 'Authorization: Bearer {api_key}' or 'X-API-Key: {api_key}' headers on any existing route
