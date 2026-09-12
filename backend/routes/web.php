<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\WebAuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\SenderController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SuppressionListController;
use App\Http\Controllers\BounceCredentialController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\PowerMTAController;
use App\Http\Controllers\SystemSettingsController;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned the the "web" middleware group. Make something great!
|
*/

// API root — keep for backward compatibility with API clients.
Route::get('/', [HomeController::class, 'index'])->name('home');

// Inertia auth pages (session-based)
Route::middleware('guest')->group(function () {
    Route::get('/login', [WebAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [WebAuthController::class, 'login'])->name('login.submit');
    Route::get('/register', [WebAuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [WebAuthController::class, 'register'])->name('register.submit');
});

Route::middleware('auth:web')->group(function () {
    // Auth
    Route::post('/logout', [WebAuthController::class, 'logout'])->name('logout');

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Campaigns (Inertia pages — read-only views that fetch from API)
    Route::get('/campaigns', function () {
        $user = auth()->user();
        $query = $user->role === 'admin'
            ? \App\Models\Campaign::query()
            : \App\Models\Campaign::where('user_id', $user->id);
        $campaigns = $query->orderBy('created_at', 'desc')->paginate(15);
        return Inertia::render('Campaigns/Index', ['campaigns' => $campaigns]);
    })->name('campaigns.index');

    Route::get('/campaigns/new', function () {
        return Inertia::render('Campaigns/Create');
    })->name('campaigns.create');

    Route::get('/campaigns/{id}', function ($id) {
        $user = auth()->user();
        $campaign = \App\Models\Campaign::findOrFail($id);
        if ($campaign->user_id !== $user->id && $user->role !== 'admin') {
            abort(403);
        }
        return Inertia::render('Campaigns/Show', ['campaign' => $campaign]);
    })->name('campaigns.show');

    // Simple Inertia pages (data loaded via API on the client side)
    Route::inertia('/senders', 'Senders/Index')->name('senders.index');
    Route::inertia('/contents', 'Contents/Index')->name('contents.index');
    Route::inertia('/analytics', 'Analytics/Index')->name('analytics.index');
    Route::inertia('/billing', 'Billing/Index')->name('billing.index');
    Route::inertia('/account', 'Account/Index')->name('account.index');
    Route::inertia('/suppression-list', 'SuppressionList/Index')->name('suppression-list.index');
    Route::inertia('/bounce-credentials', 'BounceCredentials/Index')->name('bounce-credentials.index');

    // Admin routes (admin role required)
    Route::middleware(['admin'])->group(function () {
        Route::inertia('/admin', 'Admin/Index/Index')->name('admin.dashboard');
        Route::inertia('/admin/users', 'Admin/Users/Index')->name('admin.users');
        Route::inertia('/admin/campaigns', 'Admin/Campaigns/Index')->name('admin.campaigns');
        Route::inertia('/admin/senders', 'Admin/Senders/Index')->name('admin.senders');
        Route::inertia('/admin/suppression-list', 'Admin/SuppressionList/Index')->name('admin.suppression-list');
        Route::inertia('/admin/smtp', 'Admin/Smtp/Index')->name('admin.smtp');
        Route::inertia('/admin/system', 'Admin/System/Index')->name('admin.system');
        Route::inertia('/admin/backups', 'Admin/Backups/Index')->name('admin.backups');
        Route::inertia('/admin/logs', 'Admin/Logs/Index')->name('admin.logs');
        Route::inertia('/admin/powermta', 'Admin/PowerMTA/Index')->name('admin.powermta');
        Route::inertia('/admin/notifications', 'Admin/Notifications/Index')->name('admin.notifications');
        Route::inertia('/admin/billing', 'Admin/Billing/Index')->name('admin.billing');
    });
});
