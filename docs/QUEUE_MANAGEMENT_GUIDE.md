# Laravel Queue Management Setup

This project now automatically handles queue processing correctly for both development and production environments.

## How It Works

### Development (APP_ENV=local/testing)
- **Queue Connection**: `sync` (immediate processing)
- **No queue workers needed** - jobs execute immediately when dispatched
- **Perfect for development** - no background processes to manage

### Production (APP_ENV=production)
- **Queue Connection**: `database` (background processing)
- **Requires queue workers** - managed by Supervisor for reliability
- **Automatic restarts** - workers restart if they crash or on server reboot

## Configuration

The queue connection is automatically determined by environment:

```php
// config/queue.php
'default' => env('QUEUE_CONNECTION', env('APP_ENV') === 'production' ? 'database' : 'sync')
```

## Development Setup

**No setup required!** Just code and test:

```bash
# Create campaign - processes immediately
php artisan tinker
>>> $campaign = Campaign::create([...]);
>>> $campaignService->startCampaign($campaign); // Executes immediately
```

## Production Setup

Run the automated setup script **once** on your production server:

```bash
sudo /home/users/codepad/www/webmailaravel.lcl/deployment/setup-production-queues.sh
```

This script:
- ✅ Installs Supervisor (if not present)
- ✅ Configures queue workers as system services
- ✅ Starts workers automatically
- ✅ Sets up automatic restart on crash/reboot
- ✅ Creates proper log files

## Worker Management (Production Only)

```bash
# Check worker status
sudo supervisorctl status laravel-worker-*

# Restart workers (after code deployment)
sudo supervisorctl restart laravel-worker-*

# View logs
tail -f /var/log/laravel-campaigns-worker.log
tail -f /var/log/laravel-emails-worker.log
```

## Queue Architecture

- **campaigns** queue: Processes `ProcessCampaignJob` (1 worker)
- **emails** queue: Processes `SendEmailJob` (3 workers for parallel processing)
- **default** queue: Processes other background jobs (1 worker)

## Environment Examples

### Development (.env)
```
APP_ENV=local
# QUEUE_CONNECTION automatically set to 'sync'
```

### Production (.env)
```
APP_ENV=production
# QUEUE_CONNECTION automatically set to 'database'
```

## Benefits

✅ **No manual queue management** in development  
✅ **Automatic worker management** in production  
✅ **Environment-appropriate processing**  
✅ **Zero configuration** for developers  
✅ **Robust production setup** with auto-restart  
✅ **No more manual `php artisan queue:work` commands**

## Migration from Manual Setup

If you were running manual queue workers, stop them:

```bash
# Kill manual workers
pkill -f "artisan queue:work"

# Set up automatic production workers
sudo /home/users/codepad/www/webmailaravel.lcl/deployment/setup-production-queues.sh
```
