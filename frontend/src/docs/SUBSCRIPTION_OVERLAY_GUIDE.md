# Subscription Overlay Implementation Guide

## Overview

This guide explains how the subscription overlay system works and how to apply it to new pages.

## Components Created

### 1. `PageSubscriptionOverlay`
A component that automatically shows the subscription overlay when a page loads if the user doesn't have an active subscription.

**Location:** `frontend/src/components/common/PageSubscriptionOverlay.jsx`

### 2. `SubscriptionGuard`
A more advanced component with multiple usage patterns:
- Wrapper component
- Higher-order component (HOC)
- Custom hook for subscription checks

**Location:** `frontend/src/components/common/SubscriptionGuard.jsx`

## Usage Examples

### Simple Page Protection (Recommended)

Add this to any page that should require a subscription:

```jsx
import PageSubscriptionOverlay from '../../components/common/PageSubscriptionOverlay';

const MyPage = () => {
  return (
    <>
      <PageSubscriptionOverlay 
        feature="my feature name"
        customMessage="Upgrade to Pro to unlock this feature."
      />
      <div className="page-content">
        {/* Your page content */}
      </div>
    </>
  );
};
```

### Admin-Only Pages

For pages that require admin privileges:

```jsx
<PageSubscriptionOverlay 
  feature="admin feature"
  adminOnly={true}
  customMessage="Admin privileges required to access this feature."
/>
```

### Custom Hook Usage

For more complex subscription checking within components:

```jsx
import { useSubscriptionCheck } from '../../components/common/SubscriptionGuard';

const MyComponent = () => {
  const { hasActiveSubscription, requireSubscription, isAdmin } = useSubscriptionCheck('custom feature');

  const handlePremiumAction = () => {
    if (!requireSubscription('Custom message for this action')) {
      return; // Overlay will be shown automatically
    }
    
    // Proceed with premium action
    performPremiumAction();
  };

  return (
    <button onClick={handlePremiumAction}>
      Premium Action
    </button>
  );
};
```

## Pages Currently Protected

### Premium Features (Subscription Required)
- **Analytics** (`/analytics`) - Advanced analytics and reporting
- **Campaign Builder** (`/campaigns/new`) - Advanced campaign creation
- **Monitoring** (`/monitoring`) - Domain monitoring and health checks

### Admin Features (Admin Role Required)
- **Admin Dashboard** (`/admin`) - Administrative dashboard
- **Admin Billing** (`/admin/billing`) - Billing management

## Configuration Options

### PageSubscriptionOverlay Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `feature` | string | `'this page'` | Name of the feature for messaging |
| `adminOnly` | boolean | `false` | Whether admin role is required |
| `delay` | number | `500` | Delay in ms before showing overlay |
| `customMessage` | string | - | Custom message override |

### SubscriptionGuard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | Content to render when authorized |
| `feature` | string | `'this feature'` | Feature name for messaging |
| `adminOnly` | boolean | `false` | Whether admin role is required |
| `immediate` | boolean | `false` | Show overlay immediately on mount |
| `fallbackMessage` | string | - | Custom message override |

## How It Works

1. **Layout Integration**: The subscription overlay is already integrated into the main `Layout.jsx` component and positioned to cover only the page content area (not sidebar, nav, or footer).

2. **State Management**: Uses Redux slices:
   - `uiSlice` - Controls overlay visibility
   - `billingSlice` - Manages subscription data
   - `authSlice` - User authentication and role info

3. **Automatic Detection**: Components check user subscription status and role, then trigger the overlay via Redux actions.

4. **Graceful Fallback**: Pages remain functional for basic features, with premium features protected by subscription checks.

## Adding to New Pages

1. Import the component:
   ```jsx
   import PageSubscriptionOverlay from '../../components/common/PageSubscriptionOverlay';
   ```

2. Add to your component's return statement:
   ```jsx
   return (
     <>
       <PageSubscriptionOverlay 
         feature="your feature name"
         customMessage="Your custom message"
       />
       {/* Your existing JSX */}
     </>
   );
   ```

3. Test the implementation by:
   - Loading the page without an active subscription
   - Verifying the overlay appears with correct messaging
   - Confirming admin users bypass checks (if `adminOnly={true}`)

## Best Practices

1. **Feature Names**: Use descriptive, user-friendly feature names
2. **Custom Messages**: Provide clear value propositions in custom messages
3. **Admin Protection**: Use `adminOnly={true}` for sensitive administrative features
4. **Graceful Degradation**: Ensure basic functionality remains available without subscription

## Error Handling

The system includes the `useSubscriptionError` hook that automatically shows the overlay when API calls return subscription-required errors (403 with `subscription_required` error code).

This provides seamless protection for backend-protected endpoints without additional frontend code.

## Integration with Backend

The subscription system integrates with the Laravel backend middleware:
- `CheckActiveSubscription` middleware protects API endpoints
- Returns standardized error responses that trigger the overlay
- Admin users bypass subscription checks on both frontend and backend
