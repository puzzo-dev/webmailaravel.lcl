#!/bin/bash

# Minimal WebMail Laravel Helper Setup for Virtualmin VPS
# Checks for existing directories, permissions, packages, log rotation, scripts, and cron job
# Configures for SQLite3 instead of MySQL
# Assumes Virtualmin has configured Apache and virtual hosts

set -e

echo "🚀 WebMail Laravel Helper Setup (SQLite3)"
echo "======================================"

# Configuration variables
APP_NAME="CampaignProX"
APP_USER="campaignprox"
APP_PATH="/home/campaignprox/public_html"
API_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
BACKUP_PATH="/home/campaignprox/domains/api.msz-pl.com/backups"
LOG_PATH="/home/campaignprox/logs"
DB_PATH="${API_PATH}/database/database.sqlite"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Check root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Verify user
print_step "1. Verifying Virtualmin user..."
if ! id "${APP_USER}" &>/dev/null; then
    print_error "Virtualmin user ${APP_USER} does not exist."
    exit 1
fi

# Create and configure directories if they don't exist
print_step "2. Checking and configuring directories..."
for dir in "${APP_PATH}" "${API_PATH}" "${BACKUP_PATH}" "${LOG_PATH}" "/tmp/releases"; do
    if [ ! -d "${dir}" ]; then
        print_status "Creating directory: ${dir}"
        mkdir -p "${dir}"
    else
        print_status "Directory exists: ${dir}"
    fi
done

# Create database directory if it doesn't exist
DB_DIR=$(dirname "${DB_PATH}")
if [ ! -d "${DB_DIR}" ]; then
    print_status "Creating database directory: ${DB_DIR}"
    mkdir -p "${DB_DIR}"
fi

# Set ownership and permissions
print_status "Setting ownership to ${APP_USER}:${APP_USER}"
chown -R campaignprox:campaignprox /home/campaignprox/

# Check and set permissions
if [ "$(stat -c %a "${APP_PATH}")" != "755" ]; then
    print_status "Setting permissions 755 for ${APP_PATH}"
    chmod -R 755 "${APP_PATH}"
else
    print_status "Permissions correct for ${APP_PATH}"
fi
if [ "$(stat -c %a "${BACKUP_PATH}")" != "755" ]; then
    print_status "Setting permissions 755 for ${BACKUP_PATH}"
    chmod -R 755 "${BACKUP_PATH}"
else
    print_status "Permissions correct for ${BACKUP_PATH}"
fi
if [ "$(stat -c %a "${LOG_PATH}")" != "755" ]; then
    print_status "Setting permissions 755 for ${LOG_PATH}"
    chmod -R 755 "${LOG_PATH}"
else
    print_status "Permissions correct for ${LOG_PATH}"
fi
if [ "$(stat -c %a "${API_PATH}")" != "775" ]; then
    print_status "Setting permissions 775 for ${API_PATH}"
    chmod -R 775 "${API_PATH}"
else
    print_status "Permissions correct for ${API_PATH}"
fi
if [ -f "${DB_PATH}" ] && [ "$(stat -c %a "${DB_PATH}")" != "664" ]; then
    print_status "Setting permissions 664 for ${DB_PATH}"
    chmod 664 "${DB_PATH}"
elif [ -f "${DB_PATH}" ]; then
    print_status "Permissions correct for ${DB_PATH}"
fi

# Install SQLite3 and PHP SQLite3 extension
print_step "3. Checking and installing SQLite3 and PHP SQLite3..."
if ! command -v sqlite3 &>/dev/null; then
    print_status "Installing sqlite3..."
    apt install -y sqlite3
else
    print_status "sqlite3 already installed"
fi
if ! dpkg -l | grep -q php8.2-sqlite3; then
    print_status "Installing php8.2-sqlite3..."
    apt install -y php8.2-sqlite3
else
    print_status "php8.2-sqlite3 already installed"
fi

# Log rotation
print_step "4. Setting up log rotation..."
if [ ! -f "/etc/logrotate.d/${APP_NAME}" ]; then
    print_status "Creating log rotation config..."
    cat > /etc/logrotate.d/${APP_NAME} << EOF
${API_PATH}/storage/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 campaignprox campaignprox
    postrotate
        systemctl reload php8.2-fpm
    endscript
}
${LOG_PATH}/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 campaignprox campaignprox
    postrotate
        systemctl reload apache2
    endscript
}
EOF
    print_status "Log rotation config created"
else
    print_status "Log rotation config already exists"
fi

# Deployment helper
print_step "5. Creating deployment helper..."
if [ ! -f "/usr/local/bin/${APP_NAME}-deploy" ]; then
    print_status "Creating deployment helper script..."
    cat > /usr/local/bin/${APP_NAME}-deploy << 'EOF'
#!/bin/bash
cd /home/campaignprox/domains/api.msz-pl.com/public_html
php artisan down
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
php artisan up
systemctl restart php8.2-fpm
echo "Deployment completed!"
EOF
    chmod +x /usr/local/bin/${APP_NAME}-deploy
    print_status "Deployment helper created"
else
    print_status "Deployment helper already exists"
fi

# Monitoring script
print_step "6. Setting up monitoring..."
if ! command -v htop &>/dev/null || ! command -v iotop &>/dev/null; then
    print_status "Installing htop and iotop..."
    apt install -y htop iotop
else
    print_status "htop and iotop already installed"
fi
if [ ! -f "/usr/local/bin/${APP_NAME}-monitor" ]; then
    print_status "Creating monitoring script..."
    cat > /usr/local/bin/${APP_NAME}-monitor << 'EOF'
#!/bin/bash
echo "=== WebMail Laravel System Status ==="
echo "Date: $(date)"
echo "=== System Load ==="
uptime
echo "=== Disk Usage ==="
df -h /home/campaignprox/
echo "=== Memory Usage ==="
free -h
echo "=== PHP-FPM Status ==="
systemctl is-active php8.2-fpm
echo "=== Apache Status ==="
systemctl is-active apache2
echo "=== SQLite3 Database ==="
if [ -f "/home/campaignprox/domains/api.msz-pl.com/public_html/database/database.sqlite" ]; then
    echo "✅ SQLite3 database exists"
else
    echo "⚠️ SQLite3 database not found"
fi
echo "=== Application Status ==="
if [ -f "/home/campaignprox/domains/api.msz-pl.com/public_html/artisan" ]; then
    cd "/home/campaignprox/domains/api.msz-pl.com/public_html
    php artisan --version 2>/dev/null && echo "✅ Laravel is responding" || echo "❌ Laravel is not responding"
else
    echo "⚠️ Application not deployed yet"
fi
EOF
    chmod +x /usr/local/bin/${APP_NAME}-monitor
    print_status "Monitoring script created"
else
    print_status "Monitoring script already exists"
fi

# Backup script
print_step "7. Setting up automated backups..."
if [ ! -f "/usr/local/bin/${APP_NAME}-backup" ]; then
    print_status "Creating backup script..."
    cat > /usr/local/bin/${APP_NAME}-backup << EOF
#!/bin/bash
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_PATH}/backup_\${TIMESTAMP}.tar.gz"
DB_BACKUP="${BACKUP_PATH}/db_backup_\${TIMESTAMP}.sqlite"
echo "Creating backup: \$BACKUP_FILE"
if [ -d "${APP_PATH}" ]; then
    tar -czf \$BACKUP_FILE -C ${APP_PATH} .
    echo "✅ Application backup created"
else
    echo "❌ Application directory not found"
    exit 1
fi
if [ -f "${DB_PATH}" ]; then
    cp ${DB_PATH} \$DB_BACKUP
    gzip \$DB_BACKUP
    echo "✅ SQLite3 database backup created"
else
    echo "⚠️ SQLite3 database not found, skipping database backup"
fi
cd ${BACKUP_PATH}
ls -t backup_*.tar.gz | tail -n +11 | xargs -r rm
ls -t db_backup_*.sqlite.gz | tail -n +11 | xargs -r rm
echo "✅ Backup completed: \$BACKUP_FILE"
EOF
    chmod +x /usr/local/bin/${APP_NAME}-backup
    print_status "Backup script created"
else
    print_status "Backup script already exists"
fi

# Check and add cron job
print_step "8. Setting up backup cron job..."
if ! crontab -l 2>/dev/null | grep -q "/usr/local/bin/${APP_NAME}-backup"; then
    print_status "Adding daily backup cron job..."
    crontab -l 2>/dev/null | { cat; echo "0 2 * * * /usr/local/bin/${APP_NAME}-backup"; } | crontab -
    print_status "Cron job added"
else
    print_status "Backup cron job already exists"
fi

print_status "🎉 Helper setup completed!"
print_status "Commands:"
echo "• Monitor: ${APP_NAME}-monitor"
echo "• Backup: ${APP_NAME}-backup"
echo "• Deploy: ${APP_NAME}-deploy"
print_status "Paths:"
echo "• App: ${APP_PATH}"
echo "• API: ${API_PATH}"
echo "• Backups: ${BACKUP_PATH}"
echo "• Logs: ${LOG_PATH}"
echo "• SQLite3 DB: ${DB_PATH}"