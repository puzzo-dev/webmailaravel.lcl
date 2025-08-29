# Email Campaign Management System

A comprehensive email campaign management platform built with Laravel (backend) and React (frontend).

## Project Structure

```text
├── backend/          # Laravel API backend
├── frontend/         # React frontend application
├── deployment/       # Deployment scripts and configurations
│   ├── scripts/      # Deployment automation scripts
│   └── cron/         # Cron job configurations
├── scripts/          # Utility and maintenance scripts
├── tests/            # Integration and system tests
├── docs/             # Documentation and guides
└── README.md         # This file
```

## Quick Start

### Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

## Documentation

- [Manual Setup Guide](docs/MANUAL_SETUP_GUIDE.md)
- [Backup & Restore Guide](docs/BACKUP_RESTORE_GUIDE.md)
- [Queue Management Guide](docs/QUEUE_MANAGEMENT_GUIDE.md)
- [Deployment Guide](docs/VIRTUALMIN_DEPLOYMENT_GUIDE.md)
- [PowerMTA Setup](docs/POWERMTA_SETUP.md)

## Features

- Email campaign creation and management
- Template system with variable support
- Analytics and reporting
- User management and authentication
- Queue-based email processing
- Domain and sender management
- Suppression list handling
- Real-time monitoring

## License

This project is proprietary software.
