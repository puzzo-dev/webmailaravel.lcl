#!/bin/bash
set -e

echo "🔍 JWT Configuration Verification Script"
echo "========================================"

# Configuration variables
PROD_SERVER="${PROD_SERVER:-api.msz-pl.com}"
PROD_USER="${PROD_USER:-campaignprox}"
PROD_PASSWORD="${PROD_PASSWORD}"
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
PHP_CMD="php8.3"

# Check if required environment variables are set
if [ -z "${PROD_PASSWORD}" ]; then
    echo "ERROR: PROD_PASSWORD environment variable is required"
    echo "Usage: PROD_PASSWORD=your-password $0"
    exit 1
fi

# SSH command using sshpass
SSH="sshpass -p ${PROD_PASSWORD} ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER}"

echo "🔍 Checking production JWT configuration..."

${SSH} bash -s << 'EOF'
set -e
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"
PHP_CMD="php8.3"

cd "${BACKEND_PATH}"

echo "📋 Current environment configuration:"
echo "=================================="

# Check if .env file exists
if [ -f .env ]; then
    echo "✅ .env file exists"
    
    # Check JWT configuration
    echo ""
    echo "🔐 JWT Configuration:"
    if grep -q "^JWT_SECRET=" .env; then
        JWT_VALUE=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2)
        if [ -n "$JWT_VALUE" ] && [ "$JWT_VALUE" != "" ]; then
            echo "✅ JWT_SECRET is configured (${JWT_VALUE:0:20}...)"
        else
            echo "❌ JWT_SECRET is empty"
        fi
    else
        echo "❌ JWT_SECRET not found in .env"
    fi
    
    # Check JWT algorithm
    if grep -q "^JWT_ALGO=" .env; then
        JWT_ALGO=$(grep "^JWT_ALGO=" .env | cut -d'=' -f2)
        echo "✅ JWT_ALGO: ${JWT_ALGO}"
    else
        echo "⚠️ JWT_ALGO not specified (will use default)"
    fi
    
    echo ""
    echo "🌐 API Configuration:"
    grep "^APP_URL=" .env || echo "❌ APP_URL not found"
    grep "^FRONTEND_URL=" .env || echo "❌ FRONTEND_URL not found"
    
    echo ""
    echo "🔗 CORS Configuration:"
    grep "^CORS_ALLOWED_ORIGINS=" .env || echo "❌ CORS_ALLOWED_ORIGINS not found"
    
    echo ""
    echo "🗄️ Database Configuration:"
    grep "^DB_CONNECTION=" .env || echo "❌ DB_CONNECTION not found"
    grep "^DB_DATABASE=" .env || echo "❌ DB_DATABASE not found"
    
else
    echo "❌ .env file not found!"
    exit 1
fi

echo ""
echo "🧪 Testing Laravel Application:"
echo "==============================="

# Test artisan command
if ${PHP_CMD} artisan --version >/dev/null 2>&1; then
    echo "✅ Laravel artisan is working"
    LARAVEL_VERSION=$(${PHP_CMD} artisan --version)
    echo "   Version: ${LARAVEL_VERSION}"
else
    echo "❌ Laravel artisan is not working"
fi

# Test JWT configuration loading
echo ""
echo "🔐 Testing JWT Configuration Loading:"
JWT_CONFIG_TEST=$(${PHP_CMD} artisan tinker --execute="
try {
    \$secret = config('jwt.secret');
    if (empty(\$secret)) {
        echo 'EMPTY';
    } else {
        echo 'LENGTH:' . strlen(\$secret);
    }
} catch (Exception \$e) {
    echo 'ERROR:' . \$e->getMessage();
}
" 2>/dev/null | tail -n1)

case "$JWT_CONFIG_TEST" in
    EMPTY)
        echo "❌ JWT secret is empty in configuration"
        ;;
    LENGTH:*)
        LENGTH=${JWT_CONFIG_TEST#LENGTH:}
        echo "✅ JWT secret loaded successfully (length: ${LENGTH} characters)"
        ;;
    ERROR:*)
        echo "❌ JWT configuration error: ${JWT_CONFIG_TEST#ERROR:}"
        ;;
    *)
        echo "⚠️ Unexpected JWT test result: ${JWT_CONFIG_TEST}"
        ;;
esac

# Test database connection
echo ""
echo "🗄️ Testing Database Connection:"
DB_TEST=$(${PHP_CMD} artisan tinker --execute="
try {
    DB::connection()->getPdo();
    echo 'OK';
} catch (Exception \$e) {
    echo 'ERROR:' . \$e->getMessage();
}
" 2>/dev/null | tail -n1)

if [ "$DB_TEST" = "OK" ]; then
    echo "✅ Database connection is working"
else
    echo "❌ Database connection failed: $DB_TEST"
fi

# Test basic route
echo ""
echo "🌐 Testing Basic API Route:"
if curl -s -f -m 10 "http://localhost/api" >/dev/null 2>&1; then
    echo "✅ API endpoint is responding"
elif curl -s -f -m 10 "https://api.msz-pl.com/api" >/dev/null 2>&1; then
    echo "✅ API endpoint is responding via HTTPS"
else
    echo "⚠️ API endpoint test inconclusive (may require authentication)"
fi

echo ""
echo "📊 Summary:"
echo "=========="
echo "Backend Path: ${BACKEND_PATH}"
echo "PHP Version: $(${PHP_CMD} --version | head -n1)"
echo "Current Time: $(date)"

EOF

echo "✅ JWT verification completed!"
