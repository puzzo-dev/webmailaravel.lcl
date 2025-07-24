#!/bin/bash
set -e

echo "🔧 Starting backend deployment..."

# Configuration variables
APP_NAME="Campaign Pro X"
APP_USER="campaignprox"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
BACKUP_PATH="/home/campaignprox/domains/api.msz-pl.com/backups"
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

# Verify SQLite extension for PHP 8.3
echo "🔍 Checking SQLite extension..."
${SSH} bash -s << EOF
if ! php8.3 -m | grep -q pdo_sqlite; then
    echo "ERROR: php8.3-sqlite3 extension not installed"
    exit 1
fi
EOF

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
    if [ -d "${BACKEND_PATH}_old" ]; then
        rm -rf ${BACKEND_PATH}_old
    fi
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

# Copy and configure environment file
echo "🔧 Configuring .env file..."
if [ -f "${BACKEND_PATH}/.env" ]; then
    echo "Using provided .env file from deployment package"
elif [ -f "${BACKEND_PATH}_old/.env" ]; then
    echo "Copying .env from previous deployment"
    cp ${BACKEND_PATH}_old/.env ${BACKEND_PATH}/.env
else
    echo "WARNING: No .env file found, using .env.example as template"
    cp ${BACKEND_PATH}/.env.example ${BACKEND_PATH}/.env
fi

# Ensure database path is set correctly
sed -i "s|DB_DATABASE=.*|DB_DATABASE=${DB_PATH}|" ${BACKEND_PATH}/.env

# Generate application key if not set
if ! grep -q "APP_KEY=.\+" ${BACKEND_PATH}/.env; then
    echo "Generating new application key..."
    php8.3 artisan key:generate --force
fi

# Reset database for fresh migration
echo "🧹 Resetting database for fresh migration..."
if [ -f "${DB_PATH}" ]; then
    echo "Backing up existing database..."
    DB_BACKUP="${BACKUP_PATH}/db_backup_\$(date +%Y%m%d_%H%M%S).sqlite"
    cp ${DB_PATH} \${DB_BACKUP} || echo "WARNING: Database backup failed"
    rm -f ${DB_PATH}
fi
touch ${DB_PATH}
sudo chown ${APP_USER}:${APP_USER} ${DB_PATH}
sudo chmod 664 ${DB_PATH}

# Restart services and run fresh migrations
echo "🔄 Restarting services and running fresh migrations..."
cd ${BACKEND_PATH}
php8.3 artisan down || true
php8.3 artisan migrate:fresh --force || { echo "Fresh migration failed"; exit 1; }
php8.3 artisan db:seed --force || echo "Database seeding failed, continuing..."
php8.3 artisan config:cache
php8.3 artisan route:cache
php8.3 artisan view:cache
php8.3 artisan queue:restart
php8.3 artisan up
sudo systemctl reload apache2 || echo "Web server reload failed"
sudo systemctl restart php8.3-fpm || echo "PHP-FPM restart failed"

echo "✅ Backend deployment completed!"
EOF

echo "✅ Backend deployment script completed!"