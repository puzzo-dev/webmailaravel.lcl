#!/bin/bash

# Production CORS Fix Script
# This script fixes CORS issues by ensuring the correct environment configuration is active

set -e

echo "🔧 Production CORS Configuration Fix"
echo "====================================="

# Define paths
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
BACKUP_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html/backups"

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo "❌ Error: Not in Laravel backend directory"
    echo "Please run this script from: $BACKEND_PATH"
    exit 1
fi

echo "📍 Current directory: $(pwd)"

# Backup current .env file
echo "💾 Creating backup of current .env file..."
if [ -f ".env" ]; then
    cp ".env" "${BACKUP_PATH}/.env.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backup created in $BACKUP_PATH"
fi

# Use production environment
if [ -f ".env.production" ]; then
    echo "🔄 Copying .env.production to .env..."
    cp ".env.production" ".env"
    echo "✅ Production environment activated"
else
    echo "❌ Error: .env.production file not found"
    exit 1
fi

# Verify the environment configuration
echo ""
echo "🔍 Verifying environment configuration..."
echo "APP_ENV: $(grep '^APP_ENV=' .env || echo 'NOT SET')"
echo "APP_URL: $(grep '^APP_URL=' .env || echo 'NOT SET')"
echo "APP_FRONTEND_URL: $(grep '^APP_FRONTEND_URL=' .env || echo 'NOT SET')"
echo "FRONTEND_URL: $(grep '^FRONTEND_URL=' .env || echo 'NOT SET')"
echo "CORS_ALLOWED_ORIGINS: $(grep '^CORS_ALLOWED_ORIGINS=' .env || echo 'NOT SET')"

# Clear configuration cache
echo ""
echo "🗑️  Clearing Laravel configuration cache..."
php artisan config:clear
php artisan config:cache
echo "✅ Configuration cache cleared and rebuilt"

# Clear route cache
echo "🗑️  Clearing route cache..."
php artisan route:clear
php artisan route:cache
echo "✅ Route cache cleared and rebuilt"

# Clear view cache
echo "🗑️  Clearing view cache..."
php artisan view:clear
php artisan view:cache
echo "✅ View cache cleared and rebuilt"

# Test configuration
echo ""
echo "🧪 Testing configuration..."
php artisan tinker --execute="
echo 'APP_ENV: ' . config('app.env') . PHP_EOL;
echo 'APP_URL: ' . config('app.url') . PHP_EOL;
echo 'Frontend URL: ' . config('app.frontend_url') . PHP_EOL;
echo 'CORS Origins: ' . env('CORS_ALLOWED_ORIGINS', 'NOT SET') . PHP_EOL;
"

echo ""
echo "✅ CORS configuration fix completed!"
echo ""
echo "📋 Next steps:"
echo "1. Test the frontend application to verify CORS is working"
echo "2. Check browser console for any remaining CORS errors"
echo "3. If issues persist, restart the web server: sudo systemctl reload apache2"
echo ""
echo "🔗 Test URLs:"
echo "- Frontend: https://campaignprox.msz-pl.com"
echo "- Backend API: https://api.msz-pl.com/api/user/me"
