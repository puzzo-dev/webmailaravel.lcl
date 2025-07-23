#!/bin/bash
set -e

echo "🔧 Starting backend deployment..."

# Install sshpass if not available
if ! which sshpass > /dev/null; then
    echo "Installing sshpass..."
    sudo apt-get update && sudo apt-get install -y sshpass
fi

# Upload backend package
echo "📤 Uploading backend package..."
sshpass -p "${PROD_PASSWORD}" scp -o StrictHostKeyChecking=no \
    deployment/${RELEASE_NAME}_backend.tar.gz \
    ${PROD_USER}@${PROD_SERVER}:/tmp/

# Deploy backend via SSH
echo "🚀 Deploying backend..."
sshpass -p "${PROD_PASSWORD}" ssh -o StrictHostKeyChecking=no \
    ${PROD_USER}@${PROD_SERVER} << 'EOF'
set -e

echo "🔄 Starting backend deployment on server..."

# Create backup of current installation
# BACKEND_PATH="/home/campaignprox/public_html/api"
# BACKUP_PATH="/home/campaignprox/backups"
# DB_PATH="/home/campaignprox/public_html/api/database/database.sqlite"
if [ -d "${BACKEND_PATH}" ]; then
    echo "📋 Creating backup..."
    sudo mkdir -p ${BACKUP_PATH}
    sudo tar -czf ${BACKUP_PATH}/backend_backup_${BUILD_TIMESTAMP}.tar.gz -C ${BACKEND_PATH} . || echo "Backup failed, continuing..."
    [ -f "${DB_PATH}" ] && sudo cp ${DB_PATH} ${BACKUP_PATH}/db_backup_${BUILD_TIMESTAMP}.sqlite || echo "SQLite3 database not found, skipping backup..."
fi

# Create release directory
RELEASE_DIR="/tmp/releases/${RELEASE_NAME}_backend"
mkdir -p $RELEASE_DIR

# Extract new release
echo "📦 Extracting release..."
cd $RELEASE_DIR
tar -xzf /tmp/${RELEASE_NAME}_backend.tar.gz

# Prepare production environment
cd $RELEASE_DIR/backend

# Create production .env file
cat > .env << ENVEOF
APP_NAME="WebMail Laravel"
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
MAIL_FROM_ADDRESS="hello@yourdomain.com"
MAIL_FROM_NAME="WebMail Laravel"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

VITE_APP_NAME="WebMail Laravel"
CORS_ALLOWED_ORIGINS=https://campaignprox.msz-pl.com
SANCTUM_STATEFUL_DOMAINS=campaignprox.msz-pl.com

JWT_SECRET=bC4VVwO1gmLFANCbujQoZlxI5wmsy8f7Zh5XHQ0Z4XPG4tUz6fiyU2aokksHBa17
JWT_TTL=60
JWT_ALGO=HS256

# PowerMTA Configuration
POWERMTA_CSV_PATH=/var/log/powermta

# System Configuration
SYSTEM_ADMIN_EMAIL=admin@yourdomain.com
ENVEOF

# Install production dependencies
echo "📦 Installing dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# Generate application key if needed
echo "🔑 Generating application key..."
if [ -z "$(grep '^APP_KEY=base64:' .env)" ]; then
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
php artisan storage:link

# Clear any existing caches
php artisan cache:clear
php artisan config:clear

# Set proper permissions
echo "🔒 Setting permissions..."
sudo chown -R campaignprox:campaignprox .
sudo chmod -R 755 .
sudo chmod -R 775 storage bootstrap/cache
[ -f "${DB_PATH}" ] || sudo touch ${DB_PATH}
sudo chmod 664 ${DB_PATH}

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