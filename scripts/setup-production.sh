# ... [Unchanged variables and initial checks] ...

# Install SQLite3 and PHP SQLite3 extension
print_step "3. Checking and installing SQLite3 and PHP SQLite3..."
if ! command -v sqlite3 &>/dev/null; then
    print_status "Installing sqlite3..."
    apt install -y sqlite3
else
    print_status "sqlite3 already installed"
fi
if ! dpkg -l | grep -q php8.3-sqlite3; then
    print_status "Installing php8.3-sqlite3..."
    apt install -y php8.3-sqlite3
else
    print_status "php8.3-sqlite3 already installed"
fi

# Install Supervisor
print_step "4. Installing and configuring Supervisor..."
if ! command -v supervisorctl &>/dev/null; then
    print_status "Installing supervisor..."
    apt install -y supervisor
else
    print_status "supervisor already installed"
fi
if [ ! -f "/etc/supervisor/conf.d/laravel-worker.conf" ]; then
    print_status "Creating Supervisor config..."
    cat > /etc/supervisor/conf.d/laravel-worker.conf << EOF
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=/usr/bin/php8.3 ${API_PATH}/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=${APP_USER}
numprocs=1
redirect_stderr=true
stdout_logfile=${API_PATH}/storage/logs/supervisor.log
EOF
    supervisorctl reread
    supervisorctl update
    supervisorctl start laravel-worker:*
    print_status "Supervisor config created"
else
    print_status "Supervisor config already exists"
fi

# Log rotation
print_step "5. Setting up log rotation..."
# ... [Unchanged] ...

# Deployment helper
print_step "6. Creating deployment helper..."
if [ ! -f "/usr/local/bin/${APP_NAME}-deploy" ]; then
    print_status "Creating deployment helper script..."
    cat > /usr/local/bin/${APP_NAME}-deploy << 'EOF'
#!/bin/bash
cd /home/campaignprox/domains/api.msz-pl.com/public_html
php8.3 artisan down
composer install --no-dev --optimize-autoloader
php8.3 artisan migrate --force
php8.3 artisan config:cache
php8.3 artisan route:cache
php8.3 artisan view:cache
php8.3 artisan storage:link
php8.3 artisan queue:restart
php8.3 artisan up
systemctl restart php8.3-fpm
echo "Deployment completed!"
EOF
    chmod +x /usr/local/bin/${APP_NAME}-deploy
    print_status "Deployment helper created"
else
    print_status "Deployment helper already exists"
fi

# ... [Monitoring script unchanged] ...

# Backup script
print_step "8. Setting up automated backups..."
# ... [Unchanged] ...

# Check and add cron jobs
print_step "9. Setting up cron jobs..."
if ! crontab -l 2>/dev/null | grep -q "/usr/local/bin/${APP_NAME}-backup"; then
    print_status "Adding daily backup cron job..."
    crontab -l 2>/dev/null | { cat; echo "0 2 * * * /usr/local/bin/${APP_NAME}-backup"; } | crontab -
    print_status "Backup cron job added"
else
    print_status "Backup cron job already exists"
fi
if ! crontab -l 2>/dev/null | grep -q "${API_PATH}/artisan schedule:run"; then
    print_status "Adding Laravel scheduler cron job..."
    crontab -l 2>/dev/null | { cat; echo "* * * * * /usr/bin/php8.3 ${API_PATH}/artisan schedule:run >> /dev/null 2>&1"; } | crontab -
    print_status "Scheduler cron job added"
else
    print_status "Scheduler cron job already exists"
fi

print_status "🎉 Helper setup completed!"
# ... [Unchanged status output] ...