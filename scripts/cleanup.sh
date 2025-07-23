#!/bin/bash
set -e

echo "🧹 Starting cleanup process..."

# Cleanup script
sshpass -p "${PROD_PASSWORD}" ssh -o StrictHostKeyChecking=no \
    ${PROD_USER}@${PROD_SERVER} << 'EOF'
set -e

echo "🧹 Running cleanup on production server..."

# Function to safely remove old directories
safe_remove() {
    if [ -d "$1" ] && [ "$1" != "/" ] && [ "${#1}" -gt 10 ]; then
        echo "🗑️ Removing: $1"
        sudo rm -rf "$1"
    else
        echo "⚠️ Skipping unsafe removal: $1"
    fi
}

# Clean up old backup files (keep last 5)
echo "📋 Cleaning up old backups..."
if [ -d "${BACKUP_PATH}" ]; then
    cd ${BACKUP_PATH}
    # Keep only the 5 most recent backup files
    ls -t *.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
    echo "✅ Old backups cleaned up"
fi

# Remove old deployment directories if they exist
echo "📋 Cleaning up old deployment directories..."
safe_remove "${BACKEND_PATH}_old"
safe_remove "${FRONTEND_PATH}_old"

# Clean up temp files
echo "📋 Cleaning up temporary files..."
rm -rf /tmp/releases/${RELEASE_NAME}_* || echo "No temp release dirs to clean"
rm -f /tmp/${RELEASE_NAME}_*.tar.gz || echo "No temp archives to clean"

# Clean up Laravel caches and optimize
echo "📋 Optimizing Laravel application..."
cd ${BACKEND_PATH}

# Clear old cached files
php artisan cache:clear || echo "Cache clear failed"
php artisan config:clear || echo "Config clear failed"
php artisan route:clear || echo "Route clear failed"
php artisan view:clear || echo "View clear failed"

# Re-cache for production
php artisan config:cache || echo "Config cache failed"
php artisan route:cache || echo "Route cache failed"
php artisan view:cache || echo "View cache failed"

# Optimize Composer autoloader
composer dump-autoload --optimize || echo "Autoload optimization failed"

# Clean up old log files (keep last 7 days)
echo "📋 Cleaning up old log files..."
find storage/logs -name "*.log" -type f -mtime +7 -delete 2>/dev/null || echo "Log cleanup completed"

# Clean up session files (if file-based sessions)
echo "📋 Cleaning up old session files..."
find storage/framework/sessions -type f -mtime +1 -delete 2>/dev/null || echo "Session cleanup completed"

# Clean up cache files
echo "📋 Cleaning up cache files..."
find storage/framework/cache -type f -mtime +7 -delete 2>/dev/null || echo "Cache cleanup completed"

# Update file permissions
echo "📋 Updating file permissions..."
sudo chown -R yourdomain:yourdomain ${BACKEND_PATH}
sudo chown -R yourdomain:yourdomain ${FRONTEND_PATH}
sudo chmod -R 755 ${BACKEND_PATH}
sudo chmod -R 755 ${FRONTEND_PATH}
sudo chmod -R 775 ${BACKEND_PATH}/storage ${BACKEND_PATH}/bootstrap/cache

# Display disk usage after cleanup
echo "📊 Disk usage after cleanup:"
df -h ${BACKEND_PATH} | head -2

echo "✅ Cleanup completed successfully!"

EOF

echo "✅ Cleanup script completed!"