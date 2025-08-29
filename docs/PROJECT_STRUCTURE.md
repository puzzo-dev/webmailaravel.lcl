# Project Structure Documentation

This document outlines the professional organization of the Email Campaign Management System.

## Root Directory Structure

```text
webmailaravel.lcl/
├── .git/                 # Git repository data
├── .gitignore           # Git ignore rules
├── README.md            # Project overview and setup
├── CHANGELOG.md         # Version history and changes
├── Dockerfile           # Docker configuration
├── Jenkinsfile          # CI/CD pipeline configuration
├── backend/             # Laravel API application
├── frontend/            # React web application
├── deployment/          # Production deployment files
├── scripts/             # Utility and maintenance scripts
├── tests/               # Integration and system tests
└── docs/                # Project documentation
```

## Backend Structure (Laravel)

```text
backend/
├── app/                 # Application source code
├── bootstrap/           # Framework bootstrap files
├── config/              # Configuration files
├── database/            # Database migrations and seeders
├── public/              # Web server document root
├── resources/           # Views, assets, and language files
├── routes/              # Route definitions
├── storage/             # Generated files and logs
├── tests/               # Unit and feature tests
├── vendor/              # Composer dependencies
├── composer.json        # PHP dependencies
├── artisan              # Command-line interface
└── .env                 # Environment configuration
```

## Frontend Structure (React)

```text
frontend/
├── public/              # Static public assets
├── src/                 # React source code
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── store/           # Redux store
│   └── utils/           # Utility functions
├── package.json         # Node.js dependencies
└── vite.config.js       # Build configuration
```

## Organization Benefits

### Professional Structure
- Clear separation of concerns
- Logical grouping of related files
- Easy navigation for new developers
- Industry-standard conventions

### Maintenance
- Centralized documentation in `/docs`
- Organized scripts in `/scripts`
- Proper test organization in `/tests`
- Clean deployment structure

### Development
- No clutter in root directory
- Easy to find specific functionality
- Clear development workflows
- Professional appearance for clients/stakeholders
