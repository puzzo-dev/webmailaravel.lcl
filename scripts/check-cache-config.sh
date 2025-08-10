#!/bin/bash

# Laravel Cache Configuration Checker
# Ensures cache system is properly configured

BACKEND_PATH="/home/campaignprox/domains/api.msz-pl.com/public_html"

echo "🔍 Laravel Cache Configuration Check"
echo "==================================="

cd "$BACKEND_PATH"

echo "📋 Current cache configuration:"
php8.3 artisan config:show cache --json | head -20

echo ""
echo "🗄️ Checking cache table in database:"
php8.3 artisan tinker --execute="
use Illuminate\Support\Facades\DB;
try {
    \$result = DB::select('SELECT name FROM sqlite_master WHERE type=\"table\" AND name=\"cache\"');
    if (empty(\$result)) {
        echo \"❌ Cache table does not exist\n\";
        echo \"Running cache table migration...\n\";
        DB::statement('CREATE TABLE cache (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT NOT NULL,
            expiration INTEGER NOT NULL
        )');
        echo \"✅ Cache table created successfully\n\";
    } else {
        echo \"✅ Cache table exists\n\";
    }
    
    // Also check cache_locks table
    \$locks_result = DB::select('SELECT name FROM sqlite_master WHERE type=\"table\" AND name=\"cache_locks\"');
    if (empty(\$locks_result)) {
        echo \"Creating cache_locks table...\n\";
        DB::statement('CREATE TABLE cache_locks (
            key VARCHAR(255) PRIMARY KEY,
            owner VARCHAR(255) NOT NULL,
            expiration INTEGER NOT NULL
        )');
        echo \"✅ Cache_locks table created successfully\n\";
    } else {
        echo \"✅ Cache_locks table exists\n\";
    }
} catch (Exception \$e) {
    echo \"❌ Error: \" . \$e->getMessage() . \"\n\";
}
"

echo ""
echo "🧪 Testing cache functionality:"
php8.3 artisan tinker --execute="
use Illuminate\Support\Facades\Cache;
try {
    Cache::put('test_key', 'test_value', 60);
    \$value = Cache::get('test_key');
    if (\$value === 'test_value') {
        echo \"✅ Cache is working correctly\n\";
        Cache::forget('test_key');
    } else {
        echo \"❌ Cache test failed\n\";
    }
} catch (Exception \$e) {
    echo \"❌ Cache error: \" . \$e->getMessage() . \"\n\";
}
"

echo ""
echo "🔧 Cache optimization:"
php8.3 artisan config:cache
echo "✅ Configuration cached"

echo ""
echo "📊 Final cache status check:"
php8.3 artisan tinker --execute="
try {
    \$tables = DB::select('SELECT name FROM sqlite_master WHERE type=\"table\" ORDER BY name');
    echo \"Available tables:\n\";
    foreach (\$tables as \$table) {
        echo \"  - \" . \$table->name . \"\n\";
    }
} catch (Exception \$e) {
    echo \"Error listing tables: \" . \$e->getMessage() . \"\n\";
}
"
