#!/bin/bash
set -e

echo "🎨 Starting frontend deployment with backup/restore functionality..."

# Configuration variables
APP_NAME="Campaign Pro X"
APP_USER="campaignprox"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
FRONTEND_PATH="/home/campaignprox/public_html"
BACKUP_PATH="/home/campaignprox/backups"
RELEASE_NAME="${RELEASE_NAME}"
RELEASE_DIR="deployment/frontend"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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

# Backup function
create_frontend_backup() {
    echo "📁 Creating frontend backup..."
    ${SSH} bash -s << 'BACKUP_EOF'
        set -e
        FRONTEND_PATH="/home/campaignprox/public_html"
        BACKUP_PATH="/home/campaignprox/backups"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        
        # Create backup directory
        mkdir -p "${BACKUP_PATH}"
        
        if [ -d "${FRONTEND_PATH}" ] && [ "$(ls -A ${FRONTEND_PATH} 2>/dev/null)" ]; then
            echo "📦 Backing up existing frontend files..."
            
            # Create full backup archive
            BACKUP_FILE="${BACKUP_PATH}/frontend_backup_${TIMESTAMP}.tar.gz"
            tar -czf "${BACKUP_FILE}" -C "$(dirname ${FRONTEND_PATH})" "$(basename ${FRONTEND_PATH})" 2>/dev/null || {
                echo "ERROR: Failed to create frontend backup"
                exit 1
            }
            
            # Create state file for rollback reference
            echo "${TIMESTAMP}" > "${BACKUP_PATH}/.last_frontend_backup"
            echo "${FRONTEND_PATH}" >> "${BACKUP_PATH}/.last_frontend_backup"
            
            echo "✅ Frontend backup created: ${BACKUP_FILE}"
            
            # Keep only last 5 backups
            ls -t "${BACKUP_PATH}"/frontend_backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -I {} rm -f {} || true
        else
            echo "ℹ️ No existing frontend found or directory is empty, creating new deployment marker"
            echo "new_deployment_${TIMESTAMP}" > "${BACKUP_PATH}/.last_frontend_backup"
        fi
BACKUP_EOF
}

# Restore function
restore_frontend_backup() {
    echo "🔄 Restoring frontend from backup due to deployment failure..."
    ${SSH} bash -s << 'RESTORE_EOF'
        set -e
        BACKUP_PATH="/home/campaignprox/backups"
        
        if [ ! -f "${BACKUP_PATH}/.last_frontend_backup" ]; then
            echo "ERROR: No frontend backup reference found"
            exit 1
        fi
        
        BACKUP_TIMESTAMP=$(head -n1 "${BACKUP_PATH}/.last_frontend_backup")
        FRONTEND_PATH=$(sed -n '2p' "${BACKUP_PATH}/.last_frontend_backup")
        
        if [[ "${BACKUP_TIMESTAMP}" == new_deployment_* ]]; then
            echo "ℹ️ This was a new frontend deployment, cleaning up failed installation..."
            rm -rf "${FRONTEND_PATH}"/* || true
            echo "✅ Frontend cleanup completed"
        else
            echo "📦 Restoring frontend from backup timestamp: ${BACKUP_TIMESTAMP}"
            
            BACKUP_FILE="${BACKUP_PATH}/frontend_backup_${BACKUP_TIMESTAMP}.tar.gz"
            
            if [ -f "${BACKUP_FILE}" ]; then
                # Remove failed deployment
                rm -rf "${FRONTEND_PATH}"/* || true
                
                # Restore from backup
                tar -xzf "${BACKUP_FILE}" -C "$(dirname ${FRONTEND_PATH})" --strip-components=1 || {
                    echo "ERROR: Failed to restore frontend backup"
                    exit 1
                }
                
                # Fix permissions
                chown -R campaignprox:campaignprox "${FRONTEND_PATH}" || true
                chmod -R 755 "${FRONTEND_PATH}" || true
                
                echo "✅ Frontend restored successfully"
            else
                echo "ERROR: Frontend backup file not found: ${BACKUP_FILE}"
                exit 1
            fi
        fi
        
        # Restart Apache after restore
        systemctl reload apache2 2>/dev/null || service apache2 reload 2>/dev/null || echo "Web server reload failed"
RESTORE_EOF
}

# Function to deploy frontend
deploy_frontend() {
    echo "📤 Uploading frontend files..."
    # Upload to temporary location first
    sshpass -p "${PROD_PASSWORD}" rsync -avz --delete --exclude='.git' -e "ssh -o StrictHostKeyChecking=no" ${RELEASE_DIR}/ ${PROD_USER}@${PROD_SERVER}:/tmp/${RELEASE_NAME}_frontend_new/

    # Deploy frontend on server
    ${SSH} bash -s << EOF
set -e
FRONTEND_PATH="/home/campaignprox/public_html"

echo "🎨 Installing new frontend..."

# Move existing files to backup location if they exist
if [ -d "\${FRONTEND_PATH}" ] && [ "\$(ls -A \${FRONTEND_PATH} 2>/dev/null)" ]; then
    rm -rf "\${FRONTEND_PATH}_deploying" || true
    mkdir -p "\${FRONTEND_PATH}_deploying"
    mv "\${FRONTEND_PATH}"/* "\${FRONTEND_PATH}_deploying/" 2>/dev/null || true
fi

# Ensure frontend directory exists
mkdir -p "\${FRONTEND_PATH}"

# Move new files to final location
mv "/tmp/${RELEASE_NAME}_frontend_new"/* "\${FRONTEND_PATH}/"

# Verify critical files exist
if [ ! -f "\${FRONTEND_PATH}/index.html" ]; then
    echo "ERROR: Critical file missing - index.html"
    exit 1
fi

# Fix ownership and permissions
chown -R campaignprox:campaignprox "\${FRONTEND_PATH}"
chmod -R 755 "\${FRONTEND_PATH}"

cd "\${FRONTEND_PATH}"

echo "🎨 Setting up React Router support..."

# Create .htaccess for React Router
echo "📝 Creating .htaccess for React Router support..."
cat > .htaccess << 'HTACCESS'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
HTACCESS

echo "🧪 Testing frontend deployment..."
# Verify that index.html exists and is accessible
if [ -f "index.html" ]; then
    echo "✅ Frontend index.html found"
    # Basic content check
    if grep -q "<!DOCTYPE html>" "index.html" || grep -q "<html" "index.html"; then
        echo "✅ Frontend index.html appears to be valid HTML"
    else
        echo "❌ Frontend index.html does not appear to be valid HTML"
        exit 1
    fi
else
    echo "❌ Frontend index.html missing"
    exit 1
fi

# Test .htaccess file
if [ -f ".htaccess" ]; then
    echo "✅ Frontend .htaccess created successfully"
else
    echo "❌ Frontend .htaccess creation failed"
    exit 1
fi

# Restart Apache
systemctl reload apache2 2>/dev/null || service apache2 reload 2>/dev/null || echo "Web server reload failed"

# Clean up old deployment files
rm -rf "\${FRONTEND_PATH}_deploying" || true
rm -rf "/tmp/${RELEASE_NAME}_frontend_new" || true

echo "✅ Frontend deployment completed successfully!"
EOF
}

# Main deployment process with error handling
{
    create_frontend_backup
    deploy_frontend
    echo "✅ Frontend deployment completed successfully!"
} || {
    echo "❌ Frontend deployment failed, initiating restore..."
    restore_frontend_backup
    echo "❌ Frontend deployment failed and backup has been restored"
    exit 1
}

echo "✅ Frontend deployment script completed!"
