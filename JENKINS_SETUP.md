# Jenkins CI/CD Setup for WebMail Laravel

**Developed by [I-Varse Technologies](https://ivarsetech.com)**

This guide provides comprehensive instructions for setting up Jenkins CI/CD pipeline to deploy the WebMail Laravel application to a VPS with Webmin/Virtualmin.

## 📋 Prerequisites

### Production Server Requirements
- VPS with Webmin/Virtualmin installed
- SSH access with username/password authentication
- Web server (Apache/Nginx) running
- PHP 8.2 or higher with PHP-FPM
- MySQL/MariaDB database
- Composer installed
- Node.js and npm installed (for frontend builds)

### Jenkins Server Requirements
- Jenkins server with necessary plugins
- SSH access to production server
- Git repository access
- Sufficient storage for build artifacts

## 🔧 Jenkins Configuration

### 1. Required Jenkins Plugins

Install the following plugins in Jenkins:

```bash
# Core plugins
- Pipeline
- Git
- SSH Agent
- Credentials Binding
- Build Timeout
- Timestamper
- Workspace Cleanup

# Additional plugins
- Blue Ocean (for better UI)
- Slack Notification (optional)
- Email Extension (optional)
- Build Monitor View (optional)
```

### 2. Configure Jenkins Credentials

Navigate to **Manage Jenkins > Manage Credentials** and add:

#### Production Server Credentials
- **Type**: Username with password
- **ID**: `prod-ssh-user`
- **Username**: Your production server username
- **Password**: Your production server password

- **Type**: Secret text
- **ID**: `prod-server-host`
- **Secret**: Your production server IP/hostname

#### Database Credentials
- **Type**: Secret text
- **ID**: `prod-db-host`
- **Secret**: Database host (usually localhost)

- **Type**: Secret text
- **ID**: `prod-db-name`
- **Secret**: Production database name

- **Type**: Username with password
- **ID**: `prod-db-user`
- **Username**: Database username
- **Password**: Database password

#### Optional Notification Credentials
- **Type**: Secret text
- **ID**: `slack-webhook-url`
- **Secret**: Your Slack webhook URL (if using Slack notifications)

### 3. Create Jenkins Pipeline

1. Navigate to **New Item** in Jenkins
2. Enter item name: `webmail-laravel-deploy`
3. Select **Pipeline** and click OK
4. In the configuration:
   - **Description**: "WebMail Laravel Application Deployment Pipeline"
   - **Build Triggers**: Configure as needed (GitHub webhook, schedule, etc.)
   - **Pipeline**: 
     - **Definition**: Pipeline script from SCM
     - **SCM**: Git
     - **Repository URL**: Your Git repository URL
     - **Script Path**: `Jenkinsfile`

## 🏗️ Production Server Setup

### 1. Directory Structure

Create the following directory structure on your production server:

```bash
# Create application directories
sudo mkdir -p /home/webmailaravel/public_html
sudo mkdir -p /home/webmailaravel/backups
sudo mkdir -p /tmp/releases

# Set ownership
sudo chown -R www-data:www-data /home/webmailaravel/
sudo chmod -R 755 /home/webmailaravel/
```

### 2. Database Setup

Create the production database:

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE webmailaravel_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'webmail_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON webmailaravel_prod.* TO 'webmail_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Web Server Configuration

#### Apache Configuration

Create virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /home/webmailaravel/public_html/public
    
    <Directory /home/webmailaravel/public_html/public>
        AllowOverride All
        Require all granted
        
        # Handle Laravel routing
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>
    
    # Backend API routing
    Alias /api /home/webmailaravel/public_html/public
    
    ErrorLog ${APACHE_LOG_DIR}/webmail_error.log
    CustomLog ${APACHE_LOG_DIR}/webmail_access.log combined
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /home/webmailaravel/public_html/public
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    <Directory /home/webmailaravel/public_html/public>
        AllowOverride All
        Require all granted
    </Directory>
    
    Alias /api /home/webmailaravel/public_html/public
    
    ErrorLog ${APACHE_LOG_DIR}/webmail_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/webmail_ssl_access.log combined
</VirtualHost>
```

#### Nginx Configuration (Alternative)

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name yourdomain.com;
    root /home/webmailaravel/public_html/public;
    index index.php index.html;

    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend routing (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API routing
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP processing
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    # Hide sensitive files
    location ~ /\.(env|git) {
        deny all;
    }
}
```

### 4. PHP Configuration

Ensure PHP is properly configured:

```ini
# /etc/php/8.2/fpm/php.ini
memory_limit = 512M
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
max_input_time = 300

# Enable required extensions
extension=mbstring
extension=xml
extension=gd
extension=curl
extension=zip
extension=mysql
```

### 5. System Dependencies

Install required system packages:

```bash
# Install sshpass for Jenkins
sudo apt update
sudo apt install -y sshpass

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
composer --version
node --version
npm --version
```

## 🚀 Deployment Process

### 1. Pipeline Stages

The Jenkins pipeline consists of the following stages:

1. **🔍 Preparation**
   - Clean workspace
   - Checkout code
   - Create build info

2. **🧪 Backend Tests**
   - Install PHP dependencies
   - Run Laravel tests
   - Validate configuration

3. **🎨 Frontend Tests & Build**
   - Install Node.js dependencies
   - Run frontend tests
   - Build production assets

4. **📦 Create Deployment Package**
   - Package backend code
   - Package frontend assets
   - Create deployment archives

5. **🚀 Deploy to Production** (Parallel)
   - Deploy backend (Laravel app)
   - Deploy frontend (React build)

6. **🔍 Health Checks**
   - Verify application functionality
   - Test database connectivity
   - Check web server status

7. **🧹 Cleanup**
   - Remove old deployments
   - Optimize application
   - Clean temporary files

### 2. Deployment Features

#### Zero-Downtime Deployment
- Atomic deployment using symbolic links
- Automatic rollback on failure
- Health checks before traffic switching

#### Backup Strategy
- Automatic backup before deployment
- Configurable retention period
- Quick restore capability

#### Security
- Environment-specific configurations
- Secure credential handling
- File permission management

#### Monitoring
- Comprehensive health checks
- Performance monitoring
- Error logging and alerts

## 🔧 Configuration Files

### Environment Configuration

Copy and customize the production environment file:

```bash
# Backend configuration
cp backend/.env.production.example backend/.env.production

# Edit the file with your production settings
nano backend/.env.production
```

Key settings to configure:
- Database credentials
- Application URL
- Mail settings
- PowerMTA configuration
- JWT secrets
- API keys

### Frontend Configuration

The frontend build process will automatically use the correct API endpoints based on the build environment.

## 🔍 Monitoring and Maintenance

### 1. Health Checks

The pipeline includes comprehensive health checks:
- Laravel application status
- Database connectivity
- Web server functionality
- File permissions
- Disk space monitoring

### 2. Logging

Monitor the following logs:
- Jenkins build logs
- Laravel application logs (`storage/logs/laravel.log`)
- Web server logs (Apache/Nginx)
- PHP-FPM logs
- System logs (`/var/log/syslog`)

### 3. Performance Monitoring

Monitor key metrics:
- Response times
- Memory usage
- CPU utilization
- Database performance
- Queue processing

### 4. Backup Verification

Regularly verify backup integrity:
```bash
# Test backup restoration
cd /home/webmailaravel/backups
tar -tzf latest_backup.tar.gz | head -10
```

## 🆘 Troubleshooting

### Common Issues

#### 1. Permission Errors
```bash
# Fix file permissions
sudo chown -R www-data:www-data /home/webmailaravel/
sudo chmod -R 755 /home/webmailaravel/public_html
sudo chmod -R 775 /home/webmailaravel/public_html/storage
```

#### 2. Database Connection Issues
```bash
# Test database connection
mysql -h localhost -u webmail_user -p webmailaravel_prod
```

#### 3. Laravel Errors
```bash
# Clear and rebuild caches
cd /home/webmailaravel/public_html
php artisan config:clear
php artisan cache:clear
php artisan config:cache
```

#### 4. Frontend Issues
```bash
# Verify frontend files
ls -la /home/webmailaravel/public_html/public/
curl -I http://localhost/
```

### Emergency Rollback

If automatic rollback fails, manual rollback:

```bash
# Backend rollback
cd /home/webmailaravel
sudo mv public_html public_html_failed
sudo mv public_html_old public_html
sudo systemctl restart php8.2-fpm
sudo systemctl reload apache2

# Restore from backup if needed
cd backups
sudo tar -xzf latest_backup.tar.gz -C ../public_html/
```

## 📞 Support

For technical support and customization:

**I-Varse Technologies**
- Website: https://ivarsetech.com
- Professional deployment and maintenance services available

---

*This Jenkins CI/CD pipeline provides enterprise-grade deployment capabilities for the WebMail Laravel application with comprehensive error handling, monitoring, and rollback capabilities.*
