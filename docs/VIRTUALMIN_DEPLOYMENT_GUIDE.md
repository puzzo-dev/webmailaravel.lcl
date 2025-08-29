# Virtualmin-Compatible Deployment Process

## Overview
This deployment pipeline has been updated to work with Virtualmin-managed VPS servers while focusing only on the deployment aspects (steps 4-6 of your outlined process). All infrastructure setup (Virtual Server creation) and system-level configuration is handled manually via Virtualmin's web interface.

## Prerequisites (Manual Setup via Virtualmin)

### 1. Virtual Server Infrastructure (Steps 1-3)
These steps are done manually via Virtualmin web interface:

1. **Login to Virtualmin web interface**
2. **Create primary virtual server**: `campaignprox.msz-pl.com`
   - Enable: Web, Mail, Database
   - User: `campaignprox`
   - Password: `Koolup@1992`
3. **Create sub-server**: `api.msz-pl.com` 
   - Parent: `campaignprox.msz-pl.com`
   - Enable: Web, Database
   - Inherits user and database from parent

### 2. Server Requirements
- PHP 8.3 with required extensions (SQLite, etc.)
- Composer installed globally
- Apache with mod_rewrite enabled (handled by Virtualmin)
- Node.js 18+ for frontend building

## Automated Deployment Process (Steps 4-6)

### Step 4: Frontend Deployment
**Script**: `scripts/deploy-frontend.sh`

1. **Build Frontend**: Uses `npm run build` in Jenkins pipeline
2. **Upload Assets**: Deploys build assets directly to `public_html` root (not in subfolder)
3. **React Router Setup**: Creates `.htaccess` for React Router support

**Key Features**:
- Direct upload to `public_html` root directory
- Automatic `.htaccess` creation for React Router
- No manual Apache configuration needed (Virtualmin handles)

### Step 5: Backend Deployment  
**Script**: `scripts/deploy-backend.sh`

1. **Upload Files**: Copies all Laravel files to backend subdomain folder
2. **Install Dependencies**: Runs `composer install --no-dev --optimize-autoloader`
3. **Laravel Setup**: 
   - Environment configuration (.env)
   - Database migrations
   - Artisan optimizations (config:cache, route:cache, view:cache)
4. **htaccess Configuration**: Sets project root to `public/index.php`
5. **Cron Setup**: Configures Laravel scheduler from `cron.txt`
6. **Queue Workers**: Sets up background queue processing

**Key Features**:
- Automatic Laravel configuration and optimization
- Database migration handling
- Background queue worker setup using `nohup`
- Cron job configuration for Laravel scheduler

### Step 6: Testing and Cleanup

1. **CORS Testing**: Validates frontend-backend communication
2. **Connectivity Testing**: Ensures both domains are accessible
3. **Cleanup**: Removes temporary deployment files

## Jenkins Pipeline Stages

1. **Infrastructure Setup**: Build information and environment setup
2. **Environment Setup**: 
   - Backend: Composer dependencies installation
   - Frontend: React app building (`npm run build`)
3. **Deploy to Production**:
   - Parallel deployment of frontend and backend
4. **Setup Process Management**: Queue worker background processes
5. **Production Testing & CORS Validation**: Connectivity and CORS testing
6. **Cleanup Deployment Artifacts**: Remove temporary files
7. **Production Diagnostics**: Final system health check

## File Structure After Deployment

```
/home/campaignprox/
├── public_html/                    # Frontend (campaignprox.msz-pl.com)
│   ├── index.html                  # React app entry point
│   ├── static/                     # React build assets
│   └── .htaccess                   # React Router configuration
└── domains/
    └── api.msz-pl.com/
        └── public_html/            # Backend (api.msz-pl.com)
            ├── public/
            │   └── index.php       # Laravel entry point
            ├── app/                # Laravel application
            ├── database/           # SQLite database
            ├── .env                # Environment configuration
            ├── .htaccess          # Laravel routing
            └── ...                 # Other Laravel files
```

## Key Differences from Previous Version

### ✅ What's Included
- Automatic deployment to Virtualmin-created directories
- Laravel configuration and optimization
- Queue worker management
- CORS and connectivity testing
- React Router configuration

### ❌ What's Removed (Handled by Virtualmin)
- Virtual server creation
- Domain configuration
- Apache virtual host setup
- File ownership and permissions
- Database server setup
- SSL certificate management

### 🔄 What's Simplified
- No sudo commands needed
- No manual folder creation
- No Apache configuration files
- No system service management
- Uses existing Virtualmin directory structure

## Environment Variables Required

```bash
PROD_SERVER=your-server-ip
PROD_USER=campaignprox
PROD_PASSWORD=your-password
RELEASE_NAME=auto-generated-timestamp
```

## Testing the Deployment

The pipeline automatically tests:

1. **Frontend Accessibility**: `https://campaignprox.msz-pl.com`
2. **Backend Accessibility**: `https://api.msz-pl.com` 
3. **CORS Headers**: Cross-origin request validation
4. **API Health**: Basic API endpoint testing

## Continuous Integration Notes

For existing deployments on production:
- The scripts automatically handle backups during deployment
- Database migrations run safely with `--force` flag
- Queue workers are restarted automatically
- Old deployment artifacts are cleaned up

This approach provides a clean separation between infrastructure management (handled by Virtualmin) and application deployment (handled by Jenkins), making the process both reliable and maintainable.
