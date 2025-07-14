# EmailCampaign Frontend

A modern React-based frontend for the EmailCampaign management system, built with Vite, Tailwind CSS, and Redux.

## 🚀 Features

### ✅ **IMPLEMENTED FEATURES**

#### **Authentication & User Management**
- **Login/Register**: Complete authentication flow with form validation
- **Password Reset**: Forgot password and reset functionality
- **2FA Support**: Two-factor authentication verification
- **Remember Me**: Persistent login sessions
- **Profile Management**: User profile and settings

#### **Dashboard & Analytics**
- **Dashboard**: Comprehensive overview with stats and quick actions
- **Analytics**: Campaign performance tracking and charts
- **Real-time Updates**: WebSocket integration for live data
- **Responsive Design**: Mobile-friendly interface

#### **Campaign Management**
- **Campaign Builder**: Visual campaign creation interface
- **Campaign List**: Advanced filtering and search
- **Campaign Details**: Detailed campaign information
- **File Upload**: Drag-and-drop recipient list upload
- **Template Variables**: Dynamic content with personalization

#### **Email Templates**
- **Template Editor**: WYSIWYG email editor
- **Template Library**: Reusable email templates
- **Rich Text Editing**: Advanced content editing capabilities

#### **Advanced Features**
- **Tracking**: Open and click tracking
- **Unsubscribe Management**: Compliance and list management
- **Bounce Processing**: Advanced bounce handling
- **Rate Limiting**: Intelligent delivery optimization

#### **Admin Features**
- **User Management**: Admin user control panel
- **Role Management**: Permission-based access control
- **System Monitoring**: Performance and security monitoring

### 🎨 **UI/UX Features**
- **Modern Design**: Clean, professional interface
- **Dark/Light Theme**: Theme switching capability
- **Responsive Layout**: Mobile-first design
- **Loading States**: Smooth loading animations
- **Toast Notifications**: User feedback system
- **Form Validation**: Real-time validation
- **Error Handling**: Comprehensive error management

## 🛠️ Technology Stack

### **Core Technologies**
- **React 19**: Latest React with hooks and modern patterns
- **Vite**: Fast build system and development server
- **JavaScript**: Modern ES6+ features
- **Tailwind CSS**: Utility-first CSS framework

### **State Management**
- **Redux Toolkit**: Modern Redux with simplified patterns
- **React Redux**: React bindings for Redux
- **Redux Persist**: State persistence (optional)

### **Routing & Navigation**
- **React Router DOM**: Client-side routing
- **Protected Routes**: Authentication-based routing
- **Nested Routes**: Complex routing structure

### **UI Components**
- **React Icons**: Comprehensive icon library
- **React Hot Toast**: Toast notifications
- **React Dropzone**: File upload handling
- **React Quill**: Rich text editor
- **React Select**: Advanced select components
- **React Datepicker**: Date/time selection

### **Charts & Analytics**
- **Recharts**: Beautiful, composable charts
- **Date-fns**: Date manipulation utilities

### **HTTP & API**
- **Axios**: HTTP client with interceptors
- **JWT Decode**: Token handling

### **Real-time Features**
- **Socket.io Client**: WebSocket connections
- **Pusher**: Real-time messaging (optional)

## 📦 Installation

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Backend API running (see backend README)

### **Setup**
```bash
# Clone the repository
git clone <repository-url>
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# Edit .env file with your API URL and other settings

# Start development server
npm run dev
```

### **Environment Variables**
```env
# API Configuration
VITE_API_URL=http://localhost:8001/api

# WebSocket Configuration
VITE_WS_URL=ws://localhost:6001

# Application Configuration
VITE_APP_NAME=EmailCampaign
VITE_APP_VERSION=1.0.0
```

## 🚀 Development

### **Available Scripts**
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### **Project Structure**
```
src/
├── components/          # Reusable UI components
│   ├── dashboard/      # Dashboard-specific components
│   ├── layout/         # Layout components
│   └── ui/            # Generic UI components
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   ├── campaigns/     # Campaign management
│   ├── templates/     # Template management
│   ├── analytics/     # Analytics pages
│   ├── admin/         # Admin pages
│   └── settings/      # Settings pages
├── store/              # Redux store
│   └── slices/        # Redux slices
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
└── assets/            # Static assets
```

## 🎯 Key Features Explained

### **Authentication Flow**
1. **Login**: Email/password with remember me option
2. **2FA**: Optional two-factor authentication
3. **Password Reset**: Secure password recovery
4. **Session Management**: Automatic token refresh

### **Campaign Management**
1. **Creation**: Step-by-step campaign builder
2. **Content**: Rich text editor with templates
3. **Recipients**: File upload with validation
4. **Scheduling**: Flexible campaign scheduling
5. **Tracking**: Real-time performance monitoring

### **Analytics Dashboard**
1. **Overview**: Key metrics and trends
2. **Charts**: Interactive data visualization
3. **Reports**: Detailed performance reports
4. **Export**: Data export capabilities

### **Real-time Features**
1. **Live Updates**: WebSocket-based real-time data
2. **Notifications**: Toast notifications for events
3. **Progress Tracking**: Real-time campaign progress
4. **Status Updates**: Live status changes

## 🔧 Configuration

### **API Integration**
The frontend communicates with the Laravel backend API. Ensure the backend is running and properly configured.

### **WebSocket Setup**
For real-time features, configure WebSocket connections in your environment file.

### **Theme Configuration**
The app supports light and dark themes. Theme preferences are stored in localStorage.

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop**: Full-featured interface
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly interface

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Protected Routes**: Authentication guards
- **CSRF Protection**: Cross-site request forgery protection
- **Input Validation**: Client-side validation
- **XSS Prevention**: Sanitized content rendering

## 🚀 Performance

- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Component lazy loading
- **Optimized Builds**: Vite-based optimization
- **Caching**: Intelligent caching strategies
- **Bundle Analysis**: Build size monitoring

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### **Production Build**
```bash
npm run build
```

### **Deployment Options**
- **Vercel**: Zero-config deployment
- **Netlify**: Static site hosting
- **AWS S3**: Static file hosting
- **Docker**: Containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team

---

**Built with ❤️ using React, Vite, and Tailwind CSS**
