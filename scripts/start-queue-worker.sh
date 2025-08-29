#!/bin/bash

# Laravel Queue Worker - All Queues
# This script starts a single worker that processes all named queues in priority order

set -e

BACKEND_DIR="/home/users/codepad/www/webmailaravel.lcl/backend"

echo "Starting Laravel Queue Worker for all queues..."
echo "Queue order: campaigns (high) → emails (medium) → bounces → default (low)"
echo "Press Ctrl+C to stop"
echo ""

cd "$BACKEND_DIR"

# Single worker processing all queues in priority order
php artisan queue:work database \
    --queue=campaigns,emails,bounces,default \
    --sleep=3 \
    --tries=3 \
    --timeout=60 \
    --memory=512

echo "Queue worker stopped."
