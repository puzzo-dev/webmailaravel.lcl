#!/bin/bash

# Jenkins Post-Deployment Verification Script
# This script verifies that the production deployment completed successfully

set -e

echo "🔍 Jenkins Post-Deployment Verification"
echo "======================================="

# Define paths
BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"

# Check if backend directory exists
if [ ! -d "$BACKEND_PATH" ]; then
    echo "❌ ERROR: Backend path does not exist: $BACKEND_PATH"
    exit 1
fi

cd "$BACKEND_PATH"

echo "📍 Verifying deployment at: $(pwd)"

# Check if Laravel is properly deployed
if [ ! -f "artisan" ]; then
    echo "❌ ERROR: Laravel artisan file not found"
    exit 1
fi

echo "✅ Laravel deployment verified"

# Check environment configuration
echo ""
echo "🔍 Environment Configuration:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check critical environment variables
    APP_ENV=$(grep '^APP_ENV=' .env 2>/dev/null | cut -d'=' -f2 || echo "")
    APP_URL=$(grep '^APP_URL=' .env 2>/dev/null | cut -d'=' -f2 || echo "")
    FRONTEND_URL=$(grep '^APP_FRONTEND_URL=' .env 2>/dev/null | cut -d'=' -f2 || echo "")
    CORS_ORIGINS=$(grep '^CORS_ALLOWED_ORIGINS=' .env 2>/dev/null | cut -d'=' -f2 || echo "")
    
    echo "  APP_ENV: $APP_ENV"
    echo "  APP_URL: $APP_URL"
    echo "  APP_FRONTEND_URL: $FRONTEND_URL"
    echo "  CORS_ALLOWED_ORIGINS: $CORS_ORIGINS"
    
    # Validate critical settings
    ERRORS=0
    
    if [ "$APP_ENV" != "production" ]; then
        echo "❌ ERROR: APP_ENV should be 'production', got '$APP_ENV'"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ "$APP_URL" != "https://api.msz-pl.com" ]; then
        echo "❌ ERROR: APP_URL should be 'https://api.msz-pl.com', got '$APP_URL'"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ "$FRONTEND_URL" != "https://campaignprox.msz-pl.com" ]; then
        echo "❌ ERROR: APP_FRONTEND_URL should be 'https://campaignprox.msz-pl.com', got '$FRONTEND_URL'"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ -z "$CORS_ORIGINS" ]; then
        echo "❌ ERROR: CORS_ALLOWED_ORIGINS is not set"
        ERRORS=$((ERRORS + 1))
    elif [[ "$CORS_ORIGINS" != *"campaignprox.msz-pl.com"* ]]; then
        echo "❌ ERROR: CORS_ALLOWED_ORIGINS should contain 'campaignprox.msz-pl.com', got '$CORS_ORIGINS'"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ $ERRORS -eq 0 ]; then
        echo "✅ All environment variables are correctly configured"
    else
        echo "❌ Found $ERRORS environment configuration errors"
    fi
    
else
    echo "❌ ERROR: .env file does not exist"
    ERRORS=$((ERRORS + 1))
fi

# Test Laravel configuration loading
echo ""
echo "🧪 Testing Laravel Configuration:"
if php artisan config:show app.env 2>/dev/null | grep -q "production"; then
    echo "✅ Laravel is loading production configuration"
else
    echo "❌ ERROR: Laravel is not loading production configuration"
    ERRORS=$((ERRORS + 1))
fi

# Test database connectivity
echo ""
echo "🗄️ Testing Database:"
if php artisan migrate:status >/dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ ERROR: Database connection failed"
    ERRORS=$((ERRORS + 1))
fi

# Test CORS configuration
echo ""
echo "🌐 Testing CORS Configuration:"
CORS_TEST=$(php artisan tinker --execute="echo env('CORS_ALLOWED_ORIGINS', 'NOT_SET');" 2>/dev/null || echo "ERROR")
if [ "$CORS_TEST" != "NOT_SET" ] && [ "$CORS_TEST" != "ERROR" ]; then
    echo "✅ CORS configuration loaded: $CORS_TEST"
else
    echo "❌ ERROR: CORS configuration not loaded properly"
    ERRORS=$((ERRORS + 1))
fi

# Check file permissions
echo ""
echo "📁 Checking File Permissions:"
if [ -w "storage/logs" ]; then
    echo "✅ Storage directory is writable"
else
    echo "❌ ERROR: Storage directory is not writable"
    ERRORS=$((ERRORS + 1))
fi

# Check queue configuration
echo ""
echo "⚙️ Testing Queue Configuration:"
QUEUE_CONNECTION=$(php artisan tinker --execute="echo config('queue.default');" 2>/dev/null || echo "ERROR")
if [ "$QUEUE_CONNECTION" = "database" ]; then
    echo "✅ Queue connection is set to database"
else
    echo "❌ ERROR: Queue connection should be 'database', got '$QUEUE_CONNECTION'"
    ERRORS=$((ERRORS + 1))
fi

# Final result
echo ""
echo "============================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ POST-DEPLOYMENT VERIFICATION PASSED"
    echo "✅ All systems are properly configured"
    echo ""
    echo "🔗 Application URLs:"
    echo "  Frontend: https://campaignprox.msz-pl.com"
    echo "  Backend API: https://api.msz-pl.com"
    echo ""
    echo "📊 Deployment Status: SUCCESS"
    exit 0
else
    echo "❌ POST-DEPLOYMENT VERIFICATION FAILED"
    echo "❌ Found $ERRORS configuration errors"
    echo ""
    echo "🛠️ Recommended Actions:"
    echo "1. Run emergency environment fix: ./scripts/emergency-production-env-fix.sh"
    echo "2. Check deployment logs for issues"
    echo "3. Verify .env.production file is properly committed"
    echo ""
    echo "📊 Deployment Status: FAILED"
    exit 1
fi
