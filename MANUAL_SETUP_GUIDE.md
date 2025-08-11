# Manual Production Setup Guide

Since Virtualmin orchestration has been removed from the deployment pipeline, you'll need to manually configure the production server with the following setup:

## Prerequisites

1. **Domain Configuration**
   - Primary domain: `campaignprox.msz-pl.com` (frontend)
   - Subdomain: `api.msz-pl.com` (backend API)

2. **User Setup**
   ```bash
   # Create application user
   sudo useradd -m -s /bin/bash campaignprox
   sudo passwd campaignprox  # Set password: Koolup@1992
   ```

3. **Directory Structure**
   ```bash
   # Create required directories
   sudo mkdir -p /home/campaignprox/public_html
   sudo mkdir -p /home/campaignprox/domains/api.msz-pl.com/public_html
   sudo mkdir -p /home/campaignprox/domains/api.msz-pl.com/public_html/backups
   sudo mkdir -p /home/campaignprox/logs
   
   # Set ownership
   sudo chown -R campaignprox:campaignprox /home/campaignprox/
   sudo chmod -R 755 /home/campaignprox/domains /home/campaignprox/public_html
   sudo chmod -R 775 /home/campaignprox/logs
   ```

## Apache Configuration

1. **Enable Required Modules**
   ```bash
   sudo a2enmod rewrite
   sudo a2enmod ssl
   sudo systemctl restart apache2
   ```

2. **Virtual Host for Frontend (campaignprox.msz-pl.com)**
   Create `/etc/apache2/sites-available/campaignprox.conf`:
   ```apache
   <VirtualHost *:80>
       ServerName campaignprox.msz-pl.com
       DocumentRoot /home/campaignprox/public_html
       
       <Directory /home/campaignprox/public_html>
           AllowOverride All
           Require all granted
       </Directory>
       
       ErrorLog /home/campaignprox/logs/frontend_error.log
       CustomLog /home/campaignprox/logs/frontend_access.log combined
   </VirtualHost>
   ```

3. **Virtual Host for Backend API (api.msz-pl.com)**
   Create `/etc/apache2/sites-available/api.msz-pl.com.conf`:
   ```apache
   <VirtualHost *:80>
       ServerName api.msz-pl.com
       DocumentRoot /home/campaignprox/domains/api.msz-pl.com/public_html
       
       <Directory /home/campaignprox/domains/api.msz-pl.com/public_html>
           AllowOverride All
           Require all granted
       </Directory>
       
       ErrorLog /home/campaignprox/logs/api_error.log
       CustomLog /home/campaignprox/logs/api_access.log combined
   </VirtualHost>
   ```

4. **Enable Sites**
   ```bash
   sudo a2ensite campaignprox.conf
   sudo a2ensite api.msz-pl.com.conf
   sudo systemctl reload apache2
   ```

## PHP Configuration

1. **Install PHP 8.3 and Extensions**
   ```bash
   sudo apt update
   sudo apt install -y software-properties-common
   sudo add-apt-repository ppa:ondrej/php
   sudo apt update
   sudo apt install -y php8.3 php8.3-fpm php8.3-cli php8.3-common php8.3-mysql \
       php8.3-zip php8.3-gd php8.3-mbstring php8.3-curl php8.3-xml php8.3-bcmath \
       php8.3-sqlite3 php8.3-intl php8.3-tokenizer php8.3-json
   ```

2. **Configure PHP-FPM (if using)**
   ```bash
   sudo systemctl enable php8.3-fpm
   sudo systemctl start php8.3-fpm
   ```

## Composer Installation

```bash
# Install Composer globally
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
```

## Node.js Installation

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Additional Tools

```bash
# Install deployment dependencies
sudo apt install -y rsync sshpass git
```

## SSL Configuration (Optional)

For production, consider setting up SSL certificates:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-apache

# Generate certificates
sudo certbot --apache -d campaignprox.msz-pl.com -d api.msz-pl.com
```

## Database Setup

The Laravel application uses SQLite, so no additional database server setup is required. The database file will be created during deployment.

## Process Management

The deployment pipeline now uses `nohup` instead of supervisor for background processes. No additional setup is required.

## Permissions for Deployment User

Ensure the deployment user (`campaignprox`) has the necessary permissions:

```bash
# Add to www-data group if needed
sudo usermod -a -G www-data campaignprox

# Ensure the user can reload Apache (optional, for automated deployments)
# Add to sudoers if automatic service reloads are needed:
# campaignprox ALL=(ALL) NOPASSWD: /bin/systemctl reload apache2, /bin/systemctl restart apache2
```

## After Manual Setup

Once this manual setup is complete, the automated deployment pipeline (Jenkins) will work without requiring Virtualmin or sudo access, deploying applications to the configured directories.

## Notes

- This setup removes all Virtualmin dependencies
- The deployment scripts now work with standard file permissions
- Service reloads may need manual intervention or specific user permissions
- SSL and advanced configurations should be handled separately from the deployment pipeline
