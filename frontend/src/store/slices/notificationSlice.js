import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params, { rejectWithValue }) => {
    try {
      return await api.get('/notifications', params);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      return await api.put(`/notifications/${notificationId}/read`, {});
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      return await api.put('/notifications/mark-all-read', {});
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      return await api.delete(`/notifications/${notificationId}`);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const deleteAllNotifications = createAsyncThunk(
  'notifications/deleteAllNotifications',
  async (_, { rejectWithValue }) => {
    try {
      return await api.delete('/notifications');
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

const initialState = {
  notifications: [],
  isLoading: false,
  error: null,
  unreadCount: 0,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  },
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    updateNotification: (state, action) => {
      const index = state.notifications.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        const wasRead = state.notifications[index].read;
        state.notifications[index] = action.payload;
        
        if (!wasRead && action.payload.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        } else if (wasRead && !action.payload.read) {
          state.unreadCount += 1;
        }
      }
    },
    removeNotification: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.data;
        state.pagination = action.payload.meta;
        state.unreadCount = action.payload.data.filter(n => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Mark as Read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload.id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
          if (!state.notifications[index].read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      
      // Mark All as Read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map(n => ({ ...n, read: true }));
        state.unreadCount = 0;
      })
      
      // Delete Notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
      })
      
      // Delete All Notifications
      .addCase(deleteAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });
  },
});

export const {
  clearError,
  addNotification,
  updateNotification,
  removeNotification,
  setUnreadCount,
} = notificationSlice.actions;

export default notificationSlice.reducer; 