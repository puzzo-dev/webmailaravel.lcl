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
if [ -d "${BACKEND_PATH}" ]; then
    echo "📋 Creating backup..."
    sudo mkdir -p ${BACKUP_PATH}
    sudo tar -czf ${BACKUP_PATH}/backend_backup_${BUILD_TIMESTAMP}.tar.gz -C ${BACKEND_PATH} . || echo "Backup failed, continuing..."
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
APP_KEY=
APP_DEBUG=false
APP_URL=https://yourdomain.com

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=${DB_HOST}
DB_PORT=3306
DB_DATABASE=${DB_NAME}
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"

# PowerMTA Configuration
POWERMTA_CSV_PATH=/var/log/powermta

# JWT Configuration
JWT_SECRET=
JWT_TTL=60

# System Configuration
SYSTEM_ADMIN_EMAIL=admin@yourdomain.com
ENVEOF

# Install production dependencies
echo "📦 Installing dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# Generate application key if needed
echo "🔑 Generating application key..."
php artisan key:generate --force

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
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
sudo chmod -R 775 storage bootstrap/cache

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
sudo systemctl reload apache2 || sudo systemctl reload nginx || echo "Web server reload failed"
sudo systemctl restart php8.2-fpm || sudo systemctl restart php-fpm || echo "PHP-FPM restart failed"

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
