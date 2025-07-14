import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import campaignReducer from './slices/campaignSlice';
import userReducer from './slices/userSlice';
import analyticsReducer from './slices/analyticsSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';
import domainReducer from './slices/domainSlice';
import senderReducer from './slices/senderSlice';
import billingReducer from './slices/billingSlice';
import suppressionReducer from './slices/suppressionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    campaigns: campaignReducer,
    users: userReducer,
    analytics: analyticsReducer,
    notifications: notificationReducer,
    ui: uiReducer,
    domains: domainReducer,
    senders: senderReducer,
    billing: billingReducer,
    suppression: suppressionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// JavaScript exports for Redux types
export const getRootState = () => store.getState();
export const getAppDispatch = () => store.dispatch; 