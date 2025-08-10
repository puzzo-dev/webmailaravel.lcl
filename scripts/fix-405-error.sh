#!/bin/bash

# Fix 405 Method Not Allowed errors in Laravel production
# This script addresses common causes of 405 errors

set -e

BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
APP_USER="campaignprox"

echo "🔧 Fixing 405 Method Not Allowed Error"
echo "====================================="

# Navigate to backend directory
cd "$BACKEND_PATH"

echo "📋 Step 1: Fixing file permissions..."
sudo chown -R $APP_USER:$APP_USER $BACKEND_PATH
sudo chmod -R 755 $BACKEND_PATH
sudo chmod -R 775 storage bootstrap/cache

echo "🔧 Step 2: Clearing and rebuilding caches..."
php8.3 artisan cache:clear
php8.3 artisan config:clear
php8.3 artisan route:clear
php8.3 artisan view:clear

echo "📝 Step 3: Rebuilding optimized files..."
php8.3 artisan config:cache
php8.3 artisan route:cache

echo "🌐 Step 4: Ensuring .htaccess is correct..."
# Create proper .htaccess in public directory if it doesn't exist
if [ ! -f "public/.htaccess" ]; then
    echo "Creating missing public/.htaccess..."
    sudo tee public/.htaccess > /dev/null <<'EOF'
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
EOF
    sudo chown $APP_USER:$APP_USER public/.htaccess
    sudo chmod 644 public/.htaccess
fi

echo "🔄 Step 5: Restarting services..."
sudo systemctl reload apache2
sudo systemctl restart php8.3-fpm

echo "🧪 Step 6: Testing routes..."
echo "Testing web root:"
curl -s -o /dev/null -w "%{http_code}" http://api.msz-pl.com/ || echo "❌ Web root test failed"

echo ""
echo "Testing API root:"
curl -s -o /dev/null -w "%{http_code}" http://api.msz-pl.com/api/ || echo "❌ API root test failed"

echo ""
echo "Testing API status:"
curl -s -o /dev/null -w "%{http_code}" http://api.msz-pl.com/api/status || echo "❌ API status test failed"

echo ""
echo "✅ 405 error fixes completed!"
echo ""
echo "🎯 Next steps to test:"
echo "1. Visit http://api.msz-pl.com/ (should show Laravel welcome page)"
echo "2. Visit http://api.msz-pl.com/api/ (should show API info JSON)"
echo "3. Visit http://api.msz-pl.com/api/status (should show API status)"
echo ""
echo "If you still get 405 errors, check:"
echo "- The exact URL and HTTP method being used"
echo "- Browser developer tools for the actual request being made"
echo "- Laravel logs in storage/logs/laravel.log"
