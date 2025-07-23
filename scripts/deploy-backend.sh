#!/bin/bash
set -e

echo "🔧 Starting backend deployment..."

# Configuration variables
APP_NAME="campaignprox.msz-pl.com"
APP_USER="campaignprox"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
BACKUP_PATH="/home/campaignprox/backups"
DB_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html/database/database.sqlite"
RELEASE_NAME="${RELEASE_NAME}"
RELEASE_PACKAGE="deployment/${RELEASE_NAME}_backend.tar.gz"

# Check if required environment variables are set
if [ -z "${PROD_SERVER}" ] || [ -z "${PROD_USER}" ] || [ -z "${PROD_PASSWORD}" ] || [ -z "${RELEASE_NAME}" ]; then
    echo "ERROR: Missing required environment variables: PROD_SERVER, PROD_USER, PROD_PASSWORD, RELEASE_NAME"
    exit 1
fi

# Check if release package exists
if [ ! -f "${RELEASE_PACKAGE}" ]; then
    echo "ERROR: Release package ${RELEASE_PACKAGE} not found"
    exit 1
fi

# SSH and SCP commands using sshpass
SSH="sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER}"
SCP="sshpass -p ${PROD_PASSWORD} scp -o StrictHostKeyChecking=no"

# Upload release package
echo "📤 Uploading backend package..."
${SCP} ${RELEASE_PACKAGE} ${PROD_USER}@${PROD_SERVER}:/tmp/${RELEASE_NAME}_backend.tar.gz

# Deploy via SSH
echo "🚀 Deploying backend..."
${SSH} bash -s << EOF
set -e

echo "🔄 Starting backend deployment on server..."

# Create backup
echo "📁 Creating backup..."
if [ -d "${BACKEND_PATH}" ]; then
    mkdir -p ${BACKUP_PATH}
    DB_BACKUP="${BACKUP_PATH}/db_backup_\$(date +%Y%m%d_%H%M%S).sqlite"
    [ -f "${DB_PATH}" ] && cp ${DB_PATH} \${DB_BACKUP} || echo "WARNING: Database backup failed"
    mv ${BACKEND_PATH} ${BACKEND_PATH}_old || true
fi

# Extract release
echo "📦 Extracting release..."
if [ ! -f "/tmp/${RELEASE_NAME}_backend.tar.gz" ]; then
    echo "ERROR: Release package /tmp/${RELEASE_NAME}_backend.tar.gz not found"
    exit 1
fi
tar -xzf /tmp/${RELEASE_NAME}_backend.tar.gz -C /tmp
sudo mv /tmp/backend ${BACKEND_PATH}
rm /tmp/${RELEASE_NAME}_backend.tar.gz

# Set permissions
echo "🔒 Setting permissions..."
sudo chown -R ${APP_USER}:${APP_USER} ${BACKEND_PATH}
sudo chmod -R 755 ${BACKEND_PATH}
sudo chmod -R 775 ${BACKEND_PATH}/storage ${BACKEND_PATH}/bootstrap/cache
[ -f "${DB_PATH}" ] && sudo chmod 664 ${DB_PATH}

# Copy environment file
if [ -f "${BACKEND_PATH}_old/.env" ]; then
    cp ${BACKEND_PATH}_old/.env ${BACKEND_PATH}/.env
else
    echo "WARNING: No .env file found in previous deployment, manual configuration required"
fi

# Restart services
echo "🔄 Restarting services..."
cd ${BACKEND_PATH}
php artisan down || true
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart
php artisan up
sudo systemctl reload apache2 || echo "Web server reload failed"
sudo systemctl restart php8.2-fpm || echo "PHP-FPM restart failed"

echo "✅ Backend deployment completed!"
EOF

echo "✅ Backend deployment script completed!"