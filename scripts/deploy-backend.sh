#!/bin/bash
set -e

echo "🔧 Starting backend deployment..."

# Configuration variables
APP_NAME="campaignprox.msz-pl.com"
APP_USER="campaignprox"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
APP_PATH="/home/campaignprox/domains/api.msz-pl.com/app"
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
BACKUP_PATH="/home/campaignprox/domains/api.msz-pl.com/backups"
DB_PATH="/home/campaignprox/domains/api.msz-pl.com/app/database/database.sqlite"
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
if [ -d "${APP_PATH}" ]; then
    mkdir -p ${BACKUP_PATH}
    DB_BACKUP="${BACKUP_PATH}/db_backup_\$(date +%Y%m%d_%H%M%S).sqlite"
    [ -f "${DB_PATH}" ] && cp ${DB_PATH} \${DB_BACKUP} || echo "WARNING: Database backup failed"
    if [ -d "${APP_PATH}_old" ]; then
        rm -rf ${APP_PATH}_old
    fi
    mv ${APP_PATH} ${APP_PATH}_old || true
fi

# Backup public_html if it exists
if [ -d "${BACKEND_PATH}" ]; then
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
sudo mv /tmp/backend ${APP_PATH}
rm /tmp/${RELEASE_NAME}_backend.tar.gz

# Create public_html directory and copy public folder contents
echo "📂 Setting up public directory structure..."
sudo mkdir -p ${BACKEND_PATH}
sudo cp -r ${APP_PATH}/public/* ${BACKEND_PATH}/

# Update index.php paths to point to the app directory
echo "🔧 Updating index.php paths..."
INDEX_PHP="${BACKEND_PATH}/index.php"
if [ -f "\${INDEX_PHP}" ]; then
    sed -i "s|__DIR__.'/../storage/framework/maintenance.php'|'${APP_PATH}/storage/framework/maintenance.php'|" \${INDEX_PHP}
    sed -i "s|__DIR__.'/../vendor/autoload.php'|'${APP_PATH}/vendor/autoload.php'|" \${INDEX_PHP}
    sed -i "s|__DIR__.'/../bootstrap/app.php'|'${APP_PATH}/bootstrap/app.php'|" \${INDEX_PHP}
else
    echo "ERROR: index.php not found in ${BACKEND_PATH}"
    exit 1
fi

# Set permissions
echo "🔒 Setting permissions..."
sudo chown -R ${APP_USER}:${APP_USER} ${APP_PATH} ${BACKEND_PATH}
sudo chmod -R 755 ${APP_PATH} ${BACKEND_PATH}
sudo chmod -R 775 ${APP_PATH}/storage ${APP_PATH}/bootstrap/cache
[ -f "${DB_PATH}" ] && sudo chmod 664 ${DB_PATH}

# Copy and configure environment file
echo "🔧 Configuring .env file..."
if [ -f "${APP_PATH}/.env" ]; then
    echo "Using provided .env file from deployment package"
elif [ -f "${APP_PATH}_old/.env" ]; then
    echo "Copying .env from previous deployment"
    cp ${APP_PATH}_old/.env ${APP_PATH}/.env
else
    echo "WARNING: No .env file found, using .env.example as template"
    cp ${APP_PATH}/.env.example ${APP_PATH}/.env
fi

# Ensure database path is set correctly
sed -i "s|DB_DATABASE=.*|DB_DATABASE=${DB_PATH}|" ${APP_PATH}/.env

# Generate application key if not set
if ! grep -q "APP_KEY=.\+" ${APP_PATH}/.env; then
    echo "Generating new application key..."
    cd ${APP_PATH}
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
mkdir -p $(dirname ${DB_PATH})
touch ${DB_PATH}
sudo chown ${APP_USER}:${APP_USER} ${DB_PATH}
sudo chmod 664 ${DB_PATH}

# Restart services and run fresh migrations
echo "🔄 Restarting services and running fresh migrations..."
cd ${APP_PATH}
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