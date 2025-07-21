# Dynamic Branding System Documentation

This document describes the implementation of the dynamic app name and branding system that allows administrators to customize the application's appearance and branding throughout the interface.

## Overview

The dynamic branding system replaces hardcoded application names and branding elements with configurable values that can be managed through the admin interface. This allows for white-label deployments and custom branding.

## System Components

### Backend Implementation

#### 1. **PublicConfigController**
```php
// app/Http/Controllers/PublicConfigController.php
class PublicConfigController extends Controller
{
    public function getPublicConfig()
    {
        return [
            'app' => [
                'name' => SystemConfig::get('APP_NAME', 'WebMail Laravel'),
                'url' => SystemConfig::get('APP_URL', request()->getSchemeAndHttpHost()),
                'version' => '1.0.0',
                'description' => 'Professional email campaign management platform',
            ],
            'branding' => [
                'primary_color' => SystemConfig::get('PRIMARY_COLOR', '#3B82F6'),
                'logo_url' => SystemConfig::get('LOGO_URL', null),
                'favicon_url' => SystemConfig::get('FAVICON_URL', null),
            ]
        ];
    }
}
```

#### 2. **Public API Endpoint**
```php
// routes/api.php
Route::get('/config', [PublicConfigController::class, 'getPublicConfig']);
```

#### 3. **System Configuration Model**
- Leverages existing `SystemConfig` model
- Stores configuration in database with caching
- Supports fallback to environment variables

### Frontend Implementation

#### 1. **System Config Redux Slice**
```javascript
// src/store/slices/systemConfigSlice.js
export const fetchSystemConfig = createAsyncThunk(
  'systemConfig/fetchSystemConfig',
  async () => {
    const response = await api.get('/config');
    return response.data;
  }
);
```

#### 2. **Custom Hook for Easy Access**
```javascript
// src/hooks/useSystemConfig.js
export const useAppName = () => {
  return useSelector(selectAppName);
};

export const useSystemConfig = () => {
  // Auto-fetching with caching logic
  return { appName, isLoading, error, refreshConfig };
};
```

#### 3. **Updated Components**

**Sidebar Navigation:**
```jsx
// src/components/layout/Sidebar.jsx
const Sidebar = ({ isOpen, onClose, user, onLogout }) => {
  const appName = useAppName();
  
  return (
    <h1 className="text-white text-lg font-semibold">{appName}</h1>
  );
};
```

**Mobile Menu:**
```jsx
// src/components/layout/MobileMenu.jsx
const MobileMenu = ({ isOpen, onClose, user, onLogout }) => {
  const appName = useAppName();
  
  return (
    <h1 className="text-white text-lg font-semibold">{appName}</h1>
  );
};
```

**Authentication Layout:**
```jsx
// src/components/layout/AuthLayout.jsx
const AuthLayout = () => {
  const appName = useAppName();
  
  return (
    <>
      <h2 className="text-3xl font-extrabold">{appName}</h2>
      <p>© 2024 {appName}. All rights reserved.</p>
    </>
  );
};
```

## Configuration Management

### Admin Interface

#### System Settings Page
- **Location**: `frontend/src/pages/SystemSettings.jsx`
- **Field**: Application Name input field
- **Functionality**: Real-time editing and saving

```jsx
<input
  type="text"
  value={settings.system.app_name}
  onChange={(e) => updateSetting('system', 'app_name', e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
  placeholder="WebMail Laravel"
/>
```

#### Admin System Overview
- **Location**: `frontend/src/pages/admin/AdminSystem.jsx`
- **Display**: Read-only view of current app name
- **Purpose**: System status overview

### Configuration Options

#### Available Settings
```javascript
{
  app: {
    name: 'WebMail Laravel',              // Application name
    url: 'https://example.com',           // Application URL
    version: '1.0.0',                     // Version number
    description: 'Email campaign platform' // Description
  },
  branding: {
    primary_color: '#3B82F6',             // Primary brand color
    logo_url: null,                       // Custom logo URL
    favicon_url: null                     // Custom favicon URL
  },
  features: {
    registration_enabled: true,            // Allow new registrations
    demo_mode: false                      // Demo mode flag
  }
}
```

## Implementation Features

### 1. **Public Access**
- **No Authentication Required**: App name visible to all users
- **Landing Pages**: Consistent branding on public pages
- **Auth Pages**: Dynamic branding on login/register

### 2. **Caching Strategy**
- **Frontend Cache**: 5-minute refresh intervals
- **Smart Fetching**: Only fetch when needed
- **Fallback Handling**: Graceful degradation with defaults

### 3. **Real-time Updates**
- **Admin Changes**: Immediate effect after save
- **User Experience**: Seamless branding updates
- **Cache Invalidation**: Automatic refresh triggers

### 4. **Fallback System**
```javascript
// Fallback hierarchy:
// 1. API response
// 2. Cached config
// 3. Default values
// 4. Hardcoded fallbacks

const appName = config?.app?.name || 'WebMail Laravel';
```

## Usage Instructions

### For Administrators

#### Changing App Name
1. Navigate to **System Settings** → **General Settings**
2. Locate **"Application Name"** field
3. Enter desired application name
4. Click **"Save Settings"**
5. Changes appear immediately in:
   - Sidebar navigation
   - Mobile menu
   - Authentication pages
   - Page titles

#### Advanced Branding
1. Access **Admin Panel** → **System Configuration**
2. Configure additional branding options:
   - Primary color scheme
   - Logo URLs
   - Favicon settings
   - Feature toggles

### For Developers

#### Adding New Brandable Elements
```javascript
// 1. Import the hook
import { useAppName } from '../../hooks/useSystemConfig';

// 2. Use in component
const MyComponent = () => {
  const appName = useAppName();
  
  return <title>{appName} - Dashboard</title>;
};

// 3. For additional config values
import { useSystemConfig } from '../../hooks/useSystemConfig';

const MyComponent = () => {
  const { config } = useSystemConfig();
  const primaryColor = config?.branding?.primary_color;
  
  return <div style={{ color: primaryColor }}>Branded content</div>;
};
```

## Technical Benefits

### 1. **White Label Ready**
- Easy deployment for different clients
- Customizable branding per installation
- No code changes required for branding

### 2. **Scalable Architecture**
- Centralized configuration management
- Database-driven with caching
- Environment variable fallbacks

### 3. **Performance Optimized**
- Minimal API calls with smart caching
- Frontend-only updates for UI changes
- Efficient Redux state management

### 4. **User Experience**
- Consistent branding across all interfaces
- No hardcoded references to break
- Seamless admin configuration

## Migration Notes

### Replaced Hardcoded References
- **"EmailCampaign"** → `{appName}` in all components
- **Static branding** → Dynamic configuration
- **Environment variables** → Database configuration

### Updated Components
- ✅ Sidebar navigation
- ✅ Mobile menu
- ✅ Authentication layout
- ✅ System settings page
- ✅ Admin overview page

### Future Enhancements
- [ ] Logo upload functionality
- [ ] Advanced color theming
- [ ] Custom CSS injection
- [ ] Multi-language support
- [ ] Tenant-specific branding

---

*This dynamic branding system provides a foundation for customizable, white-label deployments while maintaining a clean, maintainable codebase.*
