import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';

export const fetchUserSettings = createAsyncThunk(
  'settings/fetchUserSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/user/settings');
      return response.data;
    } catch (error) {
      // Don't throw error for 404, just return empty settings
      if (error.response?.status === 404) {
        return {
          general: {},
          notifications: {},
          security: {},
          api: {},
          telegram: {}
        };
      }
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateGeneralSettings = createAsyncThunk(
  'settings/updateGeneralSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put('/user/settings/general', settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'settings/updateNotificationSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put('/user/settings/notifications', settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateSecuritySettings = createAsyncThunk(
  'settings/updateSecuritySettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put('/user/settings/security', settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateApiSettings = createAsyncThunk(
  'settings/updateApiSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put('/user/settings/api', settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateTelegramSettings = createAsyncThunk(
  'settings/updateTelegramSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put('/user/settings/telegram', settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'settings/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/user/profile', profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updatePassword = createAsyncThunk(
  'settings/updatePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await api.put('/user/password', passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const generateApiKey = createAsyncThunk(
  'settings/generateApiKey',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/user/settings/api/generate-key');
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const testTelegramConnection = createAsyncThunk(
  'settings/testTelegramConnection',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await api.post('/user/settings/telegram/test', { chat_id: chatId });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

const initialState = {
  settings: null,
  isLoading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSettings: (state) => {
      state.settings = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Settings
      .addCase(fetchUserSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchUserSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update General Settings
      .addCase(updateGeneralSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGeneralSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.settings) {
          state.settings.general = action.payload;
        }
      })
      .addCase(updateGeneralSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Notification Settings
      .addCase(updateNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.settings) {
          state.settings.notifications = action.payload;
        }
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Security Settings
      .addCase(updateSecuritySettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSecuritySettings.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.settings) {
          state.settings.security = action.payload;
        }
      })
      .addCase(updateSecuritySettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update API Settings
      .addCase(updateApiSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateApiSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.settings) {
          state.settings.api = action.payload;
        }
      })
      .addCase(updateApiSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Telegram Settings
      .addCase(updateTelegramSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTelegramSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.settings) {
          state.settings.telegram = action.payload;
        }
      })
      .addCase(updateTelegramSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.settings) {
          state.settings.profile = action.payload;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Password
      .addCase(updatePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Generate API Key
      .addCase(generateApiKey.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateApiKey.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.settings && state.settings.api) {
          state.settings.api.api_key = action.payload.api_key;
        }
      })
      .addCase(generateApiKey.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Test Telegram Connection
      .addCase(testTelegramConnection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(testTelegramConnection.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(testTelegramConnection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer; 