# Agent Configuration - WebMail Laravel System

## Commands
**Backend (Laravel):**
- Test: `cd backend && php artisan test` or `cd backend && composer test`
- Build: `cd backend && composer build` (via Vite)
- Dev: `cd backend && composer dev` (serves backend + queue + logs + vite)
- Single test: `cd backend && php artisan test --filter=TestName`
- Lint: `cd backend && vendor/bin/pint` (Laravel Pint for PHP)

**Frontend (React):**
- Test: No tests configured
- Build: `cd frontend && npm run build`
- Dev: `cd frontend && npm run dev` (Vite dev server on port 3000)
- Lint: `cd frontend && npm run lint` (ESLint)

## Architecture
- **Monorepo**: backend/ (Laravel 12 + PHP 8.2+), frontend/ (React + Redux + Vite)
- **Database**: SQLite (development), MySQL (production)
- **Queue**: Redis with Laravel jobs (ProcessCampaignJob, SendEmailJob, BackupJob, etc.)
- **Services**: CampaignService, EmailService, AnalyticsService, BounceProcessingService, AutomaticTrainingService
- **External**: SMTP servers, Telegram API, Pusher WebSockets, PowerMTA, IMAP/POP3
- **Storage**: File uploads (recipients, templates), backup files, PowerMTA CSV processing

## Code Style
**PHP/Laravel:**
- PSR-4 autoloading, namespace App\
- Controllers in Http/Controllers/, Services in Services/, Models in Models/
- Use Laravel facades: Cache, Http, Validator, Response
- Standardized response patterns via ResponseService
- Traits for reusable functionality
- Snake_case for database, camelCase for variables

**JavaScript/React:**
- ES modules, JSX, functional components with hooks
- Redux Toolkit for state, axios for HTTP
- camelCase naming, PascalCase for components
- ESLint config: unused vars with varsIgnorePattern '^[A-Z_]'

## Key Features
Email campaign management with sender limits, bounce processing, analytics, suppression lists, automatic training system, PowerMTA integration, real-time notifications via Telegram/WebSockets.
