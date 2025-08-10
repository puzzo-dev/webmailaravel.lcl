#!/bin/bash
set -e

# Updated: 2025-08-10 - Fixed Laravel index.php validation path
echo "🔧 Starting backend deployment..."

# Configuration variables
APP_NAME="Campaign Pro X"
APP_USER="campaignprox"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
BACKUP_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html/backups"
DB_PATH="${BACKEND_PATH}/database/database.sqlite"
RELEASE_NAME="${RELEASE_NAME}"
RELEASE_DIR="deployment/backend"
PHP_CMD="php8.3"

# Check if required environment variables are set
if [ -z "${PROD_SERVER}" ] || [ -z "${PROD_USER}" ] || [ -z "${PROD_PASSWORD}" ] || [ -z "${RELEASE_NAME}" ]; then
    echo "ERROR: Missing required environment variables: PROD_SERVER, PROD_USER, PROD_PASSWORD, RELEASE_NAME"
    exit 1
fi

# Check if release directory exists
if [ ! -d "${RELEASE_DIR}" ]; then
    echo "ERROR: Release directory ${RELEASE_DIR} not found"
    exit 1
fi

# SSH and rsync commands using sshpass
SSH="sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER}"

# Verify PHP and SQLite extension
echo "🔍 Checking PHP and SQLite extension..."
${SSH} bash -s << EOF
if ! command -v ${PHP_CMD} &>/dev/null; then
    for version in php8.2 php8.1 php7.1; do
        if command -v \$version &>/dev/null; then
            echo "Using \$version instead of php8.3"
            exit 0
        fi
    done
    echo "ERROR: No compatible PHP version found"
    exit 1
fi
if ! ${PHP_CMD} -m | grep -q pdo_sqlite; then
    echo "ERROR: php8.3-sqlite3 extension not installed"
    exit 1
fi
EOF

# Upload release directory with rsync
echo "📤 Uploading backend directory..."
sshpass -p "${PROD_PASSWORD}" rsync -avz --no-perms --no-owner --no-group -e "ssh -o StrictHostKeyChecking=no" ${RELEASE_DIR}/ ${PROD_USER}@${PROD_SERVER}:/tmp/${RELEASE_NAME}_backend/

# Deploy via SSH
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

# Move rsynced directory to final location
echo "📦 Moving backend files..."
mv /tmp/${RELEASE_NAME}_backend ${BACKEND_PATH}
if [ ! -f "${BACKEND_PATH}/public/index.php" ]; then
    echo "ERROR: Backend transfer failed, public/index.php not found"
    exit 1
fi

# Fix ownership for the entire backend directory
echo "🔧 Fixing directory ownership..."
chown -R ${APP_USER}:${APP_USER} ${BACKEND_PATH}
chmod -R 755 ${BACKEND_PATH}

# Create .htaccess file in document root to redirect to Laravel public directory
echo "🔧 Creating .htaccess to redirect to Laravel public directory..."
cat > ${BACKEND_PATH}/.htaccess << 'HTACCESS_EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Redirect requests to public directory if file doesn't exist in root
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/public/
    RewriteRule ^(.*)$ /public/$1 [L,QSA]
    
    # If accessing root, redirect to public/index.php
    RewriteRule ^$ /public/index.php [L]
</IfModule>

# Fallback for servers without mod_rewrite
<IfModule !mod_rewrite.c>
    DirectoryIndex public/index.php
</IfModule>
HTACCESS_EOF

# Create a fallback index.php in document root
cat > ${BACKEND_PATH}/index.php << 'INDEX_EOF'
<?php
// Fallback redirection to Laravel public directory
if (file_exists(__DIR__ . '/public/index.php')) {
    require_once __DIR__ . '/public/index.php';
} else {
    // If public/index.php doesn't exist, show error
    http_response_code(500);
    echo "Laravel application not properly installed. Public directory not found.";
}
INDEX_EOF

chown ${APP_USER}:${APP_USER} ${BACKEND_PATH}/.htaccess ${BACKEND_PATH}/index.php
chmod 644 ${BACKEND_PATH}/.htaccess ${BACKEND_PATH}/index.php

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

# Validate .env
if ! grep -q "DB_CONNECTION=sqlite" ${BACKEND_PATH}/.env; then
    echo "ERROR: .env does not specify SQLite connection"
    exit 1
fi
sed -i "s|DB_DATABASE=.*|DB_DATABASE=${DB_PATH}|" ${BACKEND_PATH}/.env

# Generate application key if not set
if ! grep -q "APP_KEY=.\+" ${BACKEND_PATH}/.env; then
    echo "Generating new application key..."
    cd ${BACKEND_PATH}
    ${PHP_CMD} artisan key:generate --force
fi

# Ensure database exists
if [ ! -f "${DB_PATH}" ]; then
    echo "Creating new SQLite database..."
    mkdir -p $(dirname ${DB_PATH})
    touch ${DB_PATH}
fi

# Fix database and storage permissions
echo "🔧 Setting up Laravel-specific permissions..."
chown -R ${APP_USER}:${APP_USER} ${BACKEND_PATH}/storage ${BACKEND_PATH}/bootstrap/cache $(dirname ${DB_PATH}) 2>/dev/null || true
chmod -R 775 ${BACKEND_PATH}/storage ${BACKEND_PATH}/bootstrap/cache 2>/dev/null || true
chmod 664 ${DB_PATH} 2>/dev/null || true

# Run migrations and optimizations
echo "🔄 Running migrations and optimizations..."
cd ${BACKEND_PATH}
${PHP_CMD} artisan down || true
${PHP_CMD} artisan migrate --force || { echo "Migration failed"; exit 1; }
${PHP_CMD} artisan db:seed --force || echo "Database seeding failed, continuing..."
${PHP_CMD} artisan config:cache
${PHP_CMD} artisan route:cache
${PHP_CMD} artisan view:cache
${PHP_CMD} artisan queue:restart
${PHP_CMD} artisan storage:link
${PHP_CMD} artisan up
systemctl reload apache2 2>/dev/null || service apache2 reload 2>/dev/null || echo "Web server reload failed"
systemctl restart php8.3-fpm 2>/dev/null || service php8.3-fpm restart 2>/dev/null || echo "PHP-FPM restart failed"

echo "✅ Backend deployment completed!"
EOF

echo "✅ Backend deployment script completed!"