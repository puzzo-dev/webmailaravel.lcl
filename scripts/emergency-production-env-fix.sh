#!/bin/bash

# Emergency Production Environment Fix Script
# This script fixes the Jenkins deployment issue by ensuring production environment is active

set -e

echo "🚨 Emergency Production Environment Fix"
echo "======================================="

# Define paths
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"

# Check if we're running from the correct directory
if [ ! -f "artisan" ]; then
    echo "❌ Error: Not in Laravel backend directory"
    echo "Expected path: $BACKEND_PATH"
    echo "Current path: $(pwd)"
    echo ""
    echo "Please run this script from the backend directory:"
    echo "cd $BACKEND_PATH && /path/to/this/script"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo "🔍 Checking current environment configuration..."

# Show current environment
if [ -f ".env" ]; then
    echo ""
    echo "Current .env configuration:"
    echo "APP_ENV: $(grep '^APP_ENV=' .env 2>/dev/null || echo 'NOT SET')"
    echo "APP_URL: $(grep '^APP_URL=' .env 2>/dev/null || echo 'NOT SET')"
    echo "APP_FRONTEND_URL: $(grep '^APP_FRONTEND_URL=' .env 2>/dev/null || echo 'NOT SET')"
    echo "CORS_ALLOWED_ORIGINS: $(grep '^CORS_ALLOWED_ORIGINS=' .env 2>/dev/null || echo 'NOT SET')"
else
    echo "❌ No .env file found!"
fi

# Check if production environment file exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found!"
    echo "This file is required for production deployment."
    exit 1
fi

echo ""
echo "✅ Found .env.production file"

# Create backup of current .env if it exists
if [ -f ".env" ]; then
    BACKUP_NAME=".env.backup.$(date +%Y%m%d_%H%M%S)"
    cp ".env" "$BACKUP_NAME"
    echo "💾 Backed up current .env to: $BACKUP_NAME"
fi

# Copy production environment
echo "🔄 Copying .env.production to .env..."
cp ".env.production" ".env"

# Verify the copy worked
if [ ! -f ".env" ]; then
    echo "❌ Error: Failed to copy .env.production to .env"
    exit 1
fi

echo "✅ Production environment file copied successfully"

# Validate critical settings
echo ""
echo "🔍 Validating production configuration..."

# Check APP_ENV
if grep -q "^APP_ENV=production" .env; then
    echo "✅ APP_ENV is set to production"
else
    echo "❌ ERROR: APP_ENV is not set to production"
    echo "Current value: $(grep '^APP_ENV=' .env || echo 'NOT SET')"
    exit 1
fi

# Check CORS configuration
if grep -q "^CORS_ALLOWED_ORIGINS=" .env; then
    echo "✅ CORS_ALLOWED_ORIGINS is configured"
    echo "Value: $(grep '^CORS_ALLOWED_ORIGINS=' .env)"
else
    echo "⚠️ WARNING: CORS_ALLOWED_ORIGINS not found, adding it..."
    echo "CORS_ALLOWED_ORIGINS=https://campaignprox.msz-pl.com" >> .env
    echo "✅ Added CORS_ALLOWED_ORIGINS"
fi

# Check frontend URL
if grep -q "^APP_FRONTEND_URL=" .env; then
    echo "✅ APP_FRONTEND_URL is configured"
    echo "Value: $(grep '^APP_FRONTEND_URL=' .env)"
else
    echo "❌ ERROR: APP_FRONTEND_URL not found"
fi

# Clear Laravel caches
echo ""
echo "🗑️ Clearing Laravel caches..."

echo "Clearing configuration cache..."
php artisan config:clear
php artisan config:cache

echo "Clearing route cache..."
php artisan route:clear
php artisan route:cache

echo "Clearing view cache..."
php artisan view:clear
php artisan view:cache

echo "✅ All caches cleared and rebuilt"

# Test the configuration
echo ""
echo "🧪 Testing configuration..."
php artisan tinker --execute="
echo 'Environment: ' . config('app.env') . PHP_EOL;
echo 'App URL: ' . config('app.url') . PHP_EOL;
echo 'Frontend URL: ' . config('app.frontend_url') . PHP_EOL;
echo 'CORS Origins: ' . env('CORS_ALLOWED_ORIGINS', 'NOT SET') . PHP_EOL;
"

echo ""
echo "✅ Emergency fix completed successfully!"
echo ""
echo "📋 Summary of changes:"
echo "- ✅ Copied .env.production to .env"
echo "- ✅ Verified production configuration"
echo "- ✅ Ensured CORS is properly configured"
echo "- ✅ Cleared and rebuilt all Laravel caches"
echo ""
echo "🔗 You can now test the frontend at: https://campaignprox.msz-pl.com"
echo ""
echo "💡 To prevent this issue in future deployments:"
echo "1. Ensure Jenkins deployment script is using the updated version"
echo "2. Verify .env.production file is committed to the repository"
echo "3. Monitor deployment logs to ensure environment copying works"
