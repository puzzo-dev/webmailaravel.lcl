#!/bin/bash
set -e

echo "🚀 Starting backend deployment with backup/restore functionality..."

# Configuration variables
APP_NAME="Campaign Pro X"
APP_USER="campaignprox"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
BACKUP_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html/backups"
DB_PATH="/home/campaignprox/domains/api.msz-pl.com/database.sqlite"
RELEASE_NAME="${RELEASE_NAME}"
RELEASE_DIR="backend"
PHP_CMD="php8.3"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check if required environment variables are set
if [ -z "${PROD_SERVER}" ] || [ -z "${PROD_USER}" ] || [ -z "${PROD_PASSWORD}" ] || [ -z "${RELEASE_NAME}" ]; then
    echo "ERROR: Missing required environment variables: PROD_SERVER, PROD_USER, PROD_PASSWORD, RELEASE_NAME"
    exit 1
fi

# Check if backend directory exists
if [ ! -d "${RELEASE_DIR}" ]; then
    echo "ERROR: Backend directory ${RELEASE_DIR} not found"
    exit 1
fi

# SSH command using sshpass
SSH="sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER}"

# Backup function
create_backup() {
    echo "📁 Creating comprehensive backup..."
    ${SSH} bash -s << 'BACKUP_EOF'
        set -e
        BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
        BACKUP_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html/backups"
        DB_PATH="/home/campaignprox/domains/api.msz-pl.com/database.sqlite"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        
        # Create backup directory
        mkdir -p "${BACKUP_PATH}"
        
        if [ -d "${BACKEND_PATH}" ]; then
            echo "📦 Backing up existing backend files..."
            
            # Create full backup archive
            BACKUP_FILE="${BACKUP_PATH}/backend_backup_${TIMESTAMP}.tar.gz"
            tar -czf "${BACKUP_FILE}" -C "$(dirname ${BACKEND_PATH})" "$(basename ${BACKEND_PATH})" 2>/dev/null || {
                echo "ERROR: Failed to create backend backup"
                exit 1
            }
            
            # Backup database separately
            if [ -f "${DB_PATH}" ]; then
                DB_BACKUP="${BACKUP_PATH}/database_backup_${TIMESTAMP}.sqlite"
                cp "${DB_PATH}" "${DB_BACKUP}" || {
                    echo "ERROR: Failed to backup database"
                    exit 1
                }
                echo "✅ Database backed up to: ${DB_BACKUP}"
            fi
            
            # Create state file for rollback reference
            echo "${TIMESTAMP}" > "${BACKUP_PATH}/.last_backup"
            echo "${BACKEND_PATH}" >> "${BACKUP_PATH}/.last_backup"
            echo "${DB_PATH}" >> "${BACKUP_PATH}/.last_backup"
            
            echo "✅ Backend backup created: ${BACKUP_FILE}"
            
            # Keep only last 5 backups
            ls -t "${BACKUP_PATH}"/backend_backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -I {} rm -f {} || true
            ls -t "${BACKUP_PATH}"/database_backup_*.sqlite 2>/dev/null | tail -n +6 | xargs -I {} rm -f {} || true
        else
            echo "ℹ️ No existing backend found, creating new deployment marker"
            echo "new_deployment_${TIMESTAMP}" > "${BACKUP_PATH}/.last_backup"
        fi
BACKUP_EOF
}

# Restore function
restore_backup() {
    echo "🔄 Restoring from backup due to deployment failure..."
    ${SSH} bash -s << 'RESTORE_EOF'
        set -e
        BACKUP_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html/backups"
        
        if [ ! -f "${BACKUP_PATH}/.last_backup" ]; then
            echo "ERROR: No backup reference found"
            exit 1
        fi
        
        BACKUP_TIMESTAMP=$(head -n1 "${BACKUP_PATH}/.last_backup")
        BACKEND_PATH=$(sed -n '2p' "${BACKUP_PATH}/.last_backup")
        DB_PATH=$(sed -n '3p' "${BACKUP_PATH}/.last_backup")
        
        if [[ "${BACKUP_TIMESTAMP}" == new_deployment_* ]]; then
            echo "ℹ️ This was a new deployment, cleaning up failed installation..."
            rm -rf "${BACKEND_PATH}" || true
            echo "✅ Cleanup completed"
        else
            echo "📦 Restoring backend from backup timestamp: ${BACKUP_TIMESTAMP}"
            
            BACKUP_FILE="${BACKUP_PATH}/backend_backup_${BACKUP_TIMESTAMP}.tar.gz"
            DB_BACKUP="${BACKUP_PATH}/database_backup_${BACKUP_TIMESTAMP}.sqlite"
            
            if [ -f "${BACKUP_FILE}" ]; then
                # Remove failed deployment
                rm -rf "${BACKEND_PATH}" || true
                
                # Restore from backup
                tar -xzf "${BACKUP_FILE}" -C "$(dirname ${BACKEND_PATH})" || {
                    echo "ERROR: Failed to restore backend backup"
                    exit 1
                }
                
                # Restore database
                if [ -f "${DB_BACKUP}" ]; then
                    cp "${DB_BACKUP}" "${DB_PATH}" || {
                        echo "ERROR: Failed to restore database backup"
                        exit 1
                    }
                    echo "✅ Database restored"
                fi
                
                # Fix permissions
                chown -R campaignprox:campaignprox "${BACKEND_PATH}" || true
                chmod -R 755 "${BACKEND_PATH}" || true
                chmod -R 775 "${BACKEND_PATH}"/storage "${BACKEND_PATH}"/bootstrap/cache 2>/dev/null || true
                
                echo "✅ Backend restored successfully"
            else
                echo "ERROR: Backup file not found: ${BACKUP_FILE}"
                exit 1
            fi
        fi
        
        # Restart services after restore
        systemctl reload apache2 2>/dev/null || service apache2 reload 2>/dev/null || echo "Web server reload failed"
        systemctl restart php8.3-fpm 2>/dev/null || service php8.3-fpm restart 2>/dev/null || echo "PHP-FPM restart failed"
RESTORE_EOF
}

# Function to deploy backend
deploy_backend() {
    echo "📤 Uploading backend files..."
    # First, upload all files (excluding git and development env files)
    sshpass -p "${PROD_PASSWORD}" rsync -avz --delete --exclude='node_modules' --exclude='.git' --exclude='storage/logs/*' --exclude='bootstrap/cache/*' --exclude='.env' --exclude='.env.local' --exclude='.env.backup' -e "ssh -o StrictHostKeyChecking=no" ${RELEASE_DIR}/ ${PROD_USER}@${PROD_SERVER}:/tmp/${RELEASE_NAME}_backend_new/
    
    # Explicitly upload the .env.production file (it might be in .gitignore)
    echo "📤 Uploading .env.production file..."
    sshpass -p "${PROD_PASSWORD}" scp -o StrictHostKeyChecking=no ${RELEASE_DIR}/.env.production ${PROD_USER}@${PROD_SERVER}:/tmp/${RELEASE_NAME}_backend_new/.env.production
    
    # Verify the .env.production file was uploaded
    echo "🔍 Verifying .env.production upload..."
    ${SSH} "ls -la /tmp/${RELEASE_NAME}_backend_new/.env.production" || {
        echo "❌ ERROR: Failed to upload .env.production file"
        exit 1
    }

    # Deploy backend on server
    ${SSH} bash -s << EOF
set -e
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
DB_PATH="/home/campaignprox/domains/api.msz-pl.com/database.sqlite"
PHP_CMD="php8.3"

echo "🔧 Installing new backend..."

# Move new files to final location
if [ -d "\${BACKEND_PATH}" ]; then
    rm -rf "\${BACKEND_PATH}_deploying" || true
    mv "\${BACKEND_PATH}" "\${BACKEND_PATH}_deploying"
fi

mv "/tmp/${RELEASE_NAME}_backend_new" "\${BACKEND_PATH}"

# Verify critical files exist
if [ ! -f "\${BACKEND_PATH}/public/index.php" ]; then
    echo "ERROR: Critical file missing - public/index.php"
    exit 1
fi

# Fix ownership and permissions
chown -R campaignprox:campaignprox "\${BACKEND_PATH}"
chmod -R 755 "\${BACKEND_PATH}"

cd "\${BACKEND_PATH}"

echo "🔧 Installing Composer dependencies..."
if ! command -v composer &>/dev/null; then
    echo "ERROR: Composer not found on production server"
    exit 1
fi
composer install --no-dev --optimize-autoloader || {
    echo "ERROR: Composer install failed"
    exit 1
}

echo "🔧 Setting up Laravel..."
# Always use production environment for production deployments
echo "🔧 Configuring production environment..."
if [ -f ".env.production" ]; then
    echo "✅ Using .env.production for production deployment"
    cp ".env.production" ".env"
else
    echo "❌ ERROR: .env.production file not found!"
    exit 1
fi

# Ensure production settings are correct
echo "🔧 Ensuring production configuration..."
sed -i 's/APP_ENV=.*/APP_ENV=production/' .env
sed -i 's/APP_DEBUG=.*/APP_DEBUG=false/' .env

# Set correct database path for production
if grep -q "DB_CONNECTION=sqlite" .env; then
    # Use absolute path for production database
    PROD_DB_PATH="/home/campaignprox/domains/api.msz-pl.com/database.sqlite"
    sed -i "s|DB_DATABASE=.*|DB_DATABASE=\${PROD_DB_PATH}|" .env
    echo "✅ Database path configured for production: \${PROD_DB_PATH}"
fi

# Generate app key if needed
if ! grep -q "APP_KEY=" .env || grep -q "APP_KEY=\$" .env; then
    \${PHP_CMD} artisan key:generate --force || {
        echo "ERROR: Failed to generate APP_KEY"
        exit 1
    }
    echo "✅ Generated new APP_KEY"
fi

# Generate JWT secret if needed
if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=\$" .env || [ "\$(grep '^JWT_SECRET=' .env | cut -d'=' -f2)" = "" ]; then
    echo "🔐 Generating JWT secret..."
    \${PHP_CMD} artisan jwt:secret --force || {
        echo "ERROR: Failed to generate JWT_SECRET"
        exit 1
    }
    echo "✅ Generated new JWT_SECRET"
else
    echo "✅ JWT_SECRET already configured"
fi

# Verify critical environment variables
echo "🔍 Verifying critical environment variables..."
if ! grep -q "^APP_KEY=.\+" .env; then
    echo "ERROR: APP_KEY is not properly set"
    exit 1
fi
if ! grep -q "^JWT_SECRET=.\+" .env; then
    echo "ERROR: JWT_SECRET is not properly set"
    exit 1
fi
echo "✅ Critical environment variables verified"

# Ensure database exists and run migrations
if [ ! -f "\${DB_PATH}" ]; then
    echo "Creating new SQLite database..."
    mkdir -p \$(dirname \${DB_PATH})
    touch "\${DB_PATH}"
fi

echo "🗄️ Running database migrations..."
\${PHP_CMD} artisan migrate --force || {
    echo "ERROR: Database migration failed"
    exit 1
}

# Fix database and storage permissions
echo "🔧 Setting up Laravel-specific permissions..."
chown -R campaignprox:campaignprox "\${BACKEND_PATH}/storage" "\${BACKEND_PATH}/bootstrap/cache" \$(dirname \${DB_PATH}) 2>/dev/null || true
chmod -R 775 "\${BACKEND_PATH}/storage" "\${BACKEND_PATH}/bootstrap/cache" 2>/dev/null || true
chmod 664 "\${DB_PATH}" 2>/dev/null || true

# Clear and cache configuration
echo "📋 Caching configuration..."
\${PHP_CMD} artisan config:cache || {
    echo "ERROR: Config cache failed"
    exit 1
}
\${PHP_CMD} artisan route:cache || {
    echo "ERROR: Route cache failed"
    exit 1
}
\${PHP_CMD} artisan view:cache || {
    echo "ERROR: View cache failed"
    exit 1
}

# Create .htaccess for Laravel routing
echo "📝 Creating .htaccess for Laravel routing..."
cat > .htaccess << 'HTACCESS'
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
HTACCESS

echo "⚙️ Setting up cron job..."
# Check if cron.txt exists and set up cron
if [ -f cron.txt ]; then
    echo "Found cron.txt, setting up cron job..."
    crontab -l > current_cron 2>/dev/null || touch current_cron
    # Remove any existing Laravel schedule entries
    sed -i '/artisan schedule:run/d' current_cron
    # Add new Laravel schedule entry from cron.txt
    cat cron.txt >> current_cron
    crontab current_cron
    rm current_cron
    echo "✅ Cron job configured"
else
    echo "⚠️ No cron.txt found, skipping cron setup"
fi

echo "🔄 Setting up queue worker..."
# Kill any existing queue workers
pkill -f "artisan queue:work" 2>/dev/null || true
sleep 2

# Start new background worker using nohup
nohup \${PHP_CMD} artisan queue:work --sleep=3 --tries=3 --timeout=60 --memory=512 > /tmp/laravel-worker.log 2>&1 &
WORKER_PID=\$!
echo "✅ Started Laravel queue worker with PID: \$WORKER_PID"

echo "🧪 Testing backend deployment..."
# Test if Laravel is working
if \${PHP_CMD} artisan --version > /dev/null 2>&1; then
    echo "✅ Laravel artisan is working"
else
    echo "❌ Laravel artisan test failed"
    exit 1
fi

# Test JWT configuration
echo "🔐 Testing JWT configuration..."
if \${PHP_CMD} artisan tinker --execute="echo 'JWT Config Test: ' . config('jwt.secret') ? 'OK' : 'MISSING';" 2>/dev/null | grep -q "JWT Config Test: OK"; then
    echo "✅ JWT configuration is valid"
else
    echo "❌ JWT configuration test failed"
    # Try to regenerate JWT secret
    echo "🔧 Attempting to regenerate JWT secret..."
    \${PHP_CMD} artisan jwt:secret --force || {
        echo "ERROR: JWT secret generation failed"
        exit 1
    }
fi

# Test database connection
echo "🗄️ Testing database connection..."
if \${PHP_CMD} artisan tinker --execute="DB::connection()->getPdo(); echo 'Database: OK';" 2>/dev/null | grep -q "Database: OK"; then
    echo "✅ Database connection is working"
else
    echo "❌ Database connection test failed"
    exit 1
fi

# Test if public/index.php exists and is accessible
if [ -f public/index.php ]; then
    echo "✅ Laravel public/index.php found"
else
    echo "❌ Laravel public/index.php missing"
    exit 1
fi

# Test basic Laravel configuration
echo "🧪 Testing Laravel configuration..."
# Restart services
systemctl reload apache2 2>/dev/null || service apache2 reload 2>/dev/null || echo "Web server reload failed"
systemctl restart php8.3-fpm 2>/dev/null || service php8.3-fpm restart 2>/dev/null || echo "PHP-FPM restart failed"

# Clean up old deployment
rm -rf "\${BACKEND_PATH}_deploying" || true

echo "✅ Backend deployment completed successfully!"
EOF
}

# Check if PHP is available on production
echo "🔍 Checking PHP availability..."
${SSH} bash -s << EOF
if ! command -v ${PHP_CMD} &>/dev/null; then
    echo "ERROR: ${PHP_CMD} not found on production server"
    exit 1
fi
echo "✅ ${PHP_CMD} is available"
EOF

# Main deployment process with error handling
{
    create_backup
    deploy_backend
    echo "✅ Backend deployment completed successfully!"
} || {
    echo "❌ Backend deployment failed, initiating restore..."
    restore_backup
    echo "❌ Backend deployment failed and backup has been restored"
    exit 1
}

echo "✅ Backend deployment script completed!"
