#!/bin/bash
set -e

echo "🧹 Starting cleanup of deployment artifacts..."

# Configuration variables
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
FRONTEND_PATH="/home/campaignprox/public_html"

# Check if required environment variables are set
if [ -z "${PROD_SERVER}" ] || [ -z "${PROD_USER}" ] || [ -z "${PROD_PASSWORD}" ]; then
    echo "ERROR: Missing required environment variables: PROD_SERVER, PROD_USER, PROD_PASSWORD"
    exit 1
fi

# SSH command using sshpass
SSH="sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER}"

# Cleanup deployment artifacts
${SSH} bash -s << EOF
set -e

echo "🧹 Cleaning up deployment artifacts..."

# Remove temporary deployment files
rm -f /tmp/laravel-*.log 2>/dev/null || true
rm -rf /tmp/*_frontend* 2>/dev/null || true
rm -rf /tmp/*_backend* 2>/dev/null || true

# Remove old backup directories (keep last 3)
find /home/campaignprox/ -name "*_old" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

# Clean up Laravel cache and logs that might have accumulated
cd ${BACKEND_PATH} 2>/dev/null || echo "Backend path not accessible"
if [ -d "${BACKEND_PATH}" ]; then
    # Clear old Laravel logs (keep last 7 days)
    find ${BACKEND_PATH}/storage/logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # Clear old cache files
    rm -rf ${BACKEND_PATH}/bootstrap/cache/*.php 2>/dev/null || true
fi

echo "✅ Cleanup completed successfully!"
EOF

echo "✅ Cleanup script completed!"