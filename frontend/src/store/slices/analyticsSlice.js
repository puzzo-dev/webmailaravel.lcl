import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (params, { rejectWithValue }) => {
    try {
      return await api.get('/analytics', params);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'analytics/fetchDashboardStats',
  async (params, { rejectWithValue }) => {
    try {
      return await api.get('/analytics/dashboard', params);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchCampaignAnalytics = createAsyncThunk(
  'analytics/fetchCampaignAnalytics',
  async (campaignId, { rejectWithValue }) => {
    try {
      return await api.get(`/campaigns/${campaignId}/analytics`);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchTrackingData = createAsyncThunk(
  'analytics/fetchTrackingData',
  async ({ campaignId, type }, { rejectWithValue }) => {
    try {
      return await api.get(`/campaigns/${campaignId}/tracking/${type}`);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const exportAnalytics = createAsyncThunk(
  'analytics/exportAnalytics',
  async (params, { rejectWithValue }) => {
    try {
      return await api.get('/analytics/export', params);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

const initialState = {
  analytics: null,
  dashboardStats: null,
  campaignAnalytics: null,
  trackingData: null,
  isLoading: false,
  error: null,
  selectedPeriod: '7d',
  selectedCampaign: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedPeriod: (state, action) => {
      state.selectedPeriod = action.payload;
    },
    setSelectedCampaign: (state, action) => {
      state.selectedCampaign = action.payload;
    },
    clearAnalytics: (state) => {
      state.analytics = null;
      state.dashboardStats = null;
      state.campaignAnalytics = null;
      state.trackingData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Campaign Analytics
      .addCase(fetchCampaignAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.campaignAnalytics = action.payload;
      })
      .addCase(fetchCampaignAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Tracking Data
      .addCase(fetchTrackingData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrackingData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trackingData = action.payload;
      })
      .addCase(fetchTrackingData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Export Analytics
      .addCase(exportAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exportAnalytics.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(exportAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setSelectedPeriod,
  setSelectedCampaign,
  clearAnalytics,
} = analyticsSlice.actions;

export default analyticsSlice.reducer; 