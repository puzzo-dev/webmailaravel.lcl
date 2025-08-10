#!/bin/bash

# Production Issue Fix Script
# Addresses supervisor worker failures, cache table issues, and ownership problems

set -e

BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
APP_USER="campaignprox"

echo "🔧 Fixing Production Issues"
echo "=========================="

echo "🔐 Step 1: Fixing directory ownership..."
# Ensure all files have correct ownership
sudo chown -R $APP_USER:$APP_USER "$BACKEND_PATH"
sudo chmod -R 755 "$BACKEND_PATH"
sudo chmod -R 775 "$BACKEND_PATH/storage" "$BACKEND_PATH/bootstrap/cache" 2>/dev/null || true

# Navigate to backend directory
cd "$BACKEND_PATH"

echo "📋 Step 2: Fixing cache table issue..."
# The cache table should have been created, but let's ensure cache is properly configured
php8.3 artisan cache:clear
php8.3 artisan config:clear
php8.3 artisan route:clear
php8.3 artisan view:clear

# Recreate cache optimizations
php8.3 artisan config:cache
php8.3 artisan route:cache
php8.3 artisan view:cache

echo "🗄️ Step 3: Verifying database tables..."
# Check if cache table exists and create if missing
php8.3 artisan migrate --force

echo "📊 Step 4: Checking supervisor log for worker errors..."
# Check supervisor logs for specific error details
sudo tail -20 /var/log/campaignprox/laravel-worker.log || echo "No supervisor log found yet"

echo "🔧 Step 5: Testing artisan queue:work manually..."
# Test if the queue work command works manually
timeout 5s php8.3 artisan queue:work --stop-when-empty || echo "Queue work test completed"

echo "📋 Step 6: Fixing supervisor configuration..."
# Update supervisor configuration with better error handling
sudo tee /etc/supervisor/conf.d/laravel-worker.conf > /dev/null <<EOF
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php8.3 $BACKEND_PATH/artisan queue:work --sleep=3 --tries=3 --timeout=60 --memory=512
autostart=true
autorestart=true
user=campaignprox
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/campaignprox/laravel-worker.log
stdout_logfile_maxbytes=10MB
stdout_logfile_backups=5
stopwaitsecs=60
stopsignal=QUIT
EOF

echo "🔄 Step 7: Restarting supervisor..."
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl stop laravel-worker:* || true
sleep 2
sudo supervisorctl start laravel-worker:*

echo "📊 Step 8: Final status check..."
sudo supervisorctl status

echo "🧪 Step 9: Testing Laravel application..."
# Test a simple artisan command
php8.3 artisan --version

# Test database connectivity
php8.3 artisan migrate:status

echo "📝 Step 10: Checking recent logs..."
# Check recent Laravel logs
tail -10 storage/logs/laravel.log 2>/dev/null || echo "No recent Laravel logs found"

echo "✅ Production fixes completed!"
echo ""
echo "Next steps if issues persist:"
echo "1. Check supervisor logs: sudo tail -f /var/log/campaignprox/laravel-worker.log"
echo "2. Check Laravel logs: tail -f storage/logs/laravel.log"
echo "3. Test queue manually: php8.3 artisan queue:work --once"
