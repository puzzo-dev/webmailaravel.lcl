#!/bin/bash
set -e

APP_NAME="Campaign Pro X"
APP_USER="campaignprox"
PRIMARY_DOMAIN="campaignprox.msz-pl.com"
SUB_DOMAIN="api.msz-pl.com"
FRONTEND_PATH="/home/${APP_USER}/public_html"
BACKEND_PATH="/home/${APP_USER}/domains/${SUB_DOMAIN}/public_html"
BACKUP_PATH="/home/${APP_USER}/domains/${SUB_DOMAIN}/public_html/backups"
DB_PATH="${BACKEND_PATH}/database/database.sqlite"
LOG_PATH="/home/${APP_USER}/logs"
PHP_VERSION="8.3"

print_status() { echo "✅ $1"; }
print_step() { echo "📌 $1"; }
print_error() { echo "❌ ERROR: $1"; exit 1; }

# Ensure script runs as root or with sudo
if [ "$(id -u)" != "0" ]; then
    print_error "This script must be run as root or with sudo"
fi

print_step "1. Checking Virtualmin installation..."
if ! command -v virtualmin &>/dev/null; then
    print_error "Virtualmin CLI not found. Please install Virtualmin first."
fi

print_step "2. Creating primary virtual server (${PRIMARY_DOMAIN})..."
if ! virtualmin list-domains | grep -q "${PRIMARY_DOMAIN}"; then
    print_status "Creating virtual server for ${PRIMARY_DOMAIN}..."
    virtualmin create-domain --domain ${PRIMARY_DOMAIN} --user ${APP_USER} --pass Koolup@1992 --web --dir --unix
    print_status "Virtual server ${PRIMARY_DOMAIN} created"
else
    print_status "${PRIMARY_DOMAIN} already exists"
fi

print_step "3. Creating sub-server (${SUB_DOMAIN})..."
if ! virtualmin list-domains | grep -q "${SUB_DOMAIN}"; then
    print_status "Creating sub-server for ${SUB_DOMAIN}..."
    virtualmin create-domain --domain ${SUB_DOMAIN} --parent ${PRIMARY_DOMAIN} --web --dir
    virtualmin unsub-domain --domain ${SUB_DOMAIN} --web --mail
    print_status "Sub-server ${SUB_DOMAIN} created"
else
    print_status "${SUB_DOMAIN} already exists"
fi

systemctl restart apache2
print_status "Apache restarted"

print_step "5. Setting up base directories and ownership..."
mkdir -p ${BACKUP_PATH}
mkdir -p ${LOG_PATH}
# Ensure subdomain directory has correct ownership from creation
mkdir -p "/home/${APP_USER}/domains/${SUB_DOMAIN}"
# Note: Application directories will be created during deployment
sudo chown -R ${APP_USER}:${APP_USER} "/home/${APP_USER}/domains" ${FRONTEND_PATH} ${BACKUP_PATH} ${LOG_PATH} 2>/dev/null || true
sudo chmod -R 755 "/home/${APP_USER}/domains" ${FRONTEND_PATH} ${BACKUP_PATH} ${LOG_PATH} 2>/dev/null || true
sudo chmod -R 775 ${LOG_PATH}
print_status "Base directories and ownership set up correctly"

print_step "6. Installing rsync..."
if ! command -v rsync &>/dev/null; then
    apt update
    apt install -y rsync
    print_status "rsync installed"
else
    print_status "rsync already installed"
fi

print_step "7. Installing PHP ${PHP_VERSION} and dependencies..."
if ! dpkg -l | grep -q "php${PHP_VERSION}-sqlite3"; then
    apt install -y php${PHP_VERSION} php${PHP_VERSION}-cli php${PHP_VERSION}-fpm php${PHP_VERSION}-sqlite3 php${PHP_VERSION}-mbstring php${PHP_VERSION}-xml php${PHP_VERSION}-zip php${PHP_VERSION}-curl
    print_status "PHP ${PHP_VERSION} and extensions installed"
else
    print_status "PHP ${PHP_VERSION} and extensions already installed"
fi

print_step "8. Installing SQLite..."
if ! command -v sqlite3 &>/dev/null; then
    apt install -y sqlite3
    print_status "SQLite installed"
else
    print_status "SQLite already installed"
fi

print_step "9. Installing and configuring Supervisor..."
if ! command -v supervisorctl &>/dev/null; then
    apt install -y supervisor
    
    # Ensure log directory exists
    mkdir -p ${LOG_PATH}
    chown ${APP_USER}:${APP_USER} ${LOG_PATH}
    
    cat > /etc/supervisor/conf.d/laravel-worker.conf <<EOC
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php${PHP_VERSION} ${BACKEND_PATH}/artisan queue:work --sleep=3 --tries=3 --timeout=60
autostart=true
autorestart=true
user=${APP_USER}
numprocs=1
redirect_stderr=true
stdout_logfile=${LOG_PATH}/laravel-worker.log
stopwaitsecs=60
EOC
    
    systemctl enable supervisor
    systemctl start supervisor
    supervisorctl reread
    supervisorctl update
    supervisorctl start laravel-worker:*
    print_status "Supervisor installed and configured"
else
    # Update existing configuration if paths changed
    if [ -f /etc/supervisor/conf.d/laravel-worker.conf ]; then
        # Ensure log directory exists
        mkdir -p ${LOG_PATH}
        chown ${APP_USER}:${APP_USER} ${LOG_PATH}
        
        # Update configuration with current paths
        cat > /etc/supervisor/conf.d/laravel-worker.conf <<EOC
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php${PHP_VERSION} ${BACKEND_PATH}/artisan queue:work --sleep=3 --tries=3 --timeout=60
autostart=true
autorestart=true
user=${APP_USER}
numprocs=1
redirect_stderr=true
stdout_logfile=${LOG_PATH}/laravel-worker.log
stopwaitsecs=60
EOC
        
        supervisorctl reread
        supervisorctl update
        print_status "Supervisor configuration updated"
    fi
    print_status "Supervisor already configured"
fi

print_step "10. Setting up cron jobs with Virtualmin CLI..."
CRON_FILE="/tmp/cron-${APP_USER}"
if ! virtualmin list-crons --user ${APP_USER} | grep -q "Campaign-Pro-X-backup"; then
    cat > ${CRON_FILE} <<EOC
# Daily backup for ${APP_NAME}
0 2 * * * /bin/bash /home/${APP_USER}/scripts/Campaign-Pro-X-backup
# Laravel scheduler
* * * * * php${PHP_VERSION} ${BACKEND_PATH}/artisan schedule:run >> ${LOG_PATH}/scheduler.log 2>&1
EOC
    virtualmin modify-cron --user ${APP_USER} --file ${CRON_FILE}
    rm ${CRON_FILE}
    print_status "Cron jobs set up for backups and scheduler"
else
    print_status "Cron jobs already set up"
fi

print_step "11. Setting up backup script..."
mkdir -p /home/${APP_USER}/scripts
cat > /home/${APP_USER}/scripts/Campaign-Pro-X-backup <<EOC
#!/bin/bash
BACKUP_DIR="${BACKUP_PATH}"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
tar -czf \${BACKUP_DIR}/backup_\${TIMESTAMP}.tar.gz -C ${BACKEND_PATH} .
[ -f "${DB_PATH}" ] && cp ${DB_PATH} \${BACKUP_DIR}/db_backup_\${TIMESTAMP}.sqlite
find \${BACKUP_DIR} -name "backup_*.tar.gz" -mtime +10 -delete
find \${BACKUP_DIR} -name "db_backup_*.sqlite" -mtime +10 -delete
EOC
chown ${APP_USER}:${APP_USER} /home/${APP_USER}/scripts/Campaign-Pro-X-backup
chmod 755 /home/${APP_USER}/scripts/Campaign-Pro-X-backup
print_status "Backup script created"

print_step "12. Setting up monitoring script..."
cat > /home/${APP_USER}/scripts/Campaign-Pro-X-monitor <<EOC
#!/bin/bash
echo "System Load:"
uptime
echo "Apache Status:"
systemctl status apache2 | head -n 3
echo "PHP-FPM Status:"
systemctl status php${PHP_VERSION}-fpm | head -n 3
echo "Supervisor Status:"
supervisorctl status
echo "Disk Usage:"
df -h ${BACKEND_PATH}
EOC
chown ${APP_USER}:${APP_USER} /home/${APP_USER}/scripts/Campaign-Pro-X-monitor
chmod 755 /home/${APP_USER}/scripts/Campaign-Pro-X-monitor
print_status "Monitoring script created"

print_step "13. Configuring log rotation..."
cat > /etc/logrotate.d/Campaign-Pro-X <<EOC
${BACKEND_PATH}/storage/logs/*.log ${LOG_PATH}/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 640 ${APP_USER} ${APP_USER}
    postrotate
        systemctl reload php${PHP_VERSION}-fpm > /dev/null 2>&1 || true
        systemctl reload apache2 > /dev/null 2>&1 || true
    endscript
}
EOC
print_status "Log rotation configured for Laravel and custom logs"

print_status "✅ Setup completed successfully!"