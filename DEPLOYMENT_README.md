# WebMail Laravel CI/CD Deployment

**🏢 Developed by [I-Varse Technologies](https://ivarsetech.com)**

This repository contains a complete Jenkins CI/CD pipeline for deploying the WebMail Laravel application to a VPS with Webmin/Virtualmin using SSH authentication.

## 🚀 Features

### ✅ **Comprehensive CI/CD Pipeline**
- **Separate Frontend & Backend Deployment** - Parallel deployment for faster delivery
- **Zero-Downtime Deployment** - Atomic deployment with automatic rollback
- **Comprehensive Health Checks** - Ensures application functionality before traffic switch
- **Automatic Backups** - Creates backups before each deployment
- **Smart Rollback** - Automatic rollback on deployment failure

### ✅ **Production-Ready Features**
- **SSH Password Authentication** - Compatible with VPS password-based access
- **Webmin/Virtualmin Support** - Optimized for Webmin/Virtualmin environments
- **Security Hardening** - Proper file permissions and security headers
- **Performance Optimization** - Caching, compression, and optimization
- **Monitoring Integration** - Health checks and performance monitoring

### ✅ **Advanced Capabilities**
- **Multi-Environment Support** - Easy configuration for different environments
- **Artifact Management** - Build artifact storage and versioning
- **Notification Integration** - Slack/Email notifications for deployment status
- **Cleanup Automation** - Automatic cleanup of old deployments and logs

## 📁 Repository Structure

```
├── Jenkinsfile                     # Main CI/CD pipeline definition
├── scripts/                        # Deployment scripts
│   ├── deploy-backend.sh           # Backend deployment script
│   ├── deploy-frontend.sh          # Frontend deployment script
│   ├── health-check.sh             # Post-deployment health checks
│   ├── cleanup.sh                  # Cleanup and optimization
│   ├── rollback.sh                 # Emergency rollback procedures
│   └── setup-production.sh         # Production server setup
├── backend/
│   └── .env.production.example     # Production environment template
├── frontend/
│   └── package.json.scripts.example # Frontend build scripts
├── JENKINS_SETUP.md                # Detailed Jenkins setup guide
└── DEPLOYMENT_README.md             # This file
```

## 🛠️ Quick Start

### 1. **Production Server Setup**

Run the automated setup script on your VPS:

```bash
# Download and run the setup script
curl -O https://raw.githubusercontent.com/your-repo/webmailaravel/main/scripts/setup-production.sh
sudo chmod +x setup-production.sh
sudo ./setup-production.sh
```

This script will:
- Install all required dependencies (Apache, PHP, MySQL, Node.js)
- Configure web server and database
- Set up application directories
- Configure security and monitoring
- Create helpful management scripts

### 2. **Jenkins Configuration**

1. **Install Required Jenkins Plugins**:
   - Pipeline
   - Git
   - SSH Agent
   - Credentials Binding
   - Build Timeout

2. **Configure Credentials** in Jenkins:
   ```
   prod-server-host     → Your VPS IP/hostname
   prod-ssh-user        → Your VPS username
   prod-ssh-password    → Your VPS password
   prod-db-host         → Database host (usually localhost)
   prod-db-name         → Database name
   prod-db-user         → Database username
   prod-db-password     → Database password
   ```

3. **Create Pipeline Job**:
   - New Item → Pipeline
   - Pipeline script from SCM
   - Repository URL: Your Git repository
   - Script Path: `Jenkinsfile`

### 3. **Environment Configuration**

Configure your production environment:

```bash
# Copy and customize the environment file
cp backend/.env.production.example backend/.env.production

# Edit with your production settings
nano backend/.env.production
```

### 4. **Run Deployment**

Trigger the Jenkins pipeline:
- Manual: Click "Build Now" in Jenkins
- Automatic: Push to main branch (if webhook configured)

## 🔄 Deployment Process

### Pipeline Stages

1. **🔍 Preparation**
   - Clean workspace and checkout code
   - Create build information

2. **🧪 Backend Tests**
   - Install PHP dependencies
   - Run application tests
   - Validate Laravel configuration

3. **🎨 Frontend Build**
   - Install Node.js dependencies
   - Build production React assets
   - Optimize for production

4. **📦 Package Creation**
   - Create backend deployment package
   - Create frontend deployment package
   - Generate deployment archives

5. **🚀 Parallel Deployment**
   - **Backend**: Deploy Laravel application
   - **Frontend**: Deploy React build

6. **🔍 Health Checks**
   - Verify application functionality
   - Test database connectivity
   - Check all services

7. **🧹 Cleanup**
   - Remove old deployments
   - Optimize application cache
   - Clean temporary files

### Deployment Features

#### Zero-Downtime Deployment
```bash
# Atomic deployment process
1. Extract new version to temporary directory
2. Run migrations and optimizations
3. Atomic switch (mv old → new)
4. Health check verification
5. Cleanup old version
```

#### Automatic Rollback
```bash
# On deployment failure
1. Detect deployment failure
2. Switch back to previous version
3. Restore from backup if needed
4. Send failure notifications
5. Log rollback details
```

#### Security & Performance
```bash
# Security measures
- File permission management
- Environment variable protection
- Security headers configuration
- Access control validation

# Performance optimization
- Laravel optimization commands
- Frontend asset compression
- Database query optimization
- Cache management
```

## 📊 Monitoring & Maintenance

### Health Monitoring

The pipeline includes comprehensive health checks:

```bash
# Application health
✅ Laravel application response
✅ Database connectivity
✅ File permissions
✅ Storage accessibility

# System health
✅ Web server status
✅ PHP-FPM status
✅ Disk space monitoring
✅ Memory usage tracking
```

### Log Management

Monitor application logs:

```bash
# Application logs
tail -f /home/webmailaravel/public_html/storage/logs/laravel.log

# Web server logs
tail -f /var/log/apache2/webmail_error.log

# System monitoring
webmailaravel-monitor  # Custom monitoring script
```

### Backup Management

Automated backup system:

```bash
# Manual backup
webmailaravel-backup

# Restore from backup
cd /home/webmailaravel/backups
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz -C ../public_html/
```

## 🔧 Customization

### Environment Variables

Key production settings to configure:

```env
# Application
APP_URL=https://yourdomain.com
APP_ENV=production
APP_DEBUG=false

# Database
DB_HOST=localhost
DB_DATABASE=webmailaravel_prod
DB_USERNAME=webmail_user
DB_PASSWORD=secure_password

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-server
MAIL_FROM_ADDRESS=noreply@yourdomain.com

# PowerMTA Integration
POWERMTA_CSV_PATH=/var/log/powermta
POWERMTA_API_KEY=your_api_key

# Security
JWT_SECRET=your_jwt_secret_key
SESSION_SECURE_COOKIE=true
```

### Pipeline Customization

Modify the `Jenkinsfile` for specific needs:

```groovy
// Custom notification channels
post {
    success {
        slackSend(
            channel: '#deployments',
            message: "✅ WebMail Laravel deployed successfully!"
        )
    }
}

// Custom deployment environments
environment {
    STAGING_SERVER = credentials('staging-server-host')
    // Add staging-specific variables
}

// Custom testing stages
stage('🔒 Security Tests') {
    steps {
        sh 'php artisan security:check'
    }
}
```

### Directory Structure Customization

Modify paths in the environment variables:

```bash
# Default paths
BACKEND_PATH = '/home/webmailaravel/public_html'
FRONTEND_PATH = '/home/webmailaravel/public_html/public'
BACKUP_PATH = '/home/webmailaravel/backups'

# Custom paths (modify in Jenkinsfile)
BACKEND_PATH = '/var/www/html/webmail'
FRONTEND_PATH = '/var/www/html/webmail/public'
```

## 🆘 Troubleshooting

### Common Issues

#### 1. **Permission Errors**
```bash
# Fix file permissions
sudo chown -R www-data:www-data /home/webmailaravel/
sudo chmod -R 755 /home/webmailaravel/public_html/
sudo chmod -R 775 /home/webmailaravel/public_html/storage/
```

#### 2. **Database Connection Issues**
```bash
# Test database connection
mysql -h localhost -u webmail_user -p webmailaravel_prod

# Check Laravel database configuration
cd /home/webmailaravel/public_html
php artisan tinker
DB::connection()->getPdo();
```

#### 3. **Frontend Build Issues**
```bash
# Rebuild frontend manually
cd frontend/
npm ci
npm run build
ls -la dist/
```

#### 4. **Laravel Errors**
```bash
# Clear all caches
cd /home/webmailaravel/public_html
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### 5. **SSH Connection Issues**
```bash
# Test SSH connection from Jenkins
sshpass -p "password" ssh -o StrictHostKeyChecking=no user@server "echo 'Connection successful'"

# Verify credentials in Jenkins
# Manage Jenkins → Manage Credentials → Check credential IDs
```

### Emergency Procedures

#### Manual Rollback
```bash
# If automatic rollback fails
cd /home/webmailaravel/
sudo mv public_html public_html_failed
sudo mv public_html_old public_html
sudo systemctl restart php8.2-fpm apache2
```

#### Restore from Backup
```bash
# Find latest backup
ls -la /home/webmailaravel/backups/

# Restore application
cd /home/webmailaravel/
sudo tar -xzf backups/backup_YYYYMMDD_HHMMSS.tar.gz -C public_html/

# Restore database
gunzip < backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u webmail_user -p webmailaravel_prod
```

#### Check System Status
```bash
# Use the monitoring script
webmailaravel-monitor

# Check individual services
systemctl status apache2
systemctl status php8.2-fpm
systemctl status mysql

# Check application
cd /home/webmailaravel/public_html
php artisan --version
php artisan migrate:status
```

## 📞 Support & Services

### Professional Support

**I-Varse Technologies** offers professional deployment and maintenance services:

- **Custom CI/CD Pipeline Setup**
- **Production Environment Configuration**
- **24/7 Monitoring and Support**
- **Performance Optimization**
- **Security Hardening**
- **Disaster Recovery Planning**

### Contact Information

- **Website**: https://ivarsetech.com
- **Professional Services**: Available for enterprise deployments
- **Custom Development**: Available for specific requirements

### Documentation

- **Jenkins Setup Guide**: See `JENKINS_SETUP.md`
- **System Architecture**: See `SYSTEM_ARCHITECTURE_VISUALIZATIONS.md`
- **Application Features**: See main project documentation

---

## 🏆 Features Summary

This CI/CD pipeline provides:

✅ **Enterprise-Grade Deployment** - Production-ready with zero downtime  
✅ **Automatic Rollback** - Safe deployments with failure recovery  
✅ **Comprehensive Testing** - Backend and frontend validation  
✅ **Security Hardening** - Secure configurations and permissions  
✅ **Performance Optimization** - Caching and optimization  
✅ **Monitoring Integration** - Health checks and alerting  
✅ **Backup Management** - Automated backup and restore  
✅ **Professional Support** - Expert assistance available  

**🏢 Developed by I-Varse Technologies - Professional Web Solutions**

*This deployment pipeline is designed for production environments and includes enterprise-grade features for reliability, security, and performance.*
