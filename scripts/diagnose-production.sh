#!/bin/bash
set -e

echo "🔍 Production Backend Diagnostics"
echo "================================="

# Configuration
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
LOG_PATH="/var/log/campaignprox"

echo "📁 Checking file structure..."
cd $BACKEND_PATH
ls -la

echo ""
echo "🔧 Checking Laravel status..."
if php8.3 artisan --version > /dev/null 2>&1; then
    echo "✅ Laravel is accessible ($(php8.3 artisan --version))"
else
    echo "❌ Laravel artisan command failed"
    echo "Checking PHP versions available:"
    ls -la /usr/bin/php*
fi

echo ""
echo "📋 Checking environment configuration..."
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo "Environment settings:"
    grep -E "^(APP_|DB_|LOG_)" .env | head -10
else
    echo "❌ .env file missing!"
fi

echo ""
echo "🗄️ Checking database..."
if [ -f database/database.sqlite ]; then
    echo "✅ SQLite database exists ($(du -h database/database.sqlite))"
    php8.3 artisan migrate:status 2>/dev/null || echo "❌ Migration status check failed"
else
    echo "❌ SQLite database missing!"
fi

echo ""
echo "📝 Checking Laravel logs..."
if [ -f storage/logs/laravel.log ]; then
    echo "Recent Laravel errors:"
    tail -20 storage/logs/laravel.log | grep -E "(ERROR|CRITICAL|EMERGENCY)" || echo "No recent errors in Laravel log"
else
    echo "❌ Laravel log file missing"
fi

echo ""
echo "🔐 Checking permissions..."
echo "Backend directory owner: $(stat -c '%U:%G' $BACKEND_PATH)"
echo "Storage directory permissions:"
ls -la storage/
echo "Cache directory permissions:"
ls -la bootstrap/cache/ 2>/dev/null || echo "Cache directory missing"

echo ""
echo "🌐 Checking web server..."
if systemctl is-active apache2 > /dev/null 2>&1; then
    echo "✅ Apache is running"
else
    echo "❌ Apache is not running"
fi

echo ""
echo "⚙️ Checking PHP-FPM..."
if systemctl is-active php8.3-fpm > /dev/null 2>&1; then
    echo "✅ PHP8.3-FPM is running"
else
    echo "❌ PHP8.3-FPM is not running"
fi

echo ""
echo "📊 Checking Apache error logs..."
echo "Recent Apache errors for this domain:"
sudo tail -50 /var/log/apache2/error.log | grep -E "(campaignprox|api\.msz-pl\.com)" | tail -10 || echo "No recent Apache errors for this domain"

echo ""
echo "🔄 Checking supervisor workers..."
if [ -f /etc/supervisor/conf.d/laravel-worker.conf ]; then
    echo "✅ Supervisor configuration exists"
    sudo supervisorctl status | grep laravel || echo "No Laravel workers found"
else
    echo "❌ Supervisor configuration missing"
fi

echo ""
echo "🧪 Testing Laravel application..."
cd $BACKEND_PATH
echo "Testing basic artisan commands:"
php8.3 artisan config:cache 2>&1 || echo "Config cache failed"
php8.3 artisan route:cache 2>&1 || echo "Route cache failed"
php8.3 artisan view:cache 2>&1 || echo "View cache failed"

echo ""
echo "🏁 Diagnostic complete!"
