import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import trainingService from '../../services/trainingService';

// Async thunks for training operations
export const fetchTrainingSettings = createAsyncThunk(
  'training/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await trainingService.getTrainingStatus();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch training settings');
    }
  }
);

export const updateTrainingSettings = createAsyncThunk(
  'training/updateSettings',
  async (settings, { rejectWithValue }) => {
    try {
      // This would need to be implemented in the backend if settings updates are needed
      const response = await trainingService.updateTrainingSettings(settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update training settings');
    }
  }
);

export const fetchTrainingStats = createAsyncThunk(
  'training/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await trainingService.getTrainingStatistics();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch training statistics');
    }
  }
);

export const runTraining = createAsyncThunk(
  'training/runTraining',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await trainingService.runTraining(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to run training');
    }
  }
);

// Admin thunks
export const fetchAdminTrainingSettings = createAsyncThunk(
  'training/fetchAdminSettings',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await trainingService.getAdminTrainingSettings(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user training settings');
    }
  }
);

export const updateAdminTrainingSettings = createAsyncThunk(
  'training/updateAdminSettings',
  async ({ userId, settings }, { rejectWithValue }) => {
    try {
      const response = await trainingService.updateAdminTrainingSettings(userId, settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user training settings');
    }
  }
);

export const fetchAdminTrainingStats = createAsyncThunk(
  'training/fetchAdminStats',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await trainingService.getAdminTrainingStats(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user training statistics');
    }
  }
);

export const runAdminTraining = createAsyncThunk(
  'training/runAdminTraining',
  async ({ userId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await trainingService.runUserTraining(userId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to run user training');
    }
  }
);

export const runDomainTraining = createAsyncThunk(
  'training/runDomainTraining',
  async ({ domainId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await trainingService.runDomainTraining(domainId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to run domain training');
    }
  }
);

export const runSystemTraining = createAsyncThunk(
  'training/runSystemTraining',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await trainingService.runSystemTraining(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to run system training');
    }
  }
);

export const fetchUserTrainingStats = createAsyncThunk(
  'training/fetchUserStats',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await trainingService.getUserTrainingStats(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user training statistics');
    }
  }
);

export const fetchDomainTrainingStats = createAsyncThunk(
  'training/fetchDomainStats',
  async (domainId, { rejectWithValue }) => {
    try {
      const response = await trainingService.getDomainTrainingStats(domainId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch domain training statistics');
    }
  }
);

const initialState = {
  // User training settings
  settings: {
    training_enabled: false,
    training_mode: 'automatic',
    manual_training_percentage: 10.0,
    last_manual_training_at: null,
    is_manual_training_due: false,
  },
  
  // Training statistics
  stats: {
    training_enabled: false,
    training_mode: 'automatic',
    manual_training_percentage: 10.0,
    last_manual_training_at: null,
    is_training_due: false,
    total_senders: 0,
    total_current_limit: 0,
    average_limit: 0,
    min_limit: 0,
    max_limit: 0,
    next_training_projection: [],
  },

  // Admin data
  adminSettings: {},
  adminStats: {},
  
  // UI state
  loading: {
    settings: false,
    stats: false,
    updating: false,
    running: false,
    adminSettings: false,
    adminStats: false,
    adminUpdating: false,
    adminRunning: false,
  },
  
  error: null,
  success: null,
  lastTrainingResult: null,
};

const trainingSlice = createSlice({
  name: 'training',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    clearTrainingResult: (state) => {
      state.lastTrainingResult = null;
    },
    resetAdminData: (state) => {
      state.adminSettings = {};
      state.adminStats = {};
      state.loading.adminSettings = false;
      state.loading.adminStats = false;
      state.loading.adminUpdating = false;
      state.loading.adminRunning = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch training settings
      .addCase(fetchTrainingSettings.pending, (state) => {
        state.loading.settings = true;
        state.error = null;
      })
      .addCase(fetchTrainingSettings.fulfilled, (state, action) => {
        state.loading.settings = false;
        state.settings = action.payload;
      })
      .addCase(fetchTrainingSettings.rejected, (state, action) => {
        state.loading.settings = false;
        state.error = action.payload;
      })

      // Update training settings
      .addCase(updateTrainingSettings.pending, (state) => {
        state.loading.updating = true;
        state.error = null;
      })
      .addCase(updateTrainingSettings.fulfilled, (state, action) => {
        state.loading.updating = false;
        state.settings = { ...state.settings, ...action.payload };
        state.success = 'Training settings updated successfully';
      })
      .addCase(updateTrainingSettings.rejected, (state, action) => {
        state.loading.updating = false;
        state.error = action.payload;
      })

      // Fetch training stats
      .addCase(fetchTrainingStats.pending, (state) => {
        state.loading.stats = true;
        state.error = null;
      })
      .addCase(fetchTrainingStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload;
      })
      .addCase(fetchTrainingStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.payload;
      })

      // Run training
      .addCase(runTraining.pending, (state) => {
        state.loading.running = true;
        state.error = null;
      })
      .addCase(runTraining.fulfilled, (state, action) => {
        state.loading.running = false;
        state.lastTrainingResult = action.payload;
        state.success = action.payload.message || 'Training completed successfully';
      })
      .addCase(runTraining.rejected, (state, action) => {
        state.loading.running = false;
        state.error = action.payload;
      })

      // Admin fetch settings
      .addCase(fetchAdminTrainingSettings.pending, (state) => {
        state.loading.adminSettings = true;
        state.error = null;
      })
      .addCase(fetchAdminTrainingSettings.fulfilled, (state, action) => {
        state.loading.adminSettings = false;
        state.adminSettings = action.payload;
      })
      .addCase(fetchAdminTrainingSettings.rejected, (state, action) => {
        state.loading.adminSettings = false;
        state.error = action.payload;
      })

      // Admin update settings
      .addCase(updateAdminTrainingSettings.pending, (state) => {
        state.loading.adminUpdating = true;
        state.error = null;
      })
      .addCase(updateAdminTrainingSettings.fulfilled, (state, action) => {
        state.loading.adminUpdating = false;
        state.adminSettings = action.payload;
        state.success = 'User training settings updated successfully';
      })
      .addCase(updateAdminTrainingSettings.rejected, (state, action) => {
        state.loading.adminUpdating = false;
        state.error = action.payload;
      })

      // Admin fetch stats
      .addCase(fetchAdminTrainingStats.pending, (state) => {
        state.loading.adminStats = true;
        state.error = null;
      })
      .addCase(fetchAdminTrainingStats.fulfilled, (state, action) => {
        state.loading.adminStats = false;
        state.adminStats = action.payload;
      })
      .addCase(fetchAdminTrainingStats.rejected, (state, action) => {
        state.loading.adminStats = false;
        state.error = action.payload;
      })

      // Admin run training
      .addCase(runAdminTraining.pending, (state) => {
        state.loading.adminRunning = true;
        state.error = null;
      })
      .addCase(runAdminTraining.fulfilled, (state, action) => {
        state.loading.adminRunning = false;
        state.lastTrainingResult = action.payload;
        state.success = action.payload.message || 'User training completed successfully';
      })
      .addCase(runAdminTraining.rejected, (state, action) => {
        state.loading.adminRunning = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess, clearTrainingResult, resetAdminData } = trainingSlice.actions;

export default trainingSlice.reducer;
