#!/bin/bash
set -e

echo "🔧 Starting backend deployment..."

# Configuration variables
APP_NAME="campaignprox.msz-pl.com"
APP_USER="campaignprox"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com"
BACKUP_PATH="/home/campaignprox/backups"
RELEASE_NAME="${RELEASE_NAME}"
BUILD_TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DB_PATH="/home/campaignprox/domains/api.msz-pl.com/database/database.sqlite"

# Install sshpass if not available
if ! which sshpass > /dev/null; then
    echo "Installing sshpass..."
    sudo apt-get update && sudo apt-get install -y sshpass
fi

# Check if required environment variables are set
if [ -z "${PROD_SERVER}" ] || [ -z "${PROD_USER}" ] || [ -z "${PROD_PASSWORD}" ] || [ -z "${RELEASE_NAME}" ]; then
    echo "ERROR: Missing required environment variables: PROD_SERVER, PROD_USER, PROD_PASSWORD, RELEASE_NAME"
    exit 1
fi

# Upload backend package
echo "📤 Uploading backend package..."
if [ -f "deployment/${RELEASE_NAME}_backend.tar.gz" ]; then
    sshpass -p "${PROD_PASSWORD}" scp -o StrictHostKeyChecking=no \
        deployment/${RELEASE_NAME}_backend.tar.gz \
        ${PROD_USER}@${PROD_SERVER}:/tmp/
else
    echo "ERROR: Backend package deployment/${RELEASE_NAME}_backend.tar.gz not found"
    exit 1
fi

# Deploy backend via SSH
echo "🚀 Deploying backend..."
sshpass -p "${PROD_PASSWORD}" ssh -o StrictHostKeyChecking=no \
    ${PROD_USER}@${PROD_SERVER} << 'EOF'
set -e

echo "🔄 Starting backend deployment on server..."

# Create backup of current installation
if [ -d "${BACKEND_PATH}" ]; then
    echo "📋 Creating backup..."
    sudo mkdir -p ${BACKUP_PATH}
    sudo tar -czf ${BACKUP_PATH}/backend_backup_${BUILD_TIMESTAMP}.tar.gz -C ${BACKEND_PATH} . || echo "Backup failed, continuing..."
    [ -f "${DB_PATH}" ] && sudo cp ${DB_PATH} ${BACKUP_PATH}/db_backup_${BUILD_TIMESTAMP}.sqlite || echo "SQLite database not found, skipping backup..."
fi

# Create release directory
RELEASE_DIR="/tmp/releases/${RELEASE_NAME}_backend"
mkdir -p $RELEASE_DIR

# Extract new release
echo "📦 Extracting release..."
cd $RELEASE_DIR
if [ -f "/tmp/${RELEASE_NAME}_backend.tar.gz" ]; then
    tar -xzf /tmp/${RELEASE_NAME}_backend.tar.gz
else
    echo "ERROR: Release package /tmp/${RELEASE_NAME}_backend.tar.gz not found"
    exit 1
fi

# Prepare production environment
cd $RELEASE_DIR/backend

# Create production .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating production .env file..."
    cat > .env << ENVEOF
APP_NAME="WebMail"
APP_ENV=production
APP_KEY=base64:16PGCTiBJS2IasiE/L67lpkYOFkP6m4uMfnv21Nm7gg=
APP_DEBUG=false
APP_URL=https://api.msz-pl.com

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=database

MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=25
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@msz-pl.com"
MAIL_FROM_NAME="WebMail"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

VITE_APP_NAME="WebMail"
CORS_ALLOWED_ORIGINS=https://campaignprox.msz-pl.com
SANCTUM_STATEFUL_DOMAINS=campaignprox.msz-pl.com

JWT_SECRET=bC4VVwO1gmLFANCbujQoZlxI5wmsy8f7Zh5XHQ0Z4XPG4tUz6fiyU2aokksHBa17
JWT_ALGO=HS256
ENVEOF
else
    echo "📝 .env file already exists, skipping creation"
fi

# Ensure database directory exists
DB_DIR=$(dirname "${DB_PATH}")
if [ ! -d "${DB_DIR}" ]; then
    echo "📁 Creating database directory: ${DB_DIR}"
    sudo mkdir -p "${DB_DIR}"
    sudo chown ${APP_USER}:${APP_USER} "${DB_DIR}"
    sudo chmod 775 "${DB_DIR}"
fi

# Create SQLite database file if it doesn't exist
if [ ! -f "${DB_PATH}" ]; then
    echo "📁 Creating SQLite database file: ${DB_PATH}"
    sudo touch "${DB_PATH}"
    sudo chown ${APP_USER}:${APP_USER} "${DB_PATH}"
    sudo chmod 664 "${DB_PATH}"
fi

# Install production dependencies
echo "📦 Installing dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# Generate application key if .env has no APP_KEY
if ! grep -q "^APP_KEY=.\+" .env; then
    echo "🔑 Generating application key..."
    php artisan key:generate --force
fi

# Cache configurations
echo "⚡ Caching configurations..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
echo "🗄️ Running database migrations..."
php artisan migrate --force

# Create symbolic links
echo "🔗 Creating symbolic links..."
if [ ! -L "${BACKEND_PATH}/storage/app/public" ]; then
    php artisan storage:link
else
    echo "🔗 Storage link already exists"
fi

# Clear any existing caches
php artisan cache:clear
php artisan config:clear

# Set proper permissions
echo "🔒 Setting permissions..."
sudo chown -R ${APP_USER}:${APP_USER} .
sudo chmod -R 755 .
sudo chmod -R 775 storage bootstrap/cache
[ -f "${DB_PATH}" ] && sudo chmod 664 "${DB_PATH}"

# Atomic deployment - switch to new version
echo "🔄 Switching to new version..."
sudo rm -rf ${BACKEND_PATH}_old
if [ -d "${BACKEND_PATH}" ]; then
    sudo mv ${BACKEND_PATH} ${BACKEND_PATH}_old
fi
sudo mv $RELEASE_DIR/backend ${BACKEND_PATH}

echo "✅ Backend deployment completed!"

# Restart services
echo "🔄 Restarting services..."
sudo systemctl reload apache2 || echo "Web server reload failed"
sudo systemctl restart php8.2-fpm || echo "PHP-FPM restart failed"

# Run Laravel optimization commands
cd ${BACKEND_PATH}
php artisan optimize
php artisan queue:restart || echo "Queue restart failed"

# Clean up
echo "🧹 Cleaning up..."
rm -f /tmp/${RELEASE_NAME}_backend.tar.gz
rm -rf $RELEASE_DIR

echo "🎉 Backend deployment successfully completed!"

EOF

echo "✅ Backend deployment script completed!"