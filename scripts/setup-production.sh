#!/bin/bash

# WebMail Laravel Production Setup Script
# Developed by I-Varse Technologies (https://ivarsetech.com)

set -e

echo "🚀 WebMail Laravel Production Setup"
echo "Developed by I-Varse Technologies"
echo "======================================"

# Configuration variables
APP_NAME="webmailaravel"
APP_USER="webmailaravel"
APP_PATH="/home/${APP_USER}/public_html"
BACKUP_PATH="/home/${APP_USER}/backups"
DB_NAME="${APP_NAME}_prod"
DB_USER="${APP_NAME}_user"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

print_step "1. Updating system packages..."
apt update && apt upgrade -y

print_step "2. Installing required packages..."
apt install -y \
    apache2 \
    mysql-server \
    php8.2 \
    php8.2-fpm \
    php8.2-mysql \
    php8.2-xml \
    php8.2-gd \
    php8.2-curl \
    php8.2-mbstring \
    php8.2-zip \
    php8.2-bcmath \
    composer \
    curl \
    git \
    unzip \
    sshpass

print_step "3. Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

print_step "4. Configuring Apache..."
a2enmod rewrite
a2enmod ssl
a2enmod headers

# Create Apache virtual host
cat > /etc/apache2/sites-available/${APP_NAME}.conf << EOF
<VirtualHost *:80>
    ServerName ${APP_NAME}.local
    DocumentRoot ${APP_PATH}/public
    
    <Directory ${APP_PATH}/public>
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>
    
    ErrorLog \${APACHE_LOG_DIR}/${APP_NAME}_error.log
    CustomLog \${APACHE_LOG_DIR}/${APP_NAME}_access.log combined
</VirtualHost>
EOF

a2ensite ${APP_NAME}.conf
a2dissite 000-default.conf
systemctl restart apache2

print_step "5. Setting up application directories..."
mkdir -p ${APP_PATH}
mkdir -p ${BACKUP_PATH}
mkdir -p /tmp/releases

# Create application user if not exists
if ! id "${APP_USER}" &>/dev/null; then
    useradd -m -s /bin/bash ${APP_USER}
    print_status "Created user: ${APP_USER}"
fi

chown -R www-data:www-data /home/${APP_USER}/
chmod -R 755 /home/${APP_USER}/

print_step "6. Configuring MySQL..."
mysql_secure_installation

print_warning "Please run the following MySQL commands manually:"
echo "mysql -u root -p"
echo "CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "CREATE USER '${DB_USER}'@'localhost' IDENTIFIED BY 'secure_password';"
echo "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
echo "FLUSH PRIVILEGES;"
echo "EXIT;"

print_step "7. Configuring PHP..."
# Configure PHP settings for production
sed -i 's/memory_limit = .*/memory_limit = 512M/' /etc/php/8.2/fpm/php.ini
sed -i 's/upload_max_filesize = .*/upload_max_filesize = 10M/' /etc/php/8.2/fpm/php.ini
sed -i 's/post_max_size = .*/post_max_size = 10M/' /etc/php/8.2/fpm/php.ini
sed -i 's/max_execution_time = .*/max_execution_time = 300/' /etc/php/8.2/fpm/php.ini

systemctl restart php8.2-fpm

print_step "8. Setting up SSL (Let's Encrypt)..."
apt install -y certbot python3-certbot-apache

print_warning "To enable SSL, run after setting up your domain:"
echo "certbot --apache -d yourdomain.com"

print_step "9. Configuring firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

print_step "10. Setting up log rotation..."
cat > /etc/logrotate.d/${APP_NAME} << EOF
${APP_PATH}/storage/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload php8.2-fpm
    endscript
}
EOF

print_step "11. Creating deployment helper scripts..."
mkdir -p /usr/local/bin

cat > /usr/local/bin/${APP_NAME}-deploy << 'EOF'
#!/bin/bash
# WebMail Laravel Deployment Helper
cd /home/webmailaravel/public_html
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

print_step "12. Setting up monitoring..."
apt install -y htop iotop

# Create simple monitoring script
cat > /usr/local/bin/${APP_NAME}-monitor << 'EOF'
#!/bin/bash
echo "=== WebMail Laravel System Status ==="
echo "Date: $(date)"
echo ""
echo "=== System Load ==="
uptime
echo ""
echo "=== Disk Usage ==="
df -h /home/webmailaravel/
echo ""
echo "=== Memory Usage ==="
free -h
echo ""
echo "=== PHP-FPM Status ==="
systemctl is-active php8.2-fpm
echo ""
echo "=== Apache Status ==="
systemctl is-active apache2
echo ""
echo "=== MySQL Status ==="
systemctl is-active mysql
echo ""
echo "=== Application Status ==="
if [ -f "/home/webmailaravel/public_html/artisan" ]; then
    cd /home/webmailaravel/public_html
    php artisan --version 2>/dev/null && echo "✅ Laravel is responding" || echo "❌ Laravel is not responding"
else
    echo "⚠️ Application not deployed yet"
fi
EOF

chmod +x /usr/local/bin/${APP_NAME}-monitor

print_step "13. Setting up automated backups..."
cat > /usr/local/bin/${APP_NAME}-backup << EOF
#!/bin/bash
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_PATH}/backup_\${TIMESTAMP}.tar.gz"

echo "Creating backup: \$BACKUP_FILE"

# Backup application files
if [ -d "${APP_PATH}" ]; then
    tar -czf \$BACKUP_FILE -C ${APP_PATH} .
    echo "✅ Application backup created"
else
    echo "❌ Application directory not found"
    exit 1
fi

# Backup database
mysqldump ${DB_NAME} > ${BACKUP_PATH}/db_backup_\${TIMESTAMP}.sql
gzip ${BACKUP_PATH}/db_backup_\${TIMESTAMP}.sql
echo "✅ Database backup created"

# Keep only last 10 backups
cd ${BACKUP_PATH}
ls -t backup_*.tar.gz | tail -n +11 | xargs -r rm
ls -t db_backup_*.sql.gz | tail -n +11 | xargs -r rm

echo "✅ Backup completed: \$BACKUP_FILE"
EOF

chmod +x /usr/local/bin/${APP_NAME}-backup

# Add to crontab for daily backups
crontab -l 2>/dev/null | { cat; echo "0 2 * * * /usr/local/bin/${APP_NAME}-backup"; } | crontab -

print_step "14. Final system configuration..."
systemctl enable apache2
systemctl enable mysql
systemctl enable php8.2-fpm

print_status "🎉 Production server setup completed!"
echo ""
print_status "Next steps:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Set up SSL certificate with: certbot --apache -d yourdomain.com"
echo "3. Configure the database with the MySQL commands shown above"
echo "4. Set up Jenkins with the credentials for this server"
echo "5. Run your first deployment!"
echo ""
print_status "Useful commands:"
echo "• Monitor system: ${APP_NAME}-monitor"
echo "• Create backup: ${APP_NAME}-backup"
echo "• Deploy application: ${APP_NAME}-deploy"
echo ""
print_status "Important paths:"
echo "• Application: ${APP_PATH}"
echo "• Backups: ${BACKUP_PATH}"
echo "• Logs: ${APP_PATH}/storage/logs/"
echo "• Apache config: /etc/apache2/sites-available/${APP_NAME}.conf"
echo ""
print_warning "Remember to:"
echo "• Change default passwords"
echo "• Configure firewall rules"
echo "• Set up monitoring alerts"
echo "• Test backup restoration"
echo ""
echo "🏢 Developed by I-Varse Technologies"
echo "🌐 https://ivarsetech.com"
