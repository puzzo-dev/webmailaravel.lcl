#!/bin/bash

# Queue Worker Optimization Script for Campaign Performance
# This script optimizes queue workers for better campaign start and sending performance

set -e

BACKEND_DIR="/home/users/codepad/www/webmailaravel.lcl/backend"
LOG_FILE="/var/log/queue-optimization.log"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "Starting queue worker optimization..."

cd "$BACKEND_DIR"

# Stop existing queue workers
log_message "Stopping existing queue workers..."
pkill -f "artisan queue:work" || true
pkill -f "artisan horizon" || true

# Clear any failed jobs that might be blocking the queue
log_message "Clearing failed jobs..."
php artisan queue:clear --queue=default
php artisan queue:clear --queue=campaigns
php artisan queue:clear --queue=emails

# Restart failed jobs (optional, only if needed)
# php artisan queue:retry all

# Clear and optimize caches
log_message "Optimizing caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start optimized queue workers with multiple processes
log_message "Starting optimized queue workers..."

# High priority queue for campaigns (immediate processing)
nohup php artisan queue:work database --queue=campaigns --sleep=1 --tries=3 --max-time=3600 --memory=512 > /var/log/campaigns-queue.log 2>&1 &
CAMPAIGNS_PID=$!
log_message "Started campaigns queue worker (PID: $CAMPAIGNS_PID)"

# Email sending queue with multiple workers for parallel processing
for i in {1..3}; do
    nohup php artisan queue:work database --queue=emails --sleep=2 --tries=3 --max-time=3600 --memory=256 > "/var/log/emails-queue-$i.log" 2>&1 &
    EMAIL_PID=$!
    log_message "Started email queue worker $i (PID: $EMAIL_PID)"
done

# Default queue worker for other tasks
nohup php artisan queue:work database --queue=default --sleep=3 --tries=3 --max-time=3600 --memory=256 > /var/log/default-queue.log 2>&1 &
DEFAULT_PID=$!
log_message "Started default queue worker (PID: $DEFAULT_PID)"

# Create monitoring script
cat > /tmp/queue-monitor.sh << 'EOF'
#!/bin/bash
while true; do
    echo "=== Queue Status $(date) ==="
    cd /home/users/codepad/www/webmailaravel.lcl/backend
    php artisan queue:monitor campaigns,emails,default
    echo "=== Active Queue Workers ==="
    ps aux | grep "artisan queue:work" | grep -v grep
    echo "=========================="
    sleep 30
done
EOF

chmod +x /tmp/queue-monitor.sh
nohup /tmp/queue-monitor.sh > /var/log/queue-monitor.log 2>&1 &
MONITOR_PID=$!
log_message "Started queue monitor (PID: $MONITOR_PID)"

# Save PIDs for later management
echo "$CAMPAIGNS_PID" > /tmp/campaigns-queue.pid
echo "$DEFAULT_PID" > /tmp/default-queue.pid
echo "$MONITOR_PID" > /tmp/queue-monitor.pid

log_message "Queue worker optimization completed successfully!"
log_message "Campaign processing should now be significantly faster."
log_message "Monitor logs: tail -f /var/log/campaigns-queue.log"

# Display current queue status
log_message "Current queue status:"
php artisan queue:monitor campaigns,emails,default

exit 0
