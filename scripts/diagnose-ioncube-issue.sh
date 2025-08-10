#!/bin/bash

# Script to diagnose ionCube Loader issue on production server

echo "🔍 Diagnosing ionCube Loader Issue"
echo "=================================="

# Check PHP configuration
echo "📋 Checking PHP configuration..."
echo "PHP Version:"
php8.3 -v || php -v
echo ""

echo "PHP configuration file (php.ini) locations:"
php8.3 --ini || php --ini
echo ""

echo "🔍 Checking for ionCube extension..."
php8.3 -m | grep -i ioncube || echo "ionCube Loader not found in PHP modules"
echo ""

echo "🔍 Checking .htaccess files that might cause issues..."
find /home/campaignprox/domains/api.msz-pl.com -name ".htaccess" -exec echo "File: {}" \; -exec cat {} \; -exec echo "---" \;
echo ""

echo "🔍 Checking document root configuration..."
echo "Document root should be: /home/campaignprox/domains/api.msz-pl.com/public_html"
echo "Current directory structure:"
ls -la /home/campaignprox/domains/api.msz-pl.com/
echo ""

echo "🔍 Checking Laravel public directory..."
ls -la /home/campaignprox/domains/api.msz-pl.com/public_html/public/ 2>/dev/null || echo "Laravel public directory not found"
echo ""

echo "🔍 Checking if there are any ionCube-encoded files..."
find /home/campaignprox/domains/api.msz-pl.com -name "*.php" -exec grep -l "ionCube" {} \; 2>/dev/null || echo "No ionCube-encoded files found"
echo ""

echo "🔍 Testing direct access to Laravel..."
echo "Checking index.php content:"
head -20 /home/campaignprox/domains/api.msz-pl.com/public_html/public/index.php 2>/dev/null || echo "Laravel index.php not found"
echo ""

echo "🧪 Testing PHP execution..."
php8.3 -r "echo 'PHP is working: ' . PHP_VERSION . PHP_EOL;" || php -r "echo 'PHP is working: ' . PHP_VERSION . PHP_EOL;"
echo ""

echo "🔍 Checking Apache virtual host configuration..."
echo "Looking for Apache config files:"
find /etc/apache2 -name "*api.msz-pl.com*" 2>/dev/null || echo "No specific Apache config found"
echo ""

echo "🔍 Checking for any encoded or obfuscated PHP files..."
file /home/campaignprox/domains/api.msz-pl.com/public_html/*.php 2>/dev/null || echo "No PHP files in document root"
echo ""

echo "🏁 Diagnosis complete!"
echo "If ionCube Loader is required, it needs to be installed."
echo "If not required, there may be an encoded file causing the issue."
