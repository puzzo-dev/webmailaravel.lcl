#!/bin/bash
set -e

echo "🔄 Starting rollback process..."

# Configuration variables
APP_NAME="Campaign Pro X"
APP_USER="campaignprox"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
FRONTEND_PATH="/home/campaignprox/public_html"
BACKUP_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html/backups"
DB_PATH="${BACKEND_PATH}/database/database.sqlite"

# Check if required environment variables are set
if [ -z "${PROD_SERVER}" ] || [ -z "${PROD_USER}" ] || [ -z "${PROD_PASSWORD}" ]; then
    echo "ERROR: Missing required environment variables: PROD_SERVER, PROD_USER, PROD_PASSWORD"
    exit 1
fi

# Detect PHP version
PHP_CMD="php8.2"
if ! command -v ${PHP_CMD} &>/dev/null; then
    for version in php8.3 php8.1 php7.1; do
        if command -v ${version} &>/dev/null; then
            PHP_CMD=${version}
            break
        fi
    done
fi

# SSH command using sshpass
SSH="sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER}"

# Rollback script
${SSH} << 'EOF'
set -e

echo "🔄 Executing rollback on production server..."

ROLLBACK_SUCCESS=0

# Function to rollback backend
rollback_backend() {
    echo "🔧 Rolling back backend..."
    
    if [ -d "${BACKEND_PATH}_old" ] && [ -f "${BACKEND_PATH}_old/index.php" ]; then
        echo "📋 Found valid previous backend version"
        
        # Stop services
        sudo systemctl stop php8.2-fpm || echo "PHP-FPM stop failed"
        
        # Backup current .env
        if [ -f "${BACKEND_PATH}/.env" ]; then
            cp "${BACKEND_PATH}/.env" "${BACKEND_PATH}/.env.backup"
        fi
        
        # Atomic rollback
        sudo rm -rf ${BACKEND_PATH}_rollback_temp || echo "No temp rollback dir"
        if [ -d "${BACKEND_PATH}" ]; then
            sudo mv ${BACKEND_PATH} ${BACKEND_PATH}_rollback_temp
        fi
        sudo mv ${BACKEND_PATH}_old ${BACKEND_PATH}
        
        # Restore .env
        if [ -f "${BACKEND_PATH}/.env.backup" ]; then
            mv "${BACKEND_PATH}/.env.backup" "${BACKEND_PATH}/.env"
        elif [ -f "${BACKEND_PATH}_rollback_temp/.env" ]; then
            cp "${BACKEND_PATH}_rollback_temp/.env" "${BACKEND_PATH}/.env"
        fi
        
        # Restore database if available
        LATEST_DB=$(ls -t ${BACKUP_PATH}/db_backup_*.sqlite 2>/dev/null | head -n 1)
        if [ -n "$LATEST_DB" ] && [ -s "$LATEST_DB" ]; then
            echo "📁 Restoring SQLite database: $LATEST_DB..."
            sudo cp $LATEST_DB ${DB_PATH}
            sudo chown ${APP_USER}:${APP_USER} ${DB_PATH}
            sudo chmod 664 ${DB_PATH}
        else
            echo "⚠️ No valid database backup found, skipping database restore"
        fi
        
        # Set permissions (Virtualmin handles group)
        sudo chown -R ${APP_USER}:${APP_USER} ${BACKEND_PATH}
        sudo chmod -R 755 ${BACKEND_PATH}
        sudo chmod -R 775 ${BACKEND_PATH}/storage ${BACKEND_PATH}/bootstrap/cache
        [ -f "${DB_PATH}" ] && sudo chmod 664 ${DB_PATH}
        
        # Restart services
        sudo systemctl start php8.2-fpm || echo "PHP-FPM start failed"
        sudo systemctl reload apache2 || echo "Web server reload failed"
        
        # Run Laravel commands
        cd ${BACKEND_PATH}
        ${PHP_CMD} artisan config:clear || echo "Config clear failed"
        ${PHP_CMD} artisan config:cache || echo "Config cache failed"
        ${PHP_CMD} artisan queue:restart || echo "Queue restart failed"
        ${PHP_CMD} artisan up || echo "Application up failed"
        
        # Test backend
        if ${PHP_CMD} artisan --version > /dev/null 2>&1; then
            echo "✅ Backend rollback successful"
            ROLLBACK_SUCCESS=1
            sudo rm -rf ${BACKEND_PATH}_rollback_temp || echo "Rollback temp cleanup failed"
        else
            echo "❌ Backend rollback verification failed"
            if [ -d "${BACKEND_PATH}_rollback_temp" ]; then
                sudo rm -rf ${BACKEND_PATH}
                sudo mv ${BACKEND_PATH}_rollback_temp ${BACKEND_PATH}
            fi
            echo "⚠️ Restored failed deployment, manual intervention required"
        fi
    else
        echo "❌ No valid previous backend version found for rollback"
    fi
}

# Function to rollback frontend
rollback_frontend() {
    echo "🎨 Rolling back frontend..."
    
    if [ -d "${FRONTEND_PATH}_old" ] && [ -f "${FRONTEND_PATH}_old/index.html" ]; then
        echo "📋 Found valid previous frontend version"
        
        # Atomic rollback
        sudo rm -rf ${FRONTEND_PATH}_rollback_temp || echo "No temp frontend rollback dir"
        if [ -d "${FRONTEND_PATH}" ]; then
            sudo mv ${FRONTEND_PATH} ${FRONTEND_PATH}_rollback_temp
        fi
        sudo mv ${FRONTEND_PATH}_old ${FRONTEND_PATH}
        
        # Set permissions
        sudo chown -R ${APP_USER}:${APP_USER} ${FRONTEND_PATH}
        sudo chmod -R 755 ${FRONTEND_PATH}
        
        # Test frontend
        if [ -f "${FRONTEND_PATH}/index.html" ]; then
            echo "✅ Frontend rollback successful"
            ROLLBACK_SUCCESS=1
            sudo rm -rf ${FRONTEND_PATH}_rollback_temp || echo "Frontend rollback temp cleanup failed"
        else
            echo "❌ Frontend rollback verification failed"
            if [ -d "${FRONTEND_PATH}_rollback_temp" ]; then
                sudo rm -rf ${FRONTEND_PATH}
                sudo mv ${FRONTEND_PATH}_rollback_temp ${FRONTEND_PATH}
                echo "⚠️ Restored failed frontend deployment, manual intervention required"
            fi
        fi
    else
        echo "❌ No valid previous frontend version found for rollback"
    fi
}

# Function to restore from backup
restore_from_backup() {
    echo "📋 Attempting to restore from backup..."
    
    if [ -d "${BACKUP_PATH}" ]; then
        LATEST_BACKUP=$(ls -t ${BACKUP_PATH}/backup_*.tar.gz 2>/dev/null | head -n 1)
        
        if [ -n "$LATEST_BACKUP" ] && [ -s "$LATEST_BACKUP" ]; then
            echo "📦 Found backup: $LATEST_BACKUP"
            
            RESTORE_DIR="/tmp/restore_$(date +%s)"
            mkdir -p $RESTORE_DIR
            
            # Extract backup
            cd $RESTORE_DIR
            tar -xzf $LATEST_BACKUP
            
            # Stop services
            sudo systemctl stop php8.2-fpm || echo "PHP-FPM stop failed"
            
            # Replace current installation
            sudo rm -rf ${BACKEND_PATH}_backup_restore || echo "No backup restore dir"
            if [ -d "${BACKEND_PATH}" ]; then
                sudo mv ${BACKEND_PATH} ${BACKEND_PATH}_backup_restore
            fi
            sudo mv $RESTORE_DIR/backend ${BACKEND_PATH}
            
            # Restore .env
            if [ -f "${BACKEND_PATH}_backup_restore/.env" ]; then
                cp "${BACKEND_PATH}_backup_restore/.env" "${BACKEND_PATH}/.env"
            fi
            
            # Restore database
            LATEST_DB=$(ls -t ${BACKUP_PATH}/db_backup_*.sqlite 2>/dev/null | head -n 1)
            if [ -n "$LATEST_DB" ] && [ -s "$LATEST_DB" ]; then
                echo "📁 Restoring SQLite database: $LATEST_DB..."
                sudo cp $LATEST_DB ${DB_PATH}
                sudo chown ${APP_USER}:${APP_USER} ${DB_PATH}
                sudo chmod 664 ${DB_PATH}
            fi
            
            # Set permissions
            sudo chown -R ${APP_USER}:${APP_USER} ${BACKEND_PATH}
            sudo chmod -R 755 ${BACKEND_PATH}
            sudo chmod -R 775 ${BACKEND_PATH}/storage ${BACKEND_PATH}/bootstrap/cache
            [ -f "${DB_PATH}" ] && sudo chmod 664 ${DB_PATH}
            
            # Restart services
            sudo systemctl start php8.2-fpm || echo "PHP-FPM start failed"
            sudo systemctl reload apache2 || echo "Web server reload failed"
            
            # Test restoration
            cd ${BACKEND_PATH}
            if ${PHP_CMD} artisan --version > /dev/null 2>&1; then
                echo "✅ Backup restoration successful"
                ROLLBACK_SUCCESS=1
                sudo rm -rf ${BACKEND_PATH}_backup_restore || echo "Backup restore cleanup failed"
            else
                echo "❌ Backup restoration failed"
                if [ -d "${BACKEND_PATH}_backup_restore" ]; then
                    sudo rm -rf ${BACKEND_PATH}
                    sudo mv ${BACKEND_PATH}_backup_restore ${BACKEND_PATH}
                fi
                echo "⚠️ Restored failed deployment, manual intervention required"
            fi
        else
            echo "❌ No valid backup files found"
        fi
    else
        echo "❌ Backup directory not found"
    fi
}

# Execute rollback strategy
echo "🎯 Starting rollback procedure..."
rollback_backend
rollback_frontend

if [ $ROLLBACK_SUCCESS -eq 0 ]; then
    echo "⚠️ Standard rollback failed, attempting backup restoration..."
    restore_from_backup
fi

if [ $ROLLBACK_SUCCESS -eq 1 ]; then
    echo "✅ Rollback completed successfully!"
    echo "📊 Current status:"
    echo "🏠 Backend: $(ls -la ${BACKEND_PATH} | head -1)"
    echo "🎨 Frontend: $(ls -la ${FRONTEND_PATH} | head -1)"
    
    cd ${BACKEND_PATH}
    if ${PHP_CMD} artisan --version > /dev/null 2>&1; then
        echo "✅ Application is responding after rollback"
    else
        echo "⚠️ Application may need manual intervention"
    fi
else
    echo "❌ Rollback failed! Manual intervention required."
    echo "🆘 Please check:"
    echo "   - Backend path: ${BACKEND_PATH}"
    echo "   - Frontend path: ${FRONTEND_PATH}"
    echo "   - Backup path: ${BACKUP_PATH}"
    exit 1
fi

EOF

echo "✅ Rollback script completed!"