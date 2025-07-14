# Email Campaign Management System - Setup Instructions

## Overview

This is a comprehensive Laravel 12.x + React email campaign management system with PowerMTA CSV file analysis integration, Redis scheduling, and advanced analytics.

## Features Completed

✅ **Backend (Laravel 12.x)**
- Complete email campaign management
- PowerMTA CSV file analysis (Accounting, FBL, Diagnostic)
- Redis-based domain monitoring and scheduling
- Sender randomization and content switching
- Real-time analytics and health scoring
- User authentication with 2FA
- Admin dashboard with comprehensive management
- Billing system with BTCPay integration
- Suppression list management
- Advanced security features

✅ **Frontend (React + Vite)**
- Modern React application with TypeScript support
- Redux Toolkit for state management
- Tailwind CSS for styling
- Complete domain management with PowerMTA analytics
- Real-time monitoring dashboard
- Campaign management interface
- User authentication and profile management
- Responsive design for all devices

✅ **PowerMTA Integration**
- CSV file analysis only (no SMTP functionality)
- Accounting file parsing for delivery metrics
- FBL (Feedback Loop) file processing
- Diagnostic file analysis for issue tracking
- Automated domain training configuration
- Health scoring and reputation monitoring

✅ **Redis Scheduling**
- Persistent domain monitoring (24-hour intervals)
- Manual and automatic training checks
- Real-time status tracking
- Scheduled individual domain checks

## Prerequisites

- **PHP 8.2+** with required extensions
- **Node.js 18+** with npm
- **Laravel 12.x**
- **SQLite3** (or PostgreSQL/MySQL)
- **Redis Server**
- **Composer**
- **PowerMTA** (for log file generation)

## Installation Steps

### 1. Clone and Setup Backend

```bash
cd backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database (SQLite is default)
touch database/database.sqlite

# Run migrations
php artisan migrate

# Seed initial data (optional)
php artisan db:seed
```

### 2. Configure Environment (.env)

```env
# Application
APP_NAME="Email Campaign System"
APP_ENV=local
APP_KEY=base64:your-key-here
APP_DEBUG=true
APP_URL=http://localhost:8001

# Database (SQLite default)
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database/database.sqlite

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0

# PowerMTA File Paths
POWERMTA_ACCT_PATH=/var/log/pmta/acct-*.csv
POWERMTA_FBL_PATH=/var/log/pmta/fbl-*.csv
POWERMTA_DIAG_PATH=/var/log/pmta/diag-*.csv
POWERMTA_CONFIG_PATH=/etc/pmta/config

# Queue Driver
QUEUE_CONNECTION=redis

# Cache Driver
CACHE_DRIVER=redis

# Session Driver
SESSION_DRIVER=redis
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 4. Configure Frontend Environment (.env)

```env
VITE_API_URL=http://localhost:8001/api
VITE_WS_URL=ws://localhost:6001
VITE_APP_NAME=EmailCampaign
VITE_APP_VERSION=1.0.0
```

### 5. Start Services

#### Backend Services
```bash
cd backend

# Start Laravel development server
php artisan serve --port=8001

# Start queue worker (in separate terminal)
php artisan queue:work

# Start scheduler monitoring (in separate terminal)
php artisan domains:monitor

# Optional: Start WebSocket server for real-time updates
php artisan reverb:start --port=6001
```

#### Frontend Service
```bash
cd frontend

# Start Vite development server
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001/api
- **Backend Admin**: http://localhost:8001

## PowerMTA Configuration

### File Permissions

```bash
# Add web server user to pmta group
sudo usermod -a -G pmta www-data

# Set permissions
sudo chmod 755 /var/log/pmta
sudo chmod 644 /var/log/pmta/*.csv
```

### Log File Formats

Ensure PowerMTA generates log files in the expected CSV format:

**Accounting**: `type,timeLogged,orig,rcpt,vmta,jobId,dsnStatus,dsnMta,bodySize`
**FBL**: `timestamp,orig,rcpt,feedback_type`
**Diagnostic**: `timestamp,orig,rcpt,vmta,diag_code,diag_text`

## Redis Scheduling Setup

### Manual Monitoring Commands

```bash
# Check monitoring status
php artisan domains:monitor

# Force run monitoring
php artisan domains:monitor --force

# Clear monitoring data
php artisan domains:monitor --clear
```

### Automated Scheduling (Cron)

Add to crontab:
```bash
* * * * * cd /path/to/project/backend && php artisan domains:monitor >> /dev/null 2>&1
```

## Default User Accounts

After seeding:
- **Admin**: admin@example.com / password
- **User**: user@example.com / password

## API Documentation

### PowerMTA Analytics
- `GET /api/powermta/training/config`
- `GET /api/powermta/domains/analytics`
- `GET /api/powermta/domains/{id}/analytics`
- `POST /api/powermta/domains/training/check`

### Monitoring
- `GET /api/monitoring/status`
- `GET /api/monitoring/results`
- `POST /api/monitoring/run`
- `DELETE /api/monitoring/clear`

### Campaigns
- `GET /api/campaigns`
- `POST /api/campaigns`
- `GET /api/campaigns/{id}`
- `PUT /api/campaigns/{id}`
- `DELETE /api/campaigns/{id}`

### Domains
- `GET /api/domains`
- `POST /api/domains`
- `PUT /api/domains/{id}`
- `DELETE /api/domains/{id}`

## Key Features Usage

### Domain Management
1. Add domains via frontend interface
2. Configure DNS records (DKIM, SPF, DMARC)
3. Set up bounce processing
4. Monitor health scores and analytics

### Campaign Creation
1. Create campaign with subject and content
2. Upload recipient list (CSV, TXT, XLS, XLSX)
3. Select domains and senders
4. Configure content variations for A/B testing
5. Set template variables for personalization
6. Schedule or send immediately

### Monitoring
1. View real-time domain health dashboard
2. Check PowerMTA analytics and metrics
3. Monitor bounce rates, complaints, and delivery
4. Review diagnostic issues and FBL data
5. Apply training configurations automatically

### Analytics
1. Comprehensive domain performance tracking
2. Health scoring with issue identification
3. Export analytics data to CSV
4. Real-time updates and notifications

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure SQLite file exists and has proper permissions
2. **Redis Connection**: Verify Redis server is running (`redis-cli ping`)
3. **PowerMTA Files**: Check file paths and permissions in .env
4. **Queue Jobs**: Ensure queue worker is running for background tasks
5. **CORS Issues**: Check API_URL in frontend .env matches backend URL

### Log Files

- **Laravel Logs**: `backend/storage/logs/laravel.log`
- **Queue Logs**: Monitor queue worker output
- **PowerMTA Logs**: Check configured log paths
- **Redis Logs**: Check Redis server logs

### Performance

- **Cache**: Use Redis for caching and sessions
- **Queue**: Process heavy tasks in background
- **Database**: Add indexes for frequently queried fields
- **Files**: Implement log rotation for large PowerMTA files

## Security Considerations

- Change default passwords immediately
- Use HTTPS in production
- Secure PowerMTA log file access
- Configure proper firewall rules
- Enable Laravel security features (CSRF, XSS protection)
- Regular security updates and monitoring

## Production Deployment

### Backend
- Configure proper web server (Nginx/Apache)
- Use production database (PostgreSQL/MySQL)
- Set up SSL certificates
- Configure queue supervisord
- Enable opcode caching (OPcache)

### Frontend
- Build production assets: `npm run build`
- Deploy to CDN or static hosting
- Configure proper caching headers
- Enable gzip compression

### Infrastructure
- Set up load balancing if needed
- Configure Redis clustering for scale
- Implement proper backup strategies
- Monitor system resources and performance

## Support

For issues and questions:
1. Check this documentation
2. Review Laravel and React documentation
3. Check PowerMTA integration logs
4. Monitor Redis and queue workers
5. Review application logs for errors

---

**System Status**: ✅ Fully functional with all core features implemented
**Last Updated**: January 2025
**Version**: 1.0.0
