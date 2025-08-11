#!/bin/bash
set -e

echo "🔄 Starting rollback process with enhanced backup system..."

# Configuration variables
APP_NAME="Campaign Pro X"
APP_USER="campaignprox"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
FRONTEND_PATH="/home/campaignprox/public_html"
BACKEND_BACKUP_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html/backups"
FRONTEND_BACKUP_PATH="/home/campaignprox/backups"
DB_PATH="/home/campaignprox/domains/api.msz-pl.com/database.sqlite"

# Check if required environment variables are set
if [ -z "${PROD_SERVER}" ] || [ -z "${PROD_USER}" ] || [ -z "${PROD_PASSWORD}" ]; then
    echo "ERROR: Missing required environment variables: PROD_SERVER, PROD_USER, PROD_PASSWORD"
    exit 1
fi

# SSH command using sshpass
SSH="sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER}"

# Parse command line arguments
ROLLBACK_COMPONENT="both"  # Default to both
BACKUP_TIMESTAMP=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --component)
            ROLLBACK_COMPONENT="$2"
            shift 2
            ;;
        --timestamp)
            BACKUP_TIMESTAMP="$2"
            shift 2
            ;;
        --list)
            ROLLBACK_COMPONENT="list"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--component backend|frontend|both] [--timestamp YYYYMMDD_HHMMSS] [--list]"
            exit 1
            ;;
    esac
done

echo "🎯 Rollback target: ${ROLLBACK_COMPONENT}"
if [ -n "${BACKUP_TIMESTAMP}" ]; then
    echo "📅 Target timestamp: ${BACKUP_TIMESTAMP}"
fi

# Rollback functions
rollback_backend() {
    echo "🔧 Rolling back backend..."
    ${SSH} bash -s << EOF
        set -e
        BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
        BACKUP_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html/backups"
        DB_PATH="/home/campaignprox/domains/api.msz-pl.com/database.sqlite"
        
        # Determine which backup to use
        if [ -n "${BACKUP_TIMESTAMP}" ]; then
            BACKUP_FILE="\${BACKUP_PATH}/backend_backup_${BACKUP_TIMESTAMP}.tar.gz"
            DB_BACKUP="\${BACKUP_PATH}/database_backup_${BACKUP_TIMESTAMP}.sqlite"
        else
            # Find the most recent backup
            BACKUP_FILE=\$(ls -t "\${BACKUP_PATH}"/backend_backup_*.tar.gz 2>/dev/null | head -n1)
            if [ -n "\${BACKUP_FILE}" ]; then
                BACKUP_TIMESTAMP=\$(basename "\${BACKUP_FILE}" .tar.gz | sed 's/backend_backup_//')
                DB_BACKUP="\${BACKUP_PATH}/database_backup_\${BACKUP_TIMESTAMP}.sqlite"
            fi
        fi
        
        if [ -z "\${BACKUP_FILE}" ] || [ ! -f "\${BACKUP_FILE}" ]; then
            echo "❌ No backend backup found to restore from"
            exit 1
        fi
        
        echo "📦 Restoring backend from: \${BACKUP_FILE}"
        
        # Stop services
        systemctl stop php8.3-fpm 2>/dev/null || service php8.3-fpm stop 2>/dev/null || true
        pkill -f "artisan queue:work" 2>/dev/null || true
        
        # Backup current state before rollback
        if [ -d "\${BACKEND_PATH}" ]; then
            CURRENT_BACKUP="\${BACKUP_PATH}/pre_rollback_\$(date +%Y%m%d_%H%M%S).tar.gz"
            tar -czf "\${CURRENT_BACKUP}" -C "\$(dirname \${BACKEND_PATH})" "\$(basename \${BACKEND_PATH})" 2>/dev/null || true
            echo "📁 Current state backed up to: \${CURRENT_BACKUP}"
        fi
        
        # Remove current backend
        rm -rf "\${BACKEND_PATH}" || true
        
        # Restore from backup
        tar -xzf "\${BACKUP_FILE}" -C "\$(dirname \${BACKEND_PATH})" || {
            echo "ERROR: Failed to restore backend backup"
            exit 1
        }
        
        # Restore database if backup exists
        if [ -f "\${DB_BACKUP}" ]; then
            cp "\${DB_BACKUP}" "\${DB_PATH}" || {
                echo "ERROR: Failed to restore database backup"
                exit 1
            }
            echo "✅ Database restored from backup"
        fi
        
        # Fix permissions
        chown -R campaignprox:campaignprox "\${BACKEND_PATH}" || true
        chmod -R 755 "\${BACKEND_PATH}" || true
        chmod -R 775 "\${BACKEND_PATH}"/storage "\${BACKEND_PATH}"/bootstrap/cache 2>/dev/null || true
        chmod 664 "\${DB_PATH}" 2>/dev/null || true
        
        # Start services
        systemctl start php8.3-fpm 2>/dev/null || service php8.3-fpm start 2>/dev/null || true
        systemctl reload apache2 2>/dev/null || service apache2 reload 2>/dev/null || true
        
        # Restart queue worker
        cd "\${BACKEND_PATH}"
        nohup php8.3 artisan queue:work --sleep=3 --tries=3 --timeout=60 --memory=512 > /tmp/laravel-worker.log 2>&1 &
        
        echo "✅ Backend rollback completed successfully"
EOF
}

rollback_frontend() {
    echo "🎨 Rolling back frontend..."
    ${SSH} bash -s << EOF
        set -e
        FRONTEND_PATH="/home/campaignprox/public_html"
        BACKUP_PATH="/home/campaignprox/backups"
        
        # Determine which backup to use
        if [ -n "${BACKUP_TIMESTAMP}" ]; then
            BACKUP_FILE="\${BACKUP_PATH}/frontend_backup_${BACKUP_TIMESTAMP}.tar.gz"
        else
            # Find the most recent backup
            BACKUP_FILE=\$(ls -t "\${BACKUP_PATH}"/frontend_backup_*.tar.gz 2>/dev/null | head -n1)
        fi
        
        if [ -z "\${BACKUP_FILE}" ] || [ ! -f "\${BACKUP_FILE}" ]; then
            echo "❌ No frontend backup found to restore from"
            exit 1
        fi
        
        echo "📦 Restoring frontend from: \${BACKUP_FILE}"
        
        # Backup current state before rollback
        if [ -d "\${FRONTEND_PATH}" ] && [ "\$(ls -A \${FRONTEND_PATH} 2>/dev/null)" ]; then
            CURRENT_BACKUP="\${BACKUP_PATH}/pre_rollback_frontend_\$(date +%Y%m%d_%H%M%S).tar.gz"
            tar -czf "\${CURRENT_BACKUP}" -C "\$(dirname \${FRONTEND_PATH})" "\$(basename \${FRONTEND_PATH})" 2>/dev/null || true
            echo "📁 Current frontend state backed up to: \${CURRENT_BACKUP}"
        fi
        
        # Remove current frontend
        rm -rf "\${FRONTEND_PATH}"/* || true
        
        # Restore from backup
        tar -xzf "\${BACKUP_FILE}" -C "\$(dirname \${FRONTEND_PATH})" --strip-components=1 || {
            echo "ERROR: Failed to restore frontend backup"
            exit 1
        }
        
        # Fix permissions
        chown -R campaignprox:campaignprox "\${FRONTEND_PATH}" || true
        chmod -R 755 "\${FRONTEND_PATH}" || true
        
        # Restart Apache
        systemctl reload apache2 2>/dev/null || service apache2 reload 2>/dev/null || true
        
        echo "✅ Frontend rollback completed successfully"
EOF
}

list_available_backups() {
    echo "📋 Available backups:"
    ${SSH} bash -s << 'EOF'
        echo "Backend backups:"
        ls -la /home/campaignprox/domains/api.msz-pl.com/public_html/backups/backend_backup_*.tar.gz 2>/dev/null | awk '{print $9, $6, $7, $8}' || echo "No backend backups found"
        
        echo ""
        echo "Frontend backups:"
        ls -la /home/campaignprox/backups/frontend_backup_*.tar.gz 2>/dev/null | awk '{print $9, $6, $7, $8}' || echo "No frontend backups found"
EOF
}

# Main rollback logic
case "${ROLLBACK_COMPONENT}" in
    "list")
        list_available_backups
        exit 0
        ;;
    "backend")
        rollback_backend
        ;;
    "frontend")
        rollback_frontend
        ;;
    "both")
        rollback_backend
        rollback_frontend
        ;;
    *)
        echo "❌ Invalid component specified. Use: backend, frontend, both, or list"
        echo "Usage: $0 [--component backend|frontend|both] [--timestamp YYYYMMDD_HHMMSS] [--list]"
        exit 1
        ;;
esac

echo "✅ Rollback process completed successfully!"
