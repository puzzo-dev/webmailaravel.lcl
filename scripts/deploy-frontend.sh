#!/bin/bash
set -e

echo "🎨 Starting frontend deployment..."

# Configuration variables
APP_NAME="Campaign Pro X"
APP_USER="campaignprox"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
FRONTEND_PATH="/home/campaignprox/public_html"
RELEASE_NAME="${RELEASE_NAME}"
RELEASE_DIR="deployment/frontend"

# Check if required environment variables are set
if [ -z "${PROD_SERVER}" ] || [ -z "${PROD_USER}" ] || [ -z "${PROD_PASSWORD}" ] || [ -z "${RELEASE_NAME}" ]; then
    echo "ERROR: Missing required environment variables: PROD_SERVER, PROD_USER, PROD_PASSWORD, RELEASE_NAME"
    exit 1
fi

# Check if release directory exists
if [ ! -d "${RELEASE_DIR}" ]; then
    echo "ERROR: Release directory ${RELEASE_DIR} not found"
    exit 1
fi

# SSH command using sshpass
SSH="sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER}"
RSYNC="sshpass -p ${PROD_PASSWORD} rsync -avz --no-perms --no-owner --no-group -e 'ssh -o StrictHostKeyChecking=no'"

# Upload release directory with rsync
echo "📤 Uploading frontend directory..."
${RSYNC} ${RELEASE_DIR}/ ${PROD_USER}@${PROD_SERVER}:/tmp/${RELEASE_NAME}_frontend/

# Deploy via SSH
${SSH} bash -s << EOF
set -e

echo "🎨 Starting frontend deployment on server..."

# Check if mod_rewrite is enabled
if ! apache2ctl -M | grep -q rewrite_module; then
    echo "WARNING: mod_rewrite not enabled. Enabling it now..."
    sudo a2enmod rewrite || echo "Failed to enable mod_rewrite"
fi

# Create backup
echo "📁 Creating backup..."
if [ -d "${FRONTEND_PATH}" ]; then
    mv ${FRONTEND_PATH} ${FRONTEND_PATH}_old || true
fi

# Move rsynced directory to final location
echo "📦 Moving frontend files..."
sudo mv /tmp/${RELEASE_NAME}_frontend ${FRONTEND_PATH}
if [ ! -f "${FRONTEND_PATH}/index.html" ]; then
    echo "ERROR: Frontend transfer failed, index.html not found"
    exit 1
fi

# Create .htaccess for React Router
echo "📝 Creating .htaccess for React Router support..."
cat << HTACCESS | sudo tee ${FRONTEND_PATH}/.htaccess
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
HTACCESS

# Set permissions (Virtualmin handles most, but ensure ownership)
echo "🔒 Setting permissions..."
sudo chown -R ${APP_USER}:${APP_USER} ${FRONTEND_PATH}
sudo chmod -R 755 ${FRONTEND_PATH}
sudo chmod 664 ${FRONTEND_PATH}/.htaccess

# Restart services
echo "🔄 Restarting services..."
sudo systemctl reload apache2 || echo "Web server reload failed"

echo "✅ Frontend deployment completed!"
EOF

echo "✅ Frontend deployment script completed!"