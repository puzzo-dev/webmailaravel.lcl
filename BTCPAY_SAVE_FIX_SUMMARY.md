# BTCPay Settings Save Issue - Resolution Summary

## Problem
The BTCPay settings in the admin system settings were not saving properly. Users would update BTCPay configuration (URL, API key, Store ID, webhook secret, currency) but the changes would not persist.

## Root Cause
**Key Mismatch Issue**: The system was using inconsistent database keys for reading and writing BTCPay configuration:

1. **Reading BTCPay settings**: Used lowercase keys (`btcpay_url`, `btcpay_api_key`, etc.)
2. **Saving BTCPay settings**: Used uppercase keys (`BTCPAY_URL`, `BTCPAY_API_KEY`, etc.)

This caused the save operation to write to different database keys than what was being read, making it appear that settings weren't being saved.

## Evidence Found
- Database contained **duplicate BTCPay keys**: both lowercase and uppercase versions
- AdminController `getSystemSettings()` method read from lowercase keys
- AdminController `updateSystemSettings()` method saved to uppercase keys
- Test confirmed settings were being saved but to the wrong keys

## Resolution Applied

### 1. Fixed Key Consistency in AdminController
**File**: `backend/app/Http/Controllers/AdminController.php`

**Changed**: BTCPay settings save logic to use lowercase keys
```php
// OLD (line 444):
$configKey = 'BTCPAY_'.strtoupper($key);

// NEW:
$configKey = 'btcpay_'.$key; // Use lowercase keys to match reading
```

### 2. Updated EnvFileManager Mapping
**File**: `backend/app/Services/EnvFileManager.php`

**Added**: Mapping for lowercase database keys to uppercase environment keys
```php
// BTCPay settings (database keys -> env keys)
'btcpay_url' => 'BTCPAY_URL',
'btcpay_api_key' => 'BTCPAY_API_KEY',
'btcpay_store_id' => 'BTCPAY_STORE_ID',
'btcpay_webhook_secret' => 'BTCPAY_WEBHOOK_SECRET',
'btcpay_currency' => 'BTCPAY_CURRENCY',
```

### 3. Database Cleanup
**Removed**: Duplicate uppercase BTCPay configuration keys from `system_configs` table
```php
SystemConfig::whereIn('key', ['BTCPAY_URL', 'BTCPAY_API_KEY', 'BTCPAY_STORE_ID', 'BTCPAY_WEBHOOK_SECRET', 'BTCPAY_CURRENCY'])->delete();
```

## Verification
✅ **Direct Controller Test**: Successfully updated and verified BTCPay settings save/restore
✅ **Database Consistency**: Only lowercase keys remain in database
✅ **Environment Sync**: Settings properly map to uppercase environment variables
✅ **Cache Cleared**: No caching conflicts

## Impact
- ✅ BTCPay settings now save correctly in admin interface
- ✅ Settings persist between sessions
- ✅ Environment file synchronization works properly
- ✅ No breaking changes to existing functionality

## Files Modified
1. `backend/app/Http/Controllers/AdminController.php` - Fixed BTCPay save logic
2. `backend/app/Services/EnvFileManager.php` - Added lowercase-to-uppercase key mapping

## Database Changes
- Removed duplicate uppercase BTCPay configuration keys
- Maintained existing lowercase keys with current values

The BTCPay settings save functionality is now working correctly.
