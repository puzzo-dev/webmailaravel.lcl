#!/bin/bash

# Production Queue Worker Setup Script
# This script sets up Supervisor to automatically manage Laravel queue workers

set -e

BACKEND_DIR="/home/users/codepad/www/webmailaravel.lcl/backend"
SUPERVISOR_CONF="/etc/supervisor/conf.d/laravel-worker.conf"

echo "Setting up automatic queue workers for production..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "This script needs to run as root to configure Supervisor"
    echo "Run: sudo $0"
    exit 1
fi

# Install Supervisor if not present
if ! command -v supervisorctl &> /dev/null; then
    echo "Installing Supervisor..."
    apt-get update
    apt-get install -y supervisor
fi

# Copy supervisor configuration
echo "Installing Laravel queue worker configuration..."
cp /home/users/codepad/www/webmailaravel.lcl/deployment/supervisor-laravel-worker.conf "$SUPERVISOR_CONF"

# Update configuration paths if needed
sed -i "s|/home/users/codepad/www/webmailaravel.lcl/backend|$BACKEND_DIR|g" "$SUPERVISOR_CONF"

# Create log directory
mkdir -p /var/log
touch /var/log/laravel-campaigns-worker.log
touch /var/log/laravel-emails-worker.log
touch /var/log/laravel-default-worker.log
chown www-data:www-data /var/log/laravel-*-worker.log

# Reload supervisor configuration
echo "Reloading Supervisor configuration..."
supervisorctl reread
supervisorctl update

# Start the workers
echo "Starting Laravel queue workers..."
supervisorctl start laravel-worker-campaigns:*
supervisorctl start laravel-worker-emails:*
supervisorctl start laravel-worker-default:*

# Show status
echo "Queue worker status:"
supervisorctl status laravel-worker-*

echo ""
echo "✅ Production queue workers are now running automatically!"
echo "✅ Workers will restart automatically if they crash"
echo "✅ Workers will start automatically on server reboot"
echo ""
echo "To manage workers:"
echo "  sudo supervisorctl status laravel-worker-*"
echo "  sudo supervisorctl restart laravel-worker-*"
echo "  sudo supervisorctl stop laravel-worker-*"
echo ""
echo "Logs are in:"
echo "  /var/log/laravel-campaigns-worker.log"
echo "  /var/log/laravel-emails-worker.log"
echo "  /var/log/laravel-default-worker.log"
