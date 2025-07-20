import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import campaignReducer from './slices/campaignSlice';
import senderReducer from './slices/senderSlice';
import domainsReducer from './slices/domainsSlice';
import billingReducer from './slices/billingSlice';
import securityReducer from './slices/securitySlice';
import suppressionReducer from './slices/suppressionSlice';
import settingsReducer from './slices/settingsSlice';
import monitoringReducer from './slices/monitoringSlice';
import notificationsReducer from './slices/notificationsSlice';
import analyticsReducer from './slices/analyticsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    campaigns: campaignReducer,
    senders: senderReducer,
    domains: domainsReducer,
    billing: billingReducer,
    security: securityReducer,
    suppression: suppressionReducer,
    settings: settingsReducer,
    monitoring: monitoringReducer,
    notifications: notificationsReducer,
    analytics: analyticsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        // Ignore specific action types that might cause performance issues
        ignoredActionPaths: ['payload.timestamp', 'meta.timestamp', 'meta.arg'],
        ignoredPaths: ['some.path.to.ignore'],
      },
      immutableCheck: {
        // Increase the warning threshold for immutable checks
        warnAfter: 128,
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// JavaScript exports for Redux types
export const getRootState = () => store.getState();
export const getAppDispatch = () => store.dispatch; 