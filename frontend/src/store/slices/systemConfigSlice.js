import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { systemSettingsService } from '../../services/api';
import { api } from '../../utils/api';

// Async thunk to fetch public system configuration
export const fetchSystemConfig = createAsyncThunk(
  'systemConfig/fetchSystemConfig',
  async () => {
    try {
      // Try public config endpoint first (works for all users)
      const response = await api.get('/config');

      // Check if response has the expected structure
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return response.data;
      }
    } catch (error) {
      // Fallback to defaults if public config fails
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch system configuration';
      console.warn('Failed to fetch system config, using defaults:', errorMessage);

      return {
        app: {
          name: 'WebMail Laravel',
          url: window.location.origin,
          version: '1.0.0',
          description: 'Professional email campaign management platform'
        },
        features: {
          registration_enabled: true,
          demo_mode: false
        },
        branding: {
          primary_color: '#3B82F6'
        }
      };
    }
  }
);

// Async thunk to update system configuration (admin only)
export const updateSystemConfig = createAsyncThunk(
  'systemConfig/updateSystemConfig',
  async (configData, { rejectWithValue }) => {
    try {
      const response = await systemSettingsService.updateSystemSettings(configData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update system configuration';
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  config: {
    app: {
      name: 'WebMail Laravel',
      url: window.location.origin,
      version: '1.0.0',
      description: 'Professional email campaign management platform'
    },
    features: {
      registration_enabled: true,
      demo_mode: false
    },
    branding: {
      primary_color: '#3B82F6'
    }
  },
  isLoading: false,
  error: null,
  lastFetched: null,
};

const systemConfigSlice = createSlice({
  name: 'systemConfig',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateAppName: (state, action) => {
      state.config.app.name = action.payload;
    },
    resetConfig: (state) => {
      state.config = initialState.config;
      state.error = null;
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch System Config
      .addCase(fetchSystemConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSystemConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.config = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchSystemConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update System Config
      .addCase(updateSystemConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSystemConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.config = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(updateSystemConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  updateAppName,
  resetConfig,
} = systemConfigSlice.actions;

// Selectors
export const selectSystemConfig = (state) => state.systemConfig.config;
export const selectAppName = (state) => state.systemConfig.config?.app?.name || 'WebMail Laravel';
export const selectAppUrl = (state) => state.systemConfig.config?.app?.url || window.location.origin;
export const selectAppDescription = (state) => state.systemConfig.config?.app?.description || 'Professional email campaign management platform';
export const selectPrimaryColor = (state) => state.systemConfig.config?.branding?.primary_color || '#3B82F6';
export const selectRegistrationEnabled = (state) => state.systemConfig.config?.features?.registration_enabled !== false;
export const selectDemoMode = (state) => state.systemConfig.config?.features?.demo_mode === true;
export const selectIsLoading = (state) => state.systemConfig.isLoading;
export const selectError = (state) => state.systemConfig.error;
export const selectLastFetched = (state) => state.systemConfig.lastFetched;

// Helper to check if config needs refresh (older than 5 minutes)
export const selectNeedsRefresh = (state) => {
  const lastFetched = selectLastFetched(state);
  if (!lastFetched) return true;

  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() - lastFetched > fiveMinutes;
};

export default systemConfigSlice.reducer;
