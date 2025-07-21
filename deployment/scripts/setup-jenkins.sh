#!/bin/bash

# Jenkins Setup Script for WebMail Laravel CI/CD Pipeline
# Run this script on your Jenkins server to set up the pipeline

set -e

echo "🚀 Setting up Jenkins CI/CD Pipeline for WebMail Laravel"
echo "========================================================"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root"
    exit 1
fi

# Function to install package if not exists
install_if_missing() {
    if ! command -v $1 &> /dev/null; then
        echo "📦 Installing $1..."
        sudo apt-get update
        sudo apt-get install -y $2
    else
        echo "✅ $1 is already installed"
    fi
}

# Install required packages
echo "📦 Installing required packages..."
install_if_missing "sshpass" "sshpass"
install_if_missing "node" "nodejs npm"
install_if_missing "composer" "composer"
install_if_missing "php" "php php-cli php-mbstring php-xml php-zip"

# Install Jenkins plugins (requires Jenkins CLI)
echo "🔌 Installing Jenkins plugins..."
JENKINS_CLI="java -jar jenkins-cli.jar -s http://localhost:8080/"

# Download Jenkins CLI if not exists
if [ ! -f "jenkins-cli.jar" ]; then
    echo "📥 Downloading Jenkins CLI..."
    wget http://localhost:8080/jnlpJars/jenkins-cli.jar
fi

# Required plugins for the pipeline
PLUGINS=(
    "pipeline-stage-view"
    "workflow-aggregator"
    "git"
    "credentials"
    "ssh-agent"
    "build-timeout"
    "timestamper"
    "junit"
    "xunit"
    "htmlpublisher"
    "slack"
    "email-ext"
    "build-user-vars"
)

for plugin in "${PLUGINS[@]}"; do
    echo "🔌 Installing plugin: $plugin"
    $JENKINS_CLI install-plugin $plugin || echo "⚠️ Plugin $plugin might already be installed"
done

echo "🔄 Restarting Jenkins to load plugins..."
$JENKINS_CLI restart

# Wait for Jenkins to restart
echo "⏳ Waiting for Jenkins to restart..."
sleep 30

# Create credentials
echo "🔐 Setting up credentials..."
echo "Please manually add the following credentials in Jenkins UI:"
echo "Navigate to: Manage Jenkins > Manage Credentials > System > Global credentials"
echo ""
echo "Required Credentials:"
echo "1. prod-server-host (Secret text) - Your VPS IP address or domain"
echo "2. prod-ssh-user (Secret text) - SSH username for VPS"
echo "3. prod-ssh-password (Secret text) - SSH password for VPS"
echo "4. prod-db-host (Secret text) - Database host (usually localhost)"
echo "5. prod-db-name (Secret text) - Production database name"
echo "6. prod-db-user (Secret text) - Database username"
echo "7. prod-db-password (Secret text) - Database password"
echo ""

# Create sample credentials file for reference
cat > credentials-reference.md << 'EOF'
# Jenkins Credentials Reference

## Required Credentials (ID: Type - Description)

| Credential ID | Type | Description | Example Value |
|---------------|------|-------------|---------------|
| `prod-server-host` | Secret text | VPS IP or domain | `192.168.1.100` or `yourdomain.com` |
| `prod-ssh-user` | Secret text | SSH username | `webmailaravel` or `root` |
| `prod-ssh-password` | Secret text | SSH password | `your-secure-password` |
| `prod-db-host` | Secret text | Database host | `localhost` or `127.0.0.1` |
| `prod-db-name` | Secret text | Database name | `webmailaravel_prod` |
| `prod-db-user` | Secret text | Database username | `webmail_user` |
| `prod-db-password` | Secret text | Database password | `database-password` |

## Security Notes:
- Use strong passwords for all credentials
- Consider using SSH keys instead of passwords for better security
- Regularly rotate passwords
- Limit database user permissions to only required operations

## VPS Directory Structure:
```
/home/webmailaravel/
├── public_html/          # Backend Laravel application
│   └── public/          # Frontend React build files
├── backups/             # Deployment backups
└── logs/               # Application logs
```
EOF

echo "📄 Created credentials-reference.md for your reference"

# Create Jenkins job DSL
cat > jenkins-job-dsl.groovy << 'EOF'
// Jenkins Job DSL for WebMail Laravel Pipeline
pipelineJob('webmail-laravel-deploy') {
    description('CI/CD Pipeline for WebMail Laravel Application')
    
    definition {
        cpsScm {
            scm {
                git {
                    remote {
                        url('https://github.com/your-username/webmailaravel.lcl.git')
                        credentials('github-credentials') // Add your GitHub credentials
                    }
                    branch('*/main')
                }
            }
            scriptPath('Jenkinsfile')
        }
    }
    
    triggers {
        scm('H/5 * * * *') // Poll SCM every 5 minutes
        githubPush() // Trigger on GitHub push
    }
    
    properties {
        buildDiscarder {
            strategy {
                logRotator {
                    numToKeepStr('10')
                    artifactNumToKeepStr('5')
                }
            }
        }
    }
}

// Job for manual production deployment
pipelineJob('webmail-laravel-manual-deploy') {
    description('Manual deployment pipeline for WebMail Laravel')
    
    parameters {
        stringParam('GIT_BRANCH', 'main', 'Git branch to deploy')
        booleanParam('SKIP_TESTS', false, 'Skip running tests')
        booleanParam('FORCE_DEPLOY', false, 'Force deployment even if tests fail')
    }
    
    definition {
        cps {
            script(readFileFromWorkspace('Jenkinsfile'))
        }
    }
}
EOF

echo "📄 Created jenkins-job-dsl.groovy for job configuration"

# Create VPS preparation script
cat > prepare-vps.sh << 'EOF'
#!/bin/bash

# VPS Preparation Script for WebMail Laravel Deployment
# Run this script on your VPS to prepare it for deployments

set -e

echo "🖥️ Preparing VPS for WebMail Laravel deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt-get install -y \
    apache2 \
    mysql-server \
    php8.2 \
    php8.2-fpm \
    php8.2-mysql \
    php8.2-xml \
    php8.2-mbstring \
    php8.2-curl \
    php8.2-zip \
    php8.2-gd \
    php8.2-intl \
    composer \
    nodejs \
    npm \
    git \
    curl \
    wget \
    unzip

# Create application user and directories
echo "👤 Creating application user and directories..."
sudo useradd -m -s /bin/bash webmailaravel || echo "User already exists"
sudo mkdir -p /home/webmailaravel/{public_html,backups,logs}
sudo chown -R webmailaravel:webmailaravel /home/webmailaravel

# Configure Apache virtual host
echo "🌐 Configuring Apache virtual host..."
sudo tee /etc/apache2/sites-available/webmailaravel.conf > /dev/null << 'VHOST'
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /home/webmailaravel/public_html/public
    
    <Directory /home/webmailaravel/public_html/public>
        AllowOverride All
        Require all granted
        DirectoryIndex index.php index.html
    </Directory>
    
    # Laravel API routes
    Alias /api /home/webmailaravel/public_html/public/index.php
    
    # Logs
    ErrorLog /home/webmailaravel/logs/error.log
    CustomLog /home/webmailaravel/logs/access.log combined
</VirtualHost>
VHOST

# Enable site and modules
sudo a2ensite webmailaravel.conf
sudo a2enmod rewrite
sudo a2enmod php8.2
sudo systemctl restart apache2

# Configure MySQL
echo "🗄️ Configuring MySQL..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS webmailaravel_prod;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'webmail_user'@'localhost' IDENTIFIED BY 'change-this-password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON webmailaravel_prod.* TO 'webmail_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Set up SSL (Let's Encrypt) - Optional
echo "🔒 Setting up SSL certificate..."
sudo apt-get install -y certbot python3-certbot-apache
echo "Run: sudo certbot --apache -d your-domain.com to enable SSL"

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Set up log rotation
echo "📋 Setting up log rotation..."
sudo tee /etc/logrotate.d/webmailaravel > /dev/null << 'LOGROTATE'
/home/webmailaravel/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 webmailaravel webmailaravel
    postrotate
        sudo systemctl reload apache2
    endscript
}
LOGROTATE

# Create environment file template
sudo tee /home/webmailaravel/.env.production > /dev/null << 'ENVFILE'
APP_NAME="WebMail Laravel"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://your-domain.com

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=webmailaravel_prod
DB_USERNAME=webmail_user
DB_PASSWORD=change-this-password

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
ENVFILE

sudo chown webmailaravel:webmailaravel /home/webmailaravel/.env.production

echo "✅ VPS preparation completed!"
echo ""
echo "📝 Next steps:"
echo "1. Update /home/webmailaravel/.env.production with your actual values"
echo "2. Replace 'your-domain.com' in Apache config with your actual domain"
echo "3. Change the MySQL password from 'change-this-password'"
echo "4. Run 'sudo certbot --apache -d your-domain.com' for SSL"
echo "5. Configure your DNS to point to this VPS"
echo "6. Add SSH access for Jenkins (consider using SSH keys)"
EOF

chmod +x prepare-vps.sh

echo "✅ Jenkins setup completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Run 'bash prepare-vps.sh' on your VPS"
echo "2. Add credentials in Jenkins UI (see credentials-reference.md)"
echo "3. Create the pipeline job using jenkins-job-dsl.groovy"
echo "4. Update the GitHub repository URL in the job configuration"
echo "5. Test the pipeline with a manual deployment"
echo ""
echo "📚 Files created:"
echo "- credentials-reference.md (Credentials reference)"
echo "- jenkins-job-dsl.groovy (Job configuration)"
echo "- prepare-vps.sh (VPS preparation script)"
echo ""
echo "🚀 Your CI/CD pipeline is ready to deploy WebMail Laravel!"
