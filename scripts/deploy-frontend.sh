#!/bin/bash
set -e

echo "🎨 Starting frontend deployment..."

# Upload frontend package
echo "📤 Uploading frontend package..."
sshpass -p "${PROD_PASSWORD}" scp -o StrictHostKeyChecking=no \
    deployment/${RELEASE_NAME}_frontend.tar.gz \
    ${PROD_USER}@${PROD_SERVER}:/tmp/

# Deploy frontend via SSH
echo "🚀 Deploying frontend..."
sshpass -p "${PROD_PASSWORD}" ssh -o StrictHostKeyChecking=no \
    ${PROD_USER}@${PROD_SERVER} << 'EOF'
set -e

echo "🎨 Starting frontend deployment on server..."

# Create backup of current frontend
if [ -d "${FRONTEND_PATH}" ]; then
    echo "📋 Creating frontend backup..."
    sudo mkdir -p ${BACKUP_PATH}
    sudo tar -czf ${BACKUP_PATH}/frontend_backup_${BUILD_TIMESTAMP}.tar.gz -C ${FRONTEND_PATH} . || echo "Frontend backup failed, continuing..."
fi

# Create release directory
RELEASE_DIR="/tmp/releases/${RELEASE_NAME}_frontend"
mkdir -p $RELEASE_DIR

# Extract new release
echo "📦 Extracting frontend release..."
cd $RELEASE_DIR
tar -xzf /tmp/${RELEASE_NAME}_frontend.tar.gz

# Verify frontend build
if [ ! -f "$RELEASE_DIR/frontend/index.html" ]; then
    echo "❌ Frontend build verification failed - index.html not found"
    exit 1
fi

echo "✅ Frontend build verified"

# Create .htaccess for React Router support
cat > $RELEASE_DIR/frontend/.htaccess << 'HTACCESS'
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Skip API routes
    RewriteCond %{REQUEST_URI} !^/api
    # Handle client-side routing
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
    
    # Security headers
    <IfModule mod_headers.c>
        Header always set X-Content-Type-Options nosniff
        Header always set X-Frame-Options DENY
        Header always set X-XSS-Protection "1; mode=block"
        Header always set Referrer-Policy "strict-origin-when-cross-origin"
        Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self'; object-src 'none'; child-src 'none'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    </IfModule>
    
    # Compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/plain
        AddOutputFilterByType DEFLATE text/html
        AddOutputFilterByType DEFLATE text/xml
        AddOutputFilterByType DEFLATE text/css
        AddOutputFilterByType DEFLATE application/xml
        AddOutputFilterByType DEFLATE application/xhtml+xml
        AddOutputFilterByType DEFLATE application/rss+xml
        AddOutputFilterByType DEFLATE application/javascript
        AddOutputFilterByType DEFLATE application/x-javascript
    </IfModule>
    
    # Browser caching
    <IfModule mod_expires.c>
        ExpiresActive on
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType text/javascript "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/svg+xml "access plus 1 year"
        ExpiresByType font/woff "access plus 1 year"
        ExpiresByType font/woff2 "access plus 1 year"
        ExpiresByType application/font-woff "access plus 1 year"
        ExpiresByType application/font-woff2 "access plus 1 year"
    </IfModule>
</IfModule>
HTACCESS

# Atomic deployment - switch to new version
echo "🔄 Switching to new frontend version..."
sudo rm -rf ${FRONTEND_PATH}_old
if [ -d "${FRONTEND_PATH}" ]; then
    sudo mv ${FRONTEND_PATH} ${FRONTEND_PATH}_old
fi
sudo mv $RELEASE_DIR/frontend ${FRONTEND_PATH}

# Set proper permissions
echo "🔒 Setting frontend permissions..."
sudo chown -R yourdomain:yourdomain ${FRONTEND_PATH}
sudo chmod -R 755 ${FRONTEND_PATH}

# Verify deployment
if [ -f "${FRONTEND_PATH}/index.html" ]; then
    echo "✅ Frontend files verified in production location"
else
    echo "❌ Frontend deployment verification failed"
    exit 1
fi

echo "✅ Frontend deployment completed!"

# Clean up
echo "🧹 Cleaning up frontend files..."
rm -f /tmp/${RELEASE_NAME}_frontend.tar.gz
rm -rf $RELEASE_DIR

echo "🎉 Frontend deployment successfully completed!"

EOF

echo "✅ Frontend deployment script completed!"