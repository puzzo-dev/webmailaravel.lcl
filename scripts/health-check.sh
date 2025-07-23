#!/bin/bash
set -e

echo "🔍 Running post-deployment health checks..."

# Wait for services to stabilize
echo "⏳ Waiting for services to stabilize..."
sleep 10

# Health check script
sshpass -p "${PROD_PASSWORD}" ssh -o StrictHostKeyChecking=no \
    ${PROD_USER}@${PROD_SERVER} << 'EOF'
set -e

echo "🏥 Running comprehensive health checks..."

# Initialize check results
HEALTH_STATUS=0

# Function to report check status
check_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ $1"
        HEALTH_STATUS=1
    fi
}

# Check if backend is responding
echo "📋 Checking Laravel application..."
cd ${BACKEND_PATH}
php artisan --version > /dev/null 2>&1
check_status "Laravel application is responding"

# Check database connection
echo "📋 Checking database connection..."
php artisan migrate:status > /dev/null 2>&1
check_status "Database connection successful"

# Check if essential Laravel commands work
echo "📋 Checking Laravel configuration..."
php artisan config:show app.name > /dev/null 2>&1
check_status "Laravel configuration is accessible"

# Check if frontend files are accessible
echo "📋 Checking frontend files..."
if [ -f "${FRONTEND_PATH}/index.html" ]; then
    check_status "Frontend files are accessible"
else
    echo "❌ Frontend files not found"
    HEALTH_STATUS=1
fi

# Check API endpoint
echo "📋 Checking API endpoint..."
if command -v curl > /dev/null 2>&1; then
    if curl -s -o /dev/null -w "%{http_code}" http://api.yourdomain.com | grep -q "200\|301\|302"; then
        check_status "API endpoint is responding"
    else
        echo "❌ API endpoint is not responding"
        HEALTH_STATUS=1
    fi
else
    echo "⚠️ curl not available, skipping API test"
fi

# Check key services
echo "📋 Checking web server..."
if sudo systemctl is-active apache2 >/dev/null 2>&1; then
    check_status "Web server is running"
else
    echo "❌ Web server is not running"
    HEALTH_STATUS=1
fi

# Check PHP-FPM
echo "📋 Checking PHP-FPM..."
if sudo systemctl is-active php8.2-fpm >/dev/null 2>&1; then
    check_status "PHP-FPM is running"
else
    echo "❌ PHP-FPM is not running"
    HEALTH_STATUS=1
fi

# Check storage permissions
echo "📋 Checking storage permissions..."
if [ -w "${BACKEND_PATH}/storage/logs" ]; then
    check_status "Storage directory is writable"
else
    echo "❌ Storage directory is not writable"
    HEALTH_STATUS=1
fi

# Check disk space
echo "📋 Checking disk space..."
DISK_USAGE=$(df ${BACKEND_PATH} | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    check_status "Disk space is adequate ($DISK_USAGE% used)"
else
    echo "⚠️ Disk space is getting low ($DISK_USAGE% used)"
fi

# Final health status
echo ""
echo "🏥 Health Check Summary:"
if [ $HEALTH_STATUS -eq 0 ]; then
    echo "✅ All critical health checks passed!"
    echo "🚀 Application is ready for production traffic"
else
    echo "❌ Some health checks failed!"
    echo "⚠️ Please review the issues above before directing traffic to this deployment"
    exit 1
fi

# Display deployment info
echo ""
echo "📊 Deployment Information:"
echo "🏷️ Release: ${RELEASE_NAME}"
echo "📅 Deployed: $(date)"
echo "🏠 Backend Path: ${BACKEND_PATH}"
echo "🎨 Frontend Path: ${FRONTEND_PATH}"

echo ""
echo "🎉 Health checks completed successfully!"

EOF

echo "✅ Health check script completed!"