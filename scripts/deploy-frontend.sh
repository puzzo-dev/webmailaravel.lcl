#!/bin/bash
set -e

echo "🎨 Starting frontend deployment..."

# Configuration variables
APP_NAME="campaignprox.msz-pl.com"
APP_USER="campaignprox"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
FRONTEND_PATH="/home/campaignprox/public_html"
RELEASE_NAME="${RELEASE_NAME}"
RELEASE_PACKAGE="deployment/${RELEASE_NAME}_frontend.tar.gz"

# Check if required environment variables are set
if [ -z "${PROD_SERVER}" ] || [ -z "${PROD_USER}" ] || [ -z "${PROD_PASSWORD}" ] || [ -z "${RELEASE_NAME}" ]; then
    echo "ERROR: Missing required environment variables: PROD_SERVER, PROD_USER, PROD_PASSWORD, RELEASE_NAME"
    exit 1
fi

# Check if release package exists
if [ ! -f "${RELEASE_PACKAGE}" ]; then
    echo "ERROR: Release package ${RELEASE_PACKAGE} not found"
    exit 1
fi

# SSH and SCP commands using sshpass
SSH="sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER}"
SCP="sshpass -p ${PROD_PASSWORD} scp -o StrictHostKeyChecking=no"

# Upload release package
echo "📤 Uploading frontend package..."
${SCP} ${RELEASE_PACKAGE} ${PROD_USER}@${PROD_SERVER}:/tmp/${RELEASE_NAME}_frontend.tar.gz

# Deploy via SSH
echo "🚀 Deploying frontend..."
${SSH} bash -s << EOF
set -e

echo "🎨 Starting frontend deployment on server..."

# Create backup
echo "📁 Creating backup..."
if [ -d "${FRONTEND_PATH}" ]; then
    mv ${FRONTEND_PATH} ${FRONTEND_PATH}_old || true
fi

# Extract release
echo "📦 Extracting frontend release..."
if [ ! -f "/tmp/${RELEASE_NAME}_frontend.tar.gz" ]; then
    echo "ERROR: Release package /tmp/${RELEASE_NAME}_frontend.tar.gz not found"
    exit 1
fi
tar -xzf /tmp/${RELEASE_NAME}_frontend.tar.gz -C /tmp
sudo mv /tmp/frontend ${FRONTEND_PATH}
rm /tmp/${RELEASE_NAME}_frontend.tar.gz

# Set permissions
echo "🔒 Setting permissions..."
sudo chown -R ${APP_USER}:${APP_USER} ${FRONTEND_PATH}
sudo chmod -R 755 ${FRONTEND_PATH}

# Restart services
echo "🔄 Restarting services..."
sudo systemctl reload apache2 || echo "Web server reload failed"

echo "✅ Frontend deployment completed!"
EOF

echo "✅ Frontend deployment script completed!"