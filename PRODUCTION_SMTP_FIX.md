# Production SMTP Configuration Fix

## Problem
Production was using `127.0.0.1:2525` for all emails instead of the proper system SMTP settings from the database.

## Solution Architecture

### 1. Campaign Emails (Domain-Specific SMTP)
- ✅ **Already working correctly**
- Uses domain-specific SMTP settings via `SendEmailJob::configureMailForSender()`
- Each domain has its own SMTP configuration in `smtp_configs` table

### 2. System Notifications & Queue Jobs (System SMTP)
- ✅ **Now fixed with automatic sync**
- Uses system SMTP settings from `system_configs` table
- Automatically syncs to `.env` file when settings are updated

## Key Components

### System Configuration Model
- `SystemConfig::syncToEnvFile()` - Syncs database settings to `.env` file
- Called automatically when system settings are updated via frontend

### Notification Mail Service
- `NotificationMailService::configureSystemMail()` - Loads system SMTP from database
- Called during application bootstrap in `AppServiceProvider`

### Artisan Commands
- `php artisan config:sync-system` - Manual sync and test
- `php artisan test:notification-email {email}` - Test notification system

## Production Deployment Steps

1. **Deploy the updated code** with the new sync functionality
2. **Set proper system SMTP settings** via frontend (System Settings)
3. **Run sync command** to ensure `.env` is updated:
   ```bash
   php artisan config:sync-system
   ```
4. **Restart queue workers** to pick up new configuration:
   ```bash
   php artisan queue:restart
   ```
5. **Test notifications** to verify they use system SMTP:
   ```bash
   php artisan test:notification-email admin@example.com
   ```

## Configuration Priority

1. **Campaign Emails**: Domain SMTP settings (from `smtp_configs` table)
2. **System Notifications**: System SMTP settings (from `system_configs` table → synced to `.env`)
3. **Fallback**: Default `.env` values

## Files Modified

- ✅ `SystemConfig.php` - Added `syncToEnvFile()` method
- ✅ `SystemSettingsController.php` - Auto-sync on settings update
- ✅ `NotificationMailService.php` - Improved system SMTP loading
- ✅ `AppServiceProvider.php` - Bootstrap system mail config
- ✅ Added console commands for testing and manual sync
- ✅ Removed redundant empty files (`MailConfigService.php`, `MailConfigServiceProvider.php`)

## Production Fix Verification

The system now ensures:
- ✅ All Laravel notifications use system SMTP from database
- ✅ All queued jobs use system SMTP from database  
- ✅ Campaign emails use domain-specific SMTP as intended
- ✅ Settings sync automatically when updated via frontend
- ✅ Production will no longer use `127.0.0.1:2525`
