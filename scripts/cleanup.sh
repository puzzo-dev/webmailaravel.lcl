#!/bin/bash
set -e

echo "🧹 Starting cleanup..."

# Configuration variables
APP_NAME="campaignprox.msz-pl.com"
PROD_SERVER="${PROD_SERVER}"
PROD_USER="${PROD_USER}"
PROD_PASSWORD="${PROD_PASSWORD}"
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com"
FRONTEND_PATH="/home/campaignprox/public_html"
BACKUP_PATH="/home/campaignprox/backups"

# Check if required environment variables are set
if [ -z "${PROD_SERVER}" ] || [ -z "${PROD_USER}" ] || [ -z "${PROD_PASSWORD}" ]; then
    echo "ERROR: Missing required environment variables: PROD_SERVER, PROD_USER, PROD_PASSWORD"
    exit 1
fi

# SSH command using sshpass
SSH="sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER}"

# Cleanup
${SSH} bash -s << EOF
set -e

echo "🧹 Cleaning up old deployments and backups..."

# Remove old backend deployments (keep last 2)
if [ -d "${BACKEND_PATH}_old" ]; then
    rm -rf ${BACKEND_PATH}_old || echo "Failed to remove old backend"
fi
if [ -d "${BACKEND_PATH}_rollback_temp" ]; then
    rm -rf ${BACKEND_PATH}_rollback_temp || echo "Failed to remove rollback temp"
fi
if [ -d "${BACKEND_PATH}_backup_restore" ]; then
    rm -rf ${BACKEND_PATH}_backup_restore || echo "Failed to remove backup restore"
fi

# Remove old frontend deployments (keep last 2)
if [ -d "${FRONTEND_PATH}_old" ]; then
    rm -rf ${FRONTEND_PATH}_old || echo "Failed to remove old frontend"
fi
if [ -d "${FRONTEND_PATH}_rollback_temp" ]; then
    rm -rf ${FRONTEND_PATH}_rollback_temp || echo "Failed to remove frontend rollback temp"
fi

# Remove old backups (keep last 5)
if [ -d "${BACKUP_PATH}" ]; then
    ls -t ${BACKUP_PATH}/db_backup_*.sqlite 2>/dev/null | tail -n +6 | xargs -I {} rm -f {} || echo "No old database backups to remove"
    ls -t ${BACKUP_PATH}/backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -I {} rm -f {} || echo "No old backups to remove"
fi

# Remove temporary files
rm -rf /tmp/restore_* /tmp/backend /tmp/frontend /tmp/*_backend.tar.gz /tmp/*_frontend.tar.gz 2>/dev/null || echo "No temporary files to remove"

echo "✅ Cleanup completed!"
EOF

echo "✅ Cleanup script completed!"