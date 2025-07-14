# Email Campaign Management System - Architecture Flowchart

```mermaid
graph TB
    %% User Interface Layer
    subgraph "Frontend (React + TypeScript)"
        UI[User Interface]
        Dashboard[Dashboard]
        Campaigns[Campaign Management]
        Analytics[Analytics Dashboard]
        Admin[Admin Panel]
    end

    %% API Gateway Layer
    subgraph "API Gateway (Laravel)"
        API[API Routes]
        Auth[Authentication]
        RateLimit[Rate Limiting]
        Middleware[Middleware Stack]
    end

    %% Core Services Layer
    subgraph "Core Services"
        CampaignService[Campaign Service]
        EmailService[Email Service]
        BillingService[Billing Service]
        NotificationService[Notification Service]
        SecurityService[Security Service]
        AnalyticsService[Analytics Service]
    end

    %% External Integrations
    subgraph "External Services"
        PowerMTA[PowerMTA]
        BTCPay[BTCPay Server]
        Telegram[Telegram Bot]
        GeoIP[GeoIP Service]
        Redis[Redis Cache]
    end

    %% Data Layer
    subgraph "Data Storage"
        SQLite[(SQLite Database)]
        RedisStore[(Redis Store)]
        FileStorage[File Storage]
    end

    %% Queue System
    subgraph "Queue System"
        Queue[Laravel Queue]
        Jobs[Background Jobs]
        Workers[Queue Workers]
    end

    %% User Flow
    UI --> API
    Dashboard --> API
    Campaigns --> API
    Analytics --> API
    Admin --> API

    %% API Gateway Flow
    API --> Auth
    Auth --> RateLimit
    RateLimit --> Middleware
    Middleware --> CampaignService
    Middleware --> BillingService
    Middleware --> SecurityService

    %% Campaign Flow
    CampaignService --> EmailService
    CampaignService --> FileStorage
    CampaignService --> RedisStore
    EmailService --> PowerMTA
    EmailService --> Queue

    %% Billing Flow
    BillingService --> BTCPay
    BillingService --> NotificationService
    BillingService --> SQLite

    %% Notification Flow
    NotificationService --> Telegram
    NotificationService --> SQLite

    %% Security Flow
    SecurityService --> SQLite
    SecurityService --> RedisStore

    %% Analytics Flow
    AnalyticsService --> SQLite
    AnalyticsService --> RedisStore
    AnalyticsService --> PowerMTA

    %% Data Storage
    CampaignService --> SQLite
    EmailService --> SQLite
    BillingService --> SQLite
    NotificationService --> SQLite
    SecurityService --> SQLite
    AnalyticsService --> SQLite

    %% Queue Processing
    Queue --> Jobs
    Jobs --> Workers
    Workers --> EmailService
    Workers --> NotificationService
    Workers --> AnalyticsService

    %% External Data
    PowerMTA --> AnalyticsService
    BTCPay --> BillingService
    Telegram --> NotificationService
    GeoIP --> SecurityService

    %% Cache Layer
    RedisStore --> CampaignService
    RedisStore --> EmailService
    RedisStore --> AnalyticsService

    %% File Operations
    FileStorage --> CampaignService
    FileStorage --> EmailService

    %% Styling
    classDef frontend fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef service fill:#e8f5e8
    classDef external fill:#fff3e0
    classDef data fill:#fce4ec
    classDef queue fill:#f1f8e9

    class UI,Dashboard,Campaigns,Analytics,Admin frontend
    class API,Auth,RateLimit,Middleware api
    class CampaignService,EmailService,BillingService,NotificationService,SecurityService,AnalyticsService service
    class PowerMTA,BTCPay,Telegram,GeoIP,Redis external
    class SQLite,RedisStore,FileStorage data
    class Queue,Jobs,Workers queue
```

## Detailed Service Architecture

```mermaid
graph LR
    subgraph "Campaign Management Flow"
        A[User Creates Campaign] --> B[CampaignService]
        B --> C[Validate Data]
        C --> D[Check User Limits]
        D --> E[Process Content Variations]
        E --> F[Upload Recipient List]
        F --> G[Store in Database]
        G --> H[Queue Campaign Job]
        H --> I[Start Campaign]
        I --> J[EmailService]
        J --> K[PowerMTA]
    end

    subgraph "Email Sending Flow"
        K --> L[Get SMTP Config]
        L --> M[Prepare Email Data]
        M --> N[Send via PowerMTA]
        N --> O[Track Delivery]
        O --> P[Update Analytics]
    end

    subgraph "Billing Flow"
        Q[User Subscribes] --> R[BillingService]
        R --> S[Create BTCPay Invoice]
        S --> T[Process Payment]
        T --> U[Update Subscription]
        U --> V[Send Notification]
    end

    subgraph "Security Flow"
        W[User Login] --> X[SecurityService]
        X --> Y[2FA Verification]
        Y --> Z[API Key Validation]
        Z --> AA[Rate Limiting]
        AA --> BB[Session Management]
    end

    subgraph "Analytics Flow"
        CC[Data Collection] --> DD[AnalyticsService]
        DD --> EE[Process Metrics]
        EE --> FF[Generate Reports]
        FF --> GG[Store Results]
        GG --> HH[Display Dashboard]
    end
```

## Data Flow Architecture

```mermaid
graph TD
    subgraph "Input Sources"
        UserInput[User Actions]
        EmailEvents[Email Events]
        PaymentEvents[Payment Events]
        SystemEvents[System Events]
    end

    subgraph "Processing Layer"
        EventBus[Event Bus]
        QueueProcessor[Queue Processor]
        JobDispatcher[Job Dispatcher]
    end

    subgraph "Services"
        CampaignProcessor[Campaign Processor]
        EmailProcessor[Email Processor]
        BillingProcessor[Billing Processor]
        AnalyticsProcessor[Analytics Processor]
    end

    subgraph "Storage Layer"
        Database[(SQLite Database)]
        Cache[(Redis Cache)]
        Files[File Storage]
    end

    subgraph "Output"
        Notifications[Notifications]
        Reports[Reports]
        Logs[Logs]
        ExternalAPIs[External APIs]
    end

    UserInput --> EventBus
    EmailEvents --> EventBus
    PaymentEvents --> EventBus
    SystemEvents --> EventBus

    EventBus --> QueueProcessor
    QueueProcessor --> JobDispatcher
    JobDispatcher --> CampaignProcessor
    JobDispatcher --> EmailProcessor
    JobDispatcher --> BillingProcessor
    JobDispatcher --> AnalyticsProcessor

    CampaignProcessor --> Database
    EmailProcessor --> Database
    BillingProcessor --> Database
    AnalyticsProcessor --> Database

    CampaignProcessor --> Cache
    EmailProcessor --> Cache
    BillingProcessor --> Cache
    AnalyticsProcessor --> Cache

    CampaignProcessor --> Files
    EmailProcessor --> Files

    CampaignProcessor --> Notifications
    EmailProcessor --> Reports
    BillingProcessor --> Notifications
    AnalyticsProcessor --> Reports

    CampaignProcessor --> Logs
    EmailProcessor --> Logs
    BillingProcessor --> Logs
    AnalyticsProcessor --> Logs

    EmailProcessor --> ExternalAPIs
    BillingProcessor --> ExternalAPIs
```

## Component Dependencies

```mermaid
graph TB
    subgraph "Core Dependencies"
        Laravel[Laravel Framework]
        React[React Frontend]
        SQLite[SQLite Database]
        Redis[Redis Cache]
    end

    subgraph "External Dependencies"
        PowerMTA[PowerMTA]
        BTCPay[BTCPay Server]
        Telegram[Telegram API]
        GeoIP[GeoIP Service]
    end

    subgraph "Laravel Packages"
        SpatiePermission[Spatie Permission]
        Google2FA[Google2FA]
        Pusher[Pusher Broadcasting]
    end

    subgraph "Frontend Dependencies"
        Vite[Vite Build Tool]
        TailwindCSS[Tailwind CSS]
        TypeScript[TypeScript]
    end

    Laravel --> SQLite
    Laravel --> Redis
    Laravel --> SpatiePermission
    Laravel --> Google2FA
    Laravel --> Pusher

    React --> Vite
    React --> TailwindCSS
    React --> TypeScript

    Laravel --> PowerMTA
    Laravel --> BTCPay
    Laravel --> Telegram
    Laravel --> GeoIP

    React --> Laravel
```

## Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layer"
        Login[User Login]
        TwoFA[2FA Verification]
        APIKey[API Key Validation]
        Session[Session Management]
    end

    subgraph "Authorization Layer"
        Roles[Role-Based Access]
        Permissions[Permission Checks]
        RateLimit[Rate Limiting]
        DeviceLimit[Device Limits]
    end

    subgraph "Security Monitoring"
        SecurityLogs[Security Logs]
        SuspiciousActivity[Suspicious Activity Detection]
        AuditTrail[Audit Trail]
        Backup[Security Backups]
    end

    subgraph "Data Protection"
        Encryption[Data Encryption]
        Hashing[Password Hashing]
        Sanitization[Input Sanitization]
        Validation[Data Validation]
    end

    Login --> TwoFA
    TwoFA --> APIKey
    APIKey --> Session
    Session --> Roles
    Roles --> Permissions
    Permissions --> RateLimit
    RateLimit --> DeviceLimit

    Login --> SecurityLogs
    TwoFA --> SecurityLogs
    APIKey --> SecurityLogs
    Session --> SecurityLogs

    SecurityLogs --> SuspiciousActivity
    SuspiciousActivity --> AuditTrail
    AuditTrail --> Backup

    Login --> Encryption
    TwoFA --> Hashing
    APIKey --> Sanitization
    Session --> Validation
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile App]
        API[API Clients]
    end

    subgraph "Load Balancer"
        Nginx[Nginx Reverse Proxy]
    end

    subgraph "Application Layer"
        LaravelApp[Laravel Application]
        QueueWorkers[Queue Workers]
        CronJobs[Cron Jobs]
    end

    subgraph "Data Layer"
        SQLiteDB[(SQLite Database)]
        RedisCache[(Redis Cache)]
        FileStorage[File Storage]
    end

    subgraph "External Services"
        PowerMTAServer[PowerMTA Server]
        BTCPayServer[BTCPay Server]
        TelegramBot[Telegram Bot]
    end

    Browser --> Nginx
    Mobile --> Nginx
    API --> Nginx

    Nginx --> LaravelApp
    Nginx --> LaravelApp
    Nginx --> LaravelApp

    LaravelApp --> SQLiteDB
    LaravelApp --> RedisCache
    LaravelApp --> FileStorage

    LaravelApp --> PowerMTAServer
    LaravelApp --> BTCPayServer
    LaravelApp --> TelegramBot

    QueueWorkers --> SQLiteDB
    QueueWorkers --> RedisCache
    QueueWorkers --> FileStorage

    CronJobs --> LaravelApp
    CronJobs --> QueueWorkers
``` 