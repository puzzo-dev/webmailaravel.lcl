# Email Campaign Management System - Structure & Design Diagram

## 🏗️ **System Architecture Overview**

```mermaid
graph TB
    %% Client Layer
    subgraph "Client Layer"
        WebApp[Web Application<br/>React + TypeScript]
        MobileApp[Mobile App<br/>React Native]
        API[API Clients<br/>REST/GraphQL]
    end

    %% Load Balancer & Gateway
    subgraph "Gateway Layer"
        Nginx[Nginx Reverse Proxy<br/>Load Balancer]
        RateLimit[Rate Limiting<br/>Middleware]
        Auth[Authentication<br/>Middleware]
    end

    %% Application Layer
    subgraph "Application Layer"
        LaravelApp[Laravel Application<br/>API Gateway]
        QueueWorkers[Queue Workers<br/>Background Jobs]
        CronJobs[Cron Jobs<br/>Scheduled Tasks]
    end

    %% Service Layer
    subgraph "Service Layer"
        CampaignService[Campaign Service<br/>Campaign Management]
        EmailService[Email Service<br/>SMTP Integration]
        BillingService[Billing Service<br/>Payment Processing]
        NotificationService[Notification Service<br/>Multi-channel]
        SecurityService[Security Service<br/>2FA & API Keys]
        AnalyticsService[Analytics Service<br/>Business Intelligence]
        FileUploadService[File Upload Service<br/>File Processing]
        BTCPayService[BTCPay Service<br/>Cryptocurrency]
        TelegramService[Telegram Service<br/>Bot Integration]
        PowerMTAService[PowerMTA Service<br/>SMTP Reputation]
        GeoIPService[GeoIP Service<br/>Location Tracking]
        AdminService[Admin Service<br/>System Management]
        BackupService[Backup Service<br/>Data Protection]
        DeviceService[Device Service<br/>Device Management]
        SessionService[Session Service<br/>User Sessions]
        LoggingService[Logging Service<br/>Audit Trail]
        RateLimitService[Rate Limit Service<br/>Throttling]
    end

    %% Data Layer
    subgraph "Data Layer"
        SQLiteDB[(SQLite Database<br/>Primary Storage)]
        RedisCache[(Redis Cache<br/>Session & Cache)]
        FileStorage[File Storage<br/>Uploads & Backups]
    end

    %% External Services
    subgraph "External Services"
        PowerMTA[PowerMTA Server<br/>SMTP Engine]
        BTCPayServer[BTCPay Server<br/>Payment Gateway]
        TelegramBot[Telegram Bot<br/>Notifications]
        GeoIPAPI[GeoIP API<br/>Location Service]
        Pusher[Pusher<br/>Real-time Events]
    end

    %% Client to Gateway
    WebApp --> Nginx
    MobileApp --> Nginx
    API --> Nginx

    %% Gateway to Application
    Nginx --> RateLimit
    RateLimit --> Auth
    Auth --> LaravelApp

    %% Application to Services
    LaravelApp --> CampaignService
    LaravelApp --> EmailService
    LaravelApp --> BillingService
    LaravelApp --> NotificationService
    LaravelApp --> SecurityService
    LaravelApp --> AnalyticsService
    LaravelApp --> FileUploadService
    LaravelApp --> BTCPayService
    LaravelApp --> TelegramService
    LaravelApp --> PowerMTAService
    LaravelApp --> GeoIPService
    LaravelApp --> AdminService
    LaravelApp --> BackupService
    LaravelApp --> DeviceService
    LaravelApp --> SessionService
    LaravelApp --> LoggingService
    LaravelApp --> RateLimitService

    %% Services to Data
    CampaignService --> SQLiteDB
    EmailService --> SQLiteDB
    BillingService --> SQLiteDB
    NotificationService --> SQLiteDB
    SecurityService --> SQLiteDB
    AnalyticsService --> SQLiteDB
    FileUploadService --> FileStorage
    BTCPayService --> SQLiteDB
    TelegramService --> SQLiteDB
    PowerMTAService --> SQLiteDB
    GeoIPService --> SQLiteDB
    AdminService --> SQLiteDB
    BackupService --> SQLiteDB
    DeviceService --> SQLiteDB
    SessionService --> SQLiteDB
    LoggingService --> SQLiteDB
    RateLimitService --> RedisCache

    %% Services to Cache
    CampaignService --> RedisCache
    EmailService --> RedisCache
    AnalyticsService --> RedisCache
    SecurityService --> RedisCache
    SessionService --> RedisCache

    %% Services to External
    EmailService --> PowerMTA
    BillingService --> BTCPayServer
    BTCPayService --> BTCPayServer
    NotificationService --> TelegramBot
    TelegramService --> TelegramBot
    GeoIPService --> GeoIPAPI
    LaravelApp --> Pusher

    %% Background Processing
    QueueWorkers --> CampaignService
    QueueWorkers --> EmailService
    QueueWorkers --> NotificationService
    CronJobs --> BackupService
    CronJobs --> AnalyticsService
    CronJobs --> LoggingService

    %% Styling
    classDef client fill:#e3f2fd
    classDef gateway fill:#f3e5f5
    classDef application fill:#e8f5e8
    classDef service fill:#fff3e0
    classDef data fill:#fce4ec
    classDef external fill:#f1f8e9

    class WebApp,MobileApp,API client
    class Nginx,RateLimit,Auth gateway
    class LaravelApp,QueueWorkers,CronJobs application
    class CampaignService,EmailService,BillingService,NotificationService,SecurityService,AnalyticsService,FileUploadService,BTCPayService,TelegramService,PowerMTAService,GeoIPService,AdminService,BackupService,DeviceService,SessionService,LoggingService,RateLimitService service
    class SQLiteDB,RedisCache,FileStorage data
    class PowerMTA,BTCPayServer,TelegramBot,GeoIPAPI,Pusher external
```

## 🔄 **Data Flow Architecture**

```mermaid
graph TD
    %% Input Sources
    subgraph "Input Sources"
        UserActions[User Actions<br/>Web/Mobile]
        EmailEvents[Email Events<br/>PowerMTA]
        PaymentEvents[Payment Events<br/>BTCPay]
        SystemEvents[System Events<br/>Cron/Queue]
    end

    %% Processing Layer
    subgraph "Processing Layer"
        Controllers[API Controllers<br/>Request Handling]
        Middleware[Middleware Stack<br/>Auth/Rate Limit]
        EventBus[Event Bus<br/>Laravel Events]
        QueueProcessor[Queue Processor<br/>Background Jobs]
    end

    %% Service Layer
    subgraph "Service Layer"
        CoreServices[Core Services<br/>Business Logic]
        ExternalServices[External Services<br/>API Integrations]
        DataServices[Data Services<br/>Storage/Cache]
    end

    %% Storage Layer
    subgraph "Storage Layer"
        Database[(SQLite Database<br/>Primary Data)]
        Cache[(Redis Cache<br/>Session/Cache)]
        Files[File Storage<br/>Uploads/Backups]
    end

    %% Output Layer
    subgraph "Output Layer"
        API[API Responses<br/>JSON/XML]
        Notifications[Notifications<br/>Email/Telegram]
        Reports[Reports<br/>Analytics/Logs]
        Events[Real-time Events<br/>WebSocket]
    end

    %% Data Flow
    UserActions --> Controllers
    EmailEvents --> EventBus
    PaymentEvents --> EventBus
    SystemEvents --> QueueProcessor

    Controllers --> Middleware
    Middleware --> CoreServices
    EventBus --> CoreServices
    QueueProcessor --> CoreServices

    CoreServices --> ExternalServices
    CoreServices --> DataServices
    ExternalServices --> DataServices

    DataServices --> Database
    DataServices --> Cache
    DataServices --> Files

    CoreServices --> API
    CoreServices --> Notifications
    CoreServices --> Reports
    CoreServices --> Events
```

## 🎯 **Service Dependencies & Relationships**

```mermaid
graph LR
    %% Core Services
    subgraph "Core Business Services"
        CampaignService[Campaign Service]
        EmailService[Email Service]
        BillingService[Billing Service]
        NotificationService[Notification Service]
    end

    %% Support Services
    subgraph "Support Services"
        SecurityService[Security Service]
        AnalyticsService[Analytics Service]
        FileUploadService[File Upload Service]
        LoggingService[Logging Service]
    end

    %% External Integrations
    subgraph "External Integrations"
        BTCPayService[BTCPay Service]
        TelegramService[Telegram Service]
        PowerMTAService[PowerMTA Service]
        GeoIPService[GeoIP Service]
    end

    %% Management Services
    subgraph "Management Services"
        AdminService[Admin Service]
        BackupService[Backup Service]
        DeviceService[Device Service]
        SessionService[Session Service]
        RateLimitService[Rate Limit Service]
    end

    %% Dependencies
    CampaignService --> EmailService
    CampaignService --> FileUploadService
    CampaignService --> NotificationService
    CampaignService --> LoggingService

    EmailService --> PowerMTAService
    EmailService --> NotificationService
    EmailService --> LoggingService

    BillingService --> BTCPayService
    BillingService --> NotificationService
    BillingService --> LoggingService

    NotificationService --> TelegramService
    NotificationService --> LoggingService

    SecurityService --> LoggingService
    SecurityService --> DeviceService

    AnalyticsService --> LoggingService
    AnalyticsService --> PowerMTAService

    AdminService --> LoggingService
    AdminService --> DeviceService
    AdminService --> SessionService

    BTCPayService --> LoggingService
    TelegramService --> LoggingService
    PowerMTAService --> LoggingService
    GeoIPService --> LoggingService
```

## 🔐 **Security Architecture**

```mermaid
graph TB
    %% Authentication Layer
    subgraph "Authentication Layer"
        Login[User Login]
        TwoFA[2FA Verification]
        APIKey[API Key Validation]
        Session[Session Management]
    end

    %% Authorization Layer
    subgraph "Authorization Layer"
        Roles[Role-Based Access]
        Permissions[Permission Checks]
        RateLimit[Rate Limiting]
        DeviceLimit[Device Limits]
    end

    %% Security Monitoring
    subgraph "Security Monitoring"
        SecurityLogs[Security Logs]
        SuspiciousActivity[Suspicious Activity Detection]
        AuditTrail[Audit Trail]
        Backup[Security Backups]
    end

    %% Data Protection
    subgraph "Data Protection"
        Encryption[Data Encryption]
        Hashing[Password Hashing]
        Sanitization[Input Sanitization]
        Validation[Data Validation]
    end

    %% Flow
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

## 📊 **Database Schema Overview**

```mermaid
erDiagram
    USERS {
        int id PK
        string email
        string password
        string role
        string country
        string city
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    CAMPAIGNS {
        int id PK
        int user_id FK
        string name
        string subject
        json sender_ids
        json content_ids
        string status
        int recipient_count
        int emails_sent
        int emails_delivered
        int bounces
        int complaints
        datetime started_at
        datetime created_at
        datetime updated_at
    }

    SUBSCRIPTIONS {
        int id PK
        int user_id FK
        int plan_id FK
        string status
        string payment_method
        decimal payment_amount
        string payment_currency
        datetime paid_at
        datetime expiry
        datetime created_at
        datetime updated_at
    }

    DOMAINS {
        int id PK
        int user_id FK
        string name
        float reputation_score
        string risk_level
        float bounce_rate
        float complaint_rate
        datetime created_at
        datetime updated_at
    }

    SENDERS {
        int id PK
        int user_id FK
        int domain_id FK
        string name
        string email
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    CONTENTS {
        int id PK
        int user_id FK
        string subject
        text html_body
        text text_body
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    DEVICES {
        int id PK
        int user_id FK
        string device_id
        string device_name
        string ip_address
        datetime last_seen
        datetime created_at
        datetime updated_at
    }

    LOGS {
        int id PK
        int user_id FK
        string action
        json details
        json metadata
        datetime created_at
    }

    USERS ||--o{ CAMPAIGNS : "creates"
    USERS ||--o{ SUBSCRIPTIONS : "has"
    USERS ||--o{ DOMAINS : "owns"
    USERS ||--o{ SENDERS : "manages"
    USERS ||--o{ CONTENTS : "creates"
    USERS ||--o{ DEVICES : "uses"
    USERS ||--o{ LOGS : "generates"
    DOMAINS ||--o{ SENDERS : "contains"
```

## 🚀 **Deployment Architecture**

```mermaid
graph TB
    %% Client Layer
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile App]
        API[API Clients]
    end

    %% Load Balancer
    subgraph "Load Balancer"
        Nginx[Nginx Reverse Proxy]
    end

    %% Application Layer
    subgraph "Application Layer"
        LaravelApp1[Laravel App 1]
        LaravelApp2[Laravel App 2]
        LaravelApp3[Laravel App 3]
        QueueWorkers[Queue Workers]
        CronJobs[Cron Jobs]
    end

    %% Data Layer
    subgraph "Data Layer"
        SQLiteDB[(SQLite Database)]
        RedisCache[(Redis Cache)]
        FileStorage[File Storage]
    end

    %% External Services
    subgraph "External Services"
        PowerMTAServer[PowerMTA Server]
        BTCPayServer[BTCPay Server]
        TelegramBot[Telegram Bot]
    end

    %% Network Flow
    Browser --> Nginx
    Mobile --> Nginx
    API --> Nginx

    Nginx --> LaravelApp1
    Nginx --> LaravelApp2
    Nginx --> LaravelApp3

    LaravelApp1 --> SQLiteDB
    LaravelApp2 --> SQLiteDB
    LaravelApp3 --> SQLiteDB

    LaravelApp1 --> RedisCache
    LaravelApp2 --> RedisCache
    LaravelApp3 --> RedisCache

    LaravelApp1 --> FileStorage
    LaravelApp2 --> FileStorage
    LaravelApp3 --> FileStorage

    LaravelApp1 --> PowerMTAServer
    LaravelApp2 --> BTCPayServer
    LaravelApp3 --> TelegramBot

    QueueWorkers --> SQLiteDB
    QueueWorkers --> RedisCache
    CronJobs --> FileStorage
```

## 🔄 **Request Flow Diagram**

```mermaid
sequenceDiagram
    participant Client
    participant Nginx
    participant Laravel
    participant Service
    participant Database
    participant External

    Client->>Nginx: HTTP Request
    Nginx->>Laravel: Proxy Request
    Laravel->>Laravel: Authentication
    Laravel->>Laravel: Rate Limiting
    Laravel->>Laravel: Validation
    Laravel->>Service: Call Service
    Service->>Database: Query Data
    Database-->>Service: Return Data
    Service->>External: External API Call
    External-->>Service: API Response
    Service-->>Laravel: Service Response
    Laravel->>Laravel: Format Response
    Laravel-->>Nginx: JSON Response
    Nginx-->>Client: HTTP Response
```

## 📈 **Performance & Scalability**

```mermaid
graph TB
    %% Performance Factors
    subgraph "Performance Factors"
        Caching[Redis Caching]
        Queueing[Background Jobs]
        Optimization[Query Optimization]
        CDN[CDN for Assets]
    end

    %% Scalability Features
    subgraph "Scalability Features"
        Horizontal[Horizontal Scaling]
        LoadBalancing[Load Balancing]
        Microservices[Service Separation]
        Database[Database Optimization]
    end

    %% Monitoring
    subgraph "Monitoring"
        Metrics[Performance Metrics]
        Logging[Comprehensive Logging]
        Alerts[Automated Alerts]
        Health[Health Checks]
    end

    %% Optimization
    subgraph "Optimization"
        Indexing[Database Indexing]
        Compression[Response Compression]
        Minification[Asset Minification]
        LazyLoading[Lazy Loading]
    end

    Caching --> Metrics
    Queueing --> Monitoring
    Optimization --> Performance
    CDN --> Scalability

    Horizontal --> LoadBalancing
    LoadBalancing --> Microservices
    Microservices --> Database

    Metrics --> Alerts
    Logging --> Health
    Alerts --> Monitoring
    Health --> Performance

    Indexing --> Optimization
    Compression --> Performance
    Minification --> Scalability
    LazyLoading --> Optimization
```

## 🎨 **Technology Stack**

```mermaid
graph TB
    %% Frontend
    subgraph "Frontend"
        React[React 18]
        TypeScript[TypeScript]
        TailwindCSS[Tailwind CSS]
        Vite[Vite Build Tool]
    end

    %% Backend
    subgraph "Backend"
        Laravel[Laravel 12]
        PHP[PHP 8.2+]
        SQLite[SQLite 3]
        Redis[Redis Cache]
    end

    %% External Services
    subgraph "External Services"
        PowerMTA[PowerMTA]
        BTCPay[BTCPay Server]
        Telegram[Telegram Bot API]
        GeoIP[GeoIP Service]
        Pusher[Pusher Broadcasting]
    end

    %% Development Tools
    subgraph "Development Tools"
        Git[Git Version Control]
        Docker[Docker Containerization]
        CI[CI/CD Pipeline]
        Testing[PHPUnit Testing]
    end

    %% Infrastructure
    subgraph "Infrastructure"
        Nginx[Nginx Web Server]
        SSL[SSL/TLS Certificates]
        Backup[Automated Backups]
        Monitoring[System Monitoring]
    end

    React --> TypeScript
    TypeScript --> TailwindCSS
    TailwindCSS --> Vite

    Laravel --> PHP
    PHP --> SQLite
    SQLite --> Redis

    Laravel --> PowerMTA
    Laravel --> BTCPay
    Laravel --> Telegram
    Laravel --> GeoIP
    Laravel --> Pusher

    Git --> Docker
    Docker --> CI
    CI --> Testing

    Nginx --> SSL
    SSL --> Backup
    Backup --> Monitoring
```

## 📋 **System Components Summary**

### **Core Components**
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Laravel 12 + PHP 8.2+ + SQLite
- **Cache**: Redis for sessions and caching
- **Queue**: Laravel Queue for background jobs
- **Real-time**: Pusher for WebSocket events

### **External Integrations**
- **Email**: PowerMTA for SMTP reputation analysis
- **Payments**: BTCPay for cryptocurrency billing
- **Notifications**: Telegram Bot for instant notifications
- **Location**: GeoIP service for user location tracking

### **Security Features**
- **Authentication**: Multi-factor authentication (2FA)
- **Authorization**: Role-based access control
- **API Security**: API key management
- **Rate Limiting**: Request throttling
- **Audit Trail**: Comprehensive logging

### **Scalability Features**
- **Horizontal Scaling**: Multiple Laravel instances
- **Load Balancing**: Nginx reverse proxy
- **Caching**: Redis for performance optimization
- **Background Processing**: Queue workers for heavy tasks
- **Database Optimization**: Indexing and query optimization

This architecture provides a robust, scalable, and secure foundation for the email campaign management system with clear separation of concerns and modern development practices. 