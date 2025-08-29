#!/bin/bash

# Run all queues for development testing
# This processes all your named queues in priority order

echo "Starting comprehensive queue worker for development..."
echo "Queues: campaigns, emails, bounces, default"
echo "Press Ctrl+C to stop"
echo ""

php artisan queue:work --queue=campaigns,emails,bounces,default --tries=3 --timeout=90 --verbose
