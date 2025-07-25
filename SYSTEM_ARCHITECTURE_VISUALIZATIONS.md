# System Architecture Visualizations

This document contains comprehensive system architecture diagrams for the WebMail Laravel project.

**Developed by [I-Varse Technologies](https://ivarsetech.com)**

*Last Updated: July 2025 - Includes Automatic Training, PowerMTA Integration, and Advanced Bounce Processing*

## 1. Complete System Architecture Overview

```mermaid
graph TB
    %% User Layer
    subgraph "👥 Users"
        U1[Admin Users]
        U2[Regular Users]
    end

    %% Frontend Layer
    subgraph "🖥️ Frontend (React + Redux)"
        F1[Authentication Pages]
        F2[Campaign Builder]
        F3[Dashboard]
        F4[Domain Management]
        F5[Sender Management]
        F6[Analytics]
        F7[Admin Panel]
        F8[Notification Center]
        F9[Suppression Lists]
        F10[Billing System]
    end

    %% API Layer
    subgraph "🔌 API Layer (Laravel)"
        A1[Auth Controller]
        A2[Campaign Controller]
        A3[Domain Controller]
        A4[Sender Controller]
        A5[Analytics Controller]
        A6[Admin Controller]
        A7[Notification Controller]
        A8[Backup Controller]
    end

    %% Service Layer
    subgraph "⚙️ Service Layer"
        S1[Campaign Service]
        S2[Email Service]
        S3[Analytics Service]
        S4[Backup Service]
        S5[Notification Service]
        S6[File Processing Service]
        S7[Suppression Service]
        S8[Bounce Processing Service]
        S9[Automatic Training Service]
        S10[PowerMTA Service]
    end

    %% Job Queue System
    subgraph "🔄 Queue System"
        Q1[Process Campaign Job]
        Q2[Send Email Job]
        Q3[Backup Job]
        Q4[Analytics Job]
        Q5[Cleanup Job]
        Q6[Process Bounces Job]
        Q7[Automatic Training Job]
    end

    %% Notification System
    subgraph "🔔 Notification System"
        N1[Campaign Created]
        N2[Campaign Completed]
        N3[Campaign Failed]
        N4[Campaign Milestone]
        N5[High Bounce Alert]
        N6[Admin Notifications]
    end

    %% Database Layer
    subgraph "🗄️ Database (MySQL)"
        DB1[(Users)]
        DB2[(Campaigns)]
        DB3[(Domains)]
        DB4[(Senders)]
        DB5[(Email Tracking)]
        DB6[(Notifications)]
        DB7[(Backups)]
        DB8[(Suppression Lists)]
        DB9[(Contents)]
        DB10[(Bounce Credentials)]
        DB11[(Bounce Processing Logs)]
        DB12[(Sender Training Data)]
    end

    %% External Services
    subgraph "🌐 External Services"
        E1[📧 SMTP Servers]
        E2[📱 Telegram API]
        E3[📊 Pusher WebSockets]
        E4[☁️ File Storage]
        E5[📈 Analytics APIs]
        E6[🔧 PowerMTA Server]
        E7[📮 IMAP/POP3 Servers]
    end

    %% File System
    subgraph "📁 File System"
        FS1[Recipient Lists]
        FS2[Email Templates]
        FS3[Backup Files]
        FS4[Uploaded Assets]
        FS5[PowerMTA CSV Files]
        FS6[FBL Files]
    end

    %% User Interactions
    U1 --> F7
    U1 --> F3
    U2 --> F1
    U2 --> F2
    U2 --> F3
    U2 --> F4
    U2 --> F5
    U2 --> F6
    U2 --> F8
    U2 --> F10

    %% Frontend to API
    F1 --> A1
    F2 --> A2
    F3 --> A2
    F3 --> A5
    F4 --> A3
    F5 --> A4
    F6 --> A5
    F7 --> A6
    F8 --> A7
    F9 --> A2
    F10 --> A6

    %% API to Services
    A1 --> S5
    A2 --> S1
    A2 --> S7
    A3 --> S1
    A4 --> S1
    A5 --> S3
    A6 --> S4
    A6 --> S3
    A7 --> S5
    A8 --> S4

    %% Services to Jobs
    S1 --> Q1
    S1 --> Q2
    S3 --> Q4
    S4 --> Q3
    S6 --> Q5
    S8 --> Q6
    S9 --> Q7

    %% Services to Notifications
    S1 --> N1
    S1 --> N2
    S1 --> N3
    S1 --> N4
    S1 --> N5
    S5 --> N6

    %% Jobs to Database
    Q1 --> DB2
    Q2 --> DB5
    Q3 --> DB7
    Q4 --> DB5

    %% Services to Database
    S1 --> DB1
    S1 --> DB2
    S1 --> DB3
    S1 --> DB4
    S1 --> DB9
    S3 --> DB5
    S4 --> DB7
    S5 --> DB6
    S7 --> DB8
    S8 --> DB10
    S8 --> DB11
    S8 --> DB8
    S9 --> DB4
    S9 --> DB12
    S10 --> DB4

    %% Services to External
    S1 --> E1
    S5 --> E2
    S1 --> E3
    S4 --> E4
    S3 --> E5
    S8 --> E7
    S9 --> E6
    S10 --> E6

    %% Services to File System
    S1 --> FS1
    S1 --> FS2
    S4 --> FS3
    S6 --> FS4
    S8 --> FS6
    S9 --> FS5
    S10 --> FS5

    %% Real-time Updates
    E3 --> F8
    E3 --> F3

    %% Notification Channels
    N1 --> E2
    N2 --> E2
    N3 --> E2
    N4 --> E3
    N5 --> E2
    N6 --> E2

    %% Styling
    classDef userClass fill:#e1f5fe
    classDef frontendClass fill:#f3e5f5
    classDef apiClass fill:#e8f5e8
    classDef serviceClass fill:#fff3e0
    classDef jobClass fill:#fce4ec
    classDef notificationClass fill:#e0f2f1
    classDef databaseClass fill:#f1f8e9
    classDef externalClass fill:#fff8e1
    classDef fileClass fill:#f9fbe7

    class U1,U2 userClass
    class F1,F2,F3,F4,F5,F6,F7,F8,F9,F10 frontendClass
    class A1,A2,A3,A4,A5,A6,A7,A8 apiClass
    class S1,S2,S3,S4,S5,S6,S7,S8,S9,S10 serviceClass
    class Q1,Q2,Q3,Q4,Q5,Q6,Q7 jobClass
    class N1,N2,N3,N4,N5,N6 notificationClass
    class DB1,DB2,DB3,DB4,DB5,DB6,DB7,DB8,DB9,DB10,DB11,DB12 databaseClass
    class E1,E2,E3,E4,E5,E6,E7 externalClass
    class FS1,FS2,FS3,FS4,FS5,FS6 fileClass
```

## 2. System Features and Capabilities

```mermaid
graph TD
    subgraph "📊 Key Features & Capabilities"
        subgraph "🚀 Campaign Management"
            CM1[Multi-Sender Campaigns]
            CM2[Content Variations]
            CM3[Template Variables]
            CM4[Recipient File Upload]
            CM5[Campaign Scheduling]
            CM6[Real-time Monitoring]
            CM7[Suppression Lists]
            CM8[Single Email Send]
            CM9[Sender Daily Limits]
        end

        subgraph "📈 Analytics & Tracking"
            AT1[Open/Click Tracking]
            AT2[Bounce Monitoring]
            AT3[Sender Performance]
            AT4[Domain Analytics]
            AT5[Geographic Insights]
            AT6[Real-time Statistics]
            AT7[Sender Reputation Scoring]
            AT8[PowerMTA Integration]
        end

        subgraph "🔐 Admin Features"
            AF1[User Management]
            AF2[System Monitoring]
            AF3[Queue Management]
            AF4[Backup System]
            AF5[Domain Verification]
            AF6[Global Settings]
            AF7[Notification Management]
            AF8[Bounce Credentials Management]
            AF9[Training Statistics]
            AF10[PowerMTA Configuration]
        end

        subgraph "🔔 Notification System"
            NS1[Multi-Channel Delivery]
            NS2[Campaign Milestones]
            NS3[Failure Alerts]
            NS4[Performance Warnings]
            NS5[Admin Notifications]
            NS6[Real-time Updates]
        end

        subgraph "🛠️ Technical Features"
            TF1[Queue-based Processing]
            TF2[File Management]
            TF3[Cache Optimization]
            TF4[Error Handling]
            TF5[Security Measures]
            TF6[API Rate Limiting]
            TF7[Automated Backups]
            TF8[Automatic Training System]
            TF9[CSV File Processing]
            TF10[IMAP/POP3 Integration]
        end
    end

    subgraph "🔄 Data Flow"
        DF1[User Creates Campaign] --> DF2[File Upload & Processing]
        DF2 --> DF3[Validation & Storage]
        DF3 --> DF4[Queue Job Dispatch]
        DF4 --> DF5[Email Processing]
        DF5 --> DF6[Tracking & Analytics]
        DF6 --> DF7[Real-time Updates]
        DF7 --> DF8[Notifications]
    end

    subgraph "🗂️ System Architecture Layers"
        L1[Presentation Layer - React Frontend]
        L2[API Layer - Laravel Controllers]
        L3[Business Logic - Services]
        L4[Queue Processing - Jobs]
        L5[Data Layer - Models & Database]
        L6[Infrastructure - External Services]
        
        L1 --> L2
        L2 --> L3
        L3 --> L4
        L4 --> L5
        L3 --> L6
    end

    style CM1 fill:#e3f2fd
    style AT1 fill:#e8f5e8
    style AF1 fill:#fff3e0
    style NS1 fill:#f3e5f5
    style TF1 fill:#fce4ec
    style DF1 fill:#e0f2f1
    style L1 fill:#f1f8e9
```

## 3. Advanced Features - Automatic Training & Bounce Processing

```mermaid
graph TB
    subgraph "🎯 Automatic Training System"
        AT1[PowerMTA CSV Analysis]
        AT2[Sender Reputation Calculation] 
        AT3[Daily Limit Adjustment]
        AT4[Performance Monitoring]
        
        AT1 --> AT2
        AT2 --> AT3
        AT3 --> AT4
        AT4 --> AT1
    end
    
    subgraph "📊 Reputation Scoring"
        RS1[Delivery Rate Analysis]
        RS2[Bounce Rate Penalties]
        RS3[Complaint Rate Impact]
        RS4[Volume Bonuses]
        
        RS1 --> RS5[Final Score: 1-100]
        RS2 --> RS5
        RS3 --> RS5
        RS4 --> RS5
    end
    
    subgraph "📈 Dynamic Limit Scaling"
        DL1[95%+ Reputation → 1000 emails/day]
        DL2[90-94% Reputation → 500 emails/day]
        DL3[80-89% Reputation → 150-250 emails/day]
        DL4[50-79% Reputation → 10-75 emails/day]
        DL5[<50% Reputation → 1-10 emails/day]
    end
    
    subgraph "🔍 PowerMTA File Processing"
        PF1[Accounting Files - acct*.csv]
        PF2[Diagnostic Files - diag*.csv]
        PF3[FBL Files - fbl*.csv]
        
        PF1 --> PF4[Failed Delivery Detection]
        PF2 --> PF5[Hard Bounce Detection]
        PF3 --> PF6[Spam Complaint Detection]
        
        PF4 --> PF7[Suppression List Update]
        PF5 --> PF7
        PF6 --> PF7
    end
    
    subgraph "⚡ Bounce Processing Integration"
        BP1[IMAP/POP3 Bounce Processing]
        BP2[PowerMTA File Processing]
        BP3[Unified Suppression List]
        BP4[Real-time Email Blocking]
        
        BP1 --> BP3
        BP2 --> BP3
        BP3 --> BP4
    end
    
    subgraph "⏰ Automated Scheduling"
        AS1[Hourly: PowerMTA File Processing]
        AS2[Every 30min: IMAP Bounce Processing]
        AS3[Daily 2AM: Automatic Training]
        AS4[Real-time: Email Sending Limits]
    end
    
    %% Connections between systems
    AT2 --> RS1
    RS5 --> DL1
    RS5 --> DL2
    RS5 --> DL3
    RS5 --> DL4
    RS5 --> DL5
    
    PF1 --> AT1
    PF2 --> AT1
    PF3 --> AT1
    
    BP2 --> PF1
    BP2 --> PF2
    BP2 --> PF3
    
    AS3 --> AT1
    AS1 --> BP2
    AS2 --> BP1
    AS4 --> DL1
    
    %% Styling
    style AT1 fill:#e3f2fd
    style RS5 fill:#e8f5e8
    style PF7 fill:#fff3e0
    style BP3 fill:#f3e5f5
    style AS3 fill:#fce4ec
```

## 4. Enhanced Campaign Lifecycle with Sender Limits

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant S as Services
    participant Q as Queue
    participant D as Database
    participant E as External Services
    participant N as Notifications

    Note over U,N: Complete Campaign Lifecycle

    %% Campaign Creation
    U->>F: Create Campaign
    F->>A: POST /campaigns
    A->>S: CampaignService
    S->>D: Store Campaign
    S->>Q: Process File Upload
    Q->>D: Store Recipients
    S->>N: Campaign Created Notification
    N->>E: Send via Email/Telegram
    A->>F: Campaign Created Response
    F->>U: Success Message

    %% Campaign Execution
    U->>F: Start Campaign
    F->>A: POST /campaigns/{id}/start
    A->>S: CampaignService.startCampaign()
    S->>Q: Dispatch ProcessCampaignJob
    S->>N: Status Changed Notification
    
    loop Email Processing
        Q->>D: Get Next Batch
        Q->>D: Check Sender Daily Limits
        alt Sender Limit Exceeded
            Q->>Q: Re-queue for Later
        else Sender Available
            Q->>E: Send Emails via SMTP
            Q->>D: Increment Sender Count
            Q->>D: Update Statistics
        end
        Q->>S: Check Milestones
        alt Milestone Reached
            S->>N: Milestone Notification
            N->>E: Real-time Broadcast
        end
        alt High Bounce Rate
            S->>N: Bounce Alert
            N->>E: Urgent Notification
        end
    end

    %% Campaign Completion
    Q->>S: All Emails Processed
    S->>D: Mark Complete
    S->>N: Completion Notification
    N->>E: Final Statistics
    S->>A: Return Results
    A->>F: Real-time Update
    F->>U: Campaign Complete

    %% Analytics & Tracking
    loop User Interactions
        E->>A: Email Opens/Clicks
        A->>D: Store Tracking Data
        A->>S: Update Analytics
        S->>F: Real-time Updates
    end

    Note over U,N: System provides continuous monitoring, alerts, and insights
```

## 5. Campaign Notification System

```mermaid
graph TD
    A[Campaign Events] --> B[Notification Types]
    
    A --> A1[Campaign Created]
    A --> A2[Campaign Started]
    A --> A3[Campaign Progress]
    A --> A4[Campaign Completed]
    A --> A5[Campaign Failed]
    A --> A6[High Bounce Rate]
    
    A1 --> B1[CampaignCreated Notification]
    A2 --> B2[CampaignStatusChanged Notification]
    A3 --> B3[CampaignMilestone Notification]
    A4 --> B4[CampaignCompleted Notification]
    A5 --> B5[CampaignFailed Notification]
    A6 --> B6[HighBounceRateAlert Notification]
    
    B1 --> C[Delivery Channels]
    B2 --> C
    B3 --> C
    B4 --> C
    B5 --> C
    B6 --> C
    
    C --> C1[📧 Email]
    C --> C2[💾 Database]
    C --> C3[📡 Real-time Broadcast]
    C --> C4[📱 Telegram]
    
    D[Frontend Display] --> D1[📊 Dashboard Notifications]
    D[Frontend Display] --> D2[🔔 Real-time Updates]
    D[Frontend Display] --> D3[📋 Notification Center]
    
    C2 --> D1
    C3 --> D2
    C2 --> D3
    
    E[Milestones] --> E1[25% Complete]
    E[Milestones] --> E2[50% Complete]
    E[Milestones] --> E3[75% Complete]
    E[Milestones] --> E4[90% Complete]
    
    F[Alert Thresholds] --> F1[Bounce Rate > 10%]
    
    style B1 fill:#e3f2fd
    style B2 fill:#e3f2fd
    style B3 fill:#f3e5f5
    style B4 fill:#e8f5e8
    style B5 fill:#ffebee
    style B6 fill:#fff3e0
```

## System Strengths & Capabilities

### ✅ **Scalable Architecture**
- Queue-based processing handles large campaigns
- Microservice-style separation of concerns
- Horizontal scaling capabilities
- **NEW**: Automatic sender limit management prevents overload

### ✅ **Real-time Features**
- WebSocket integration for live monitoring
- Instant notifications across multiple channels
- Live dashboard updates
- **NEW**: Real-time sender reputation tracking

### ✅ **Comprehensive Monitoring**
- Multi-channel notification system
- Detailed analytics and performance insights
- Proactive bounce rate monitoring
- **NEW**: PowerMTA CSV file analysis and processing

### ✅ **Admin Control**
- Complete system management capabilities
- User management and access control
- System-wide configuration management
- **NEW**: Training statistics and bounce credentials management

### ✅ **Security & Reliability**
- Proper authentication and authorization
- Backup systems and data protection
- Input validation and suppression lists
- **NEW**: Automated bounce processing from multiple sources

### ✅ **Production Ready**
- Error handling and logging
- Queue management and monitoring
- Performance optimization with caching
- **NEW**: Scheduled automatic training and maintenance

### ✅ **Advanced Email Management** *(New Features)*
- **Automatic Training System**: Daily reputation analysis and limit adjustment
- **PowerMTA Integration**: Complete CSV file processing (Acct, Diag, FBL)
- **Intelligent Bounce Processing**: Unified IMAP/POP3 and PowerMTA bounce handling
- **Dynamic Sender Limits**: Reputation-based daily sending limits (1-1000 emails)
- **Real-time Limit Enforcement**: Highest priority checking during email sending
- **Comprehensive Suppression**: Multi-source email suppression list management

### ✅ **Automation & Intelligence**
- **Scheduled Processing**: Hourly PowerMTA analysis, daily training
- **Smart Reputation Scoring**: Delivery rate, bounce rate, and complaint analysis
- **Adaptive Limits**: Automatic scaling based on sender performance
- **Proactive Protection**: Real-time email blocking for poor performers

---

## 🏆 **Recent Major Updates (July 2025)**

### 🎯 **Automatic Training Feature**
- **PowerMTA CSV Analysis**: Automated processing of accounting, diagnostic, and FBL files
- **Reputation Scoring**: Intelligent calculation based on delivery performance
- **Dynamic Limits**: Automatic adjustment of sender daily limits (1-1000 emails)
- **Scheduled Execution**: Daily training at 2:00 AM for optimal performance

### 🔄 **Enhanced Bounce Processing**  
- **Dual Processing**: Both IMAP/POP3 and PowerMTA file analysis
- **Unified Suppression**: Single suppression list from multiple sources
- **Real-time Protection**: Immediate blocking of problematic emails
- **Hourly Processing**: Automated PowerMTA file analysis every hour

### ⚡ **Priority Sender Limits**
- **Highest Priority**: Sender limits checked before all other constraints
- **Real-time Enforcement**: Immediate blocking when daily limits reached
- **Smart Queuing**: Automatic re-queuing for limit-exceeded emails
- **Default Protection**: All new senders start with 10 emails/day limit

### 🎨 **Enhanced User Experience**
- **I-Varse Technologies Branding**: Professional footer signatures across all pages
- **Training Statistics**: Comprehensive admin dashboard for training insights
- **Manual Controls**: API endpoints and commands for immediate training triggers
- **Detailed Reporting**: Complete visibility into reputation and limit changes

---

**Developed by [I-Varse Technologies](https://ivarsetech.com)**

*These visualizations represent the current state of the WebMail Laravel system including all latest features and enhancements as of July 2025.*
