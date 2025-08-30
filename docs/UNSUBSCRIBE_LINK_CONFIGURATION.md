# Unsubscribe Link Configuration Fix

## Issue
Unsubscribe links in production campaigns were incorrectly pointing to the backend API URL instead of the frontend URL:
- **Wrong**: `https://api.msz-pl.com/unsubscribe/...`
- **Correct**: `https://campaignprox.msz-pl.com/unsubscribe/...`

## Root Cause
The `APP_FRONTEND_URL` environment variable in the production `.env` file had an incorrect domain format:
- **Wrong**: `campaignprox.msz.pl.com` (with dots)
- **Correct**: `campaignprox.msz-pl.com` (with dash)

## Solution

### 1. Environment Configuration
The unsubscribe link generation uses the `APP_FRONTEND_URL` configuration from `backend/config/app.php`:

```php
'frontend_url' => env('APP_FRONTEND_URL', env('APP_URL', 'http://localhost')),
```

### 2. Production Environment Fix
Updated `backend/.env.production`:

```env
APP_URL=https://api.msz-pl.com
APP_FRONTEND_URL=https://campaignprox.msz-pl.com
FRONTEND_URL=https://campaignprox.msz-pl.com
```

### 3. Code Location
The unsubscribe link is generated in `backend/app/Models/Campaign.php`:

```php
public function getUnsubscribeLink(string $email): string
{
    if (!$this->enable_unsubscribe_link) {
        return '';
    }

    // Generate a unique unsubscribe token
    $token = hash('sha256', $email . $this->id . config('app.key'));
    
    // Return frontend URL instead of direct API call for better UX
    $frontendUrl = config('app.frontend_url', config('app.url'));
    return $frontendUrl . '/unsubscribe/' . $token;
}
```

## Deployment Steps

### 1. Update Environment Variables
Ensure the production `.env` file has the correct `APP_FRONTEND_URL`:

```bash
APP_FRONTEND_URL=https://campaignprox.msz-pl.com
```

### 2. Clear Configuration Cache
After updating environment variables, clear Laravel's configuration cache:

```bash
php artisan config:cache
```

### 3. Restart Services
Restart queue workers to pick up the new configuration:

```bash
./scripts/restart-queue-workers.sh
```

## Verification

### 1. Check Configuration
Verify the configuration is loaded correctly:

```bash
php artisan tinker
> config('app.frontend_url')
```

Should return: `"https://campaignprox.msz-pl.com"`

### 2. Test Unsubscribe Link Generation
Create a test campaign and verify the unsubscribe link format:

```bash
php artisan tinker
> $campaign = App\Models\Campaign::first();
> $campaign->getUnsubscribeLink('test@example.com')
```

Should return: `"https://campaignprox.msz-pl.com/unsubscribe/[token]"`

## Future Prevention

### 1. Environment Template Update
Updated `.env.example` to include `APP_FRONTEND_URL` configuration for future deployments.

### 2. Verification Script
The `scripts/verify-jwt-config.sh` script checks for `FRONTEND_URL` configuration.

## Related Files
- `backend/app/Models/Campaign.php` - Unsubscribe link generation
- `backend/config/app.php` - Frontend URL configuration
- `backend/.env.production` - Production environment variables
- `backend/.env.example` - Environment template
- `scripts/verify-jwt-config.sh` - Configuration verification

## Notes
- Both `APP_FRONTEND_URL` and `FRONTEND_URL` are set for compatibility with different parts of the system
- The configuration fallback chain: `APP_FRONTEND_URL` → `APP_URL` → `http://localhost`
- Unsubscribe links use SHA256 tokens for security
- Changes require configuration cache clearing to take effect
