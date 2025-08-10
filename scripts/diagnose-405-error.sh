#!/bin/bash

# Production API Diagnostics for 405 Method Not Allowed Error
# This script helps diagnose Laravel routing and CORS issues

set -e

BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
APP_USER="campaignprox"

echo "🔍 Diagnosing 405 Method Not Allowed Error"
echo "=========================================="

echo "📂 Step 1: Checking file structure..."
cd "$BACKEND_PATH"

echo "✓ Current directory: $(pwd)"
echo "✓ Files in root:"
ls -la | head -10

echo ""
echo "✓ Files in public directory:"
ls -la public/ | head -10

echo ""
echo "📋 Step 2: Checking .htaccess files..."
echo "✓ Root .htaccess:"
if [ -f ".htaccess" ]; then
    cat .htaccess
else
    echo "❌ No .htaccess in root"
fi

echo ""
echo "✓ Public .htaccess:"
if [ -f "public/.htaccess" ]; then
    cat public/.htaccess
else
    echo "❌ No .htaccess in public/"
fi

echo ""
echo "🔧 Step 3: Checking Laravel configuration..."
echo "✓ Environment check:"
php8.3 artisan --version

echo ""
echo "✓ Route list (first 20 routes):"
php8.3 artisan route:list | head -20

echo ""
echo "✓ Config cache status:"
php8.3 artisan config:cache
php8.3 artisan route:cache

echo ""
echo "🌐 Step 4: Testing HTTP methods..."
echo "✓ Testing GET request to root:"
curl -I http://api.msz-pl.com/ 2>/dev/null || echo "❌ Curl failed"

echo ""
echo "✓ Testing GET request to /api:"
curl -I http://api.msz-pl.com/api 2>/dev/null || echo "❌ Curl failed"

echo ""
echo "✓ Testing GET request to public index:"
curl -I http://api.msz-pl.com/public/ 2>/dev/null || echo "❌ Curl failed"

echo ""
echo "📝 Step 5: Checking Laravel logs..."
echo "✓ Recent Laravel errors:"
tail -20 storage/logs/laravel.log 2>/dev/null || echo "No recent Laravel logs"

echo ""
echo "✓ Apache error logs:"
sudo tail -10 /var/log/apache2/error.log 2>/dev/null || echo "No Apache error logs accessible"

echo ""
echo "🔧 Step 6: Fixing common 405 issues..."

# Ensure CORS middleware is properly configured
echo "✓ Checking CORS configuration..."
if [ -f "config/cors.php" ]; then
    echo "CORS config exists"
else
    echo "❌ CORS config missing"
fi

# Clear all caches
echo "✓ Clearing all caches..."
php8.3 artisan cache:clear
php8.3 artisan config:clear
php8.3 artisan route:clear
php8.3 artisan view:clear

echo "✓ Regenerating optimized files..."
php8.3 artisan config:cache
php8.3 artisan route:cache

echo ""
echo "🎯 Diagnosis completed!"
echo "If you're still getting 405 errors, check:"
echo "1. API routes are defined in routes/api.php"
echo "2. CORS middleware is configured properly"
echo "3. The correct HTTP method is being used"
echo "4. Route parameters are correct"
