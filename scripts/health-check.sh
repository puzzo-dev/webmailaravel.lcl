#!/bin/bash
set -e

echo "🔍 Starting health checks..."

# Configuration variables
APP_NAME="campaignprox.msz-pl.com"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com"
FRONTEND_PATH="/home/campaignprox/public_html"

# Check if required environment variables are set
if [ -z "${PROD_SERVER}" ] || [ -z "${PROD_USER}" ] || [ -z "${PROD_PASSWORD}" ]; then
    echo "ERROR: Missing required environment variables: PROD_SERVER, PROD_USER, PROD_PASSWORD"
    exit 1
fi

# SSH command using sshpass
SSH="sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER}"

# Health checks
${SSH} bash -s << EOF
set -e

echo "🔍 Checking backend health..."
cd ${BACKEND_PATH}
if php artisan --version > /dev/null 2>&1; then
    echo "✅ Backend is responding (Laravel version: \$(php artisan --version))"
else
    echo "❌ Backend health check failed"
    exit 1
fi

echo "🔍 Checking frontend health..."
if [ -f "${FRONTEND_PATH}/index.html" ]; then
    echo "✅ Frontend index.html exists"
else
    echo "❌ Frontend health check failed: index.html not found"
    exit 1
fi

echo "🔍 Checking Apache status..."
if systemctl is-active apache2 > /dev/null 2>&1; then
    echo "✅ Apache is running"
else
    echo "❌ Apache is not running"
    exit 1
fi

echo "🔍 Checking PHP-FPM status..."
if systemctl is-active php8.2-fpm > /dev/null 2>&1; then
    echo "✅ PHP-FPM is running"
else
    echo "❌ PHP-FPM is not running"
    exit 1
fi

echo "✅ All health checks passed!"
EOF

echo "✅ Health checks completed!"