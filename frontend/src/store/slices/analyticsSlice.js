import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsService } from '../../services/api';

// Async thunks
export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getAnalytics();
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch analytics';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchDashboardData = createAsyncThunk(
  'analytics/fetchDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getDashboardData();
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch dashboard data';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchCampaignAnalytics = createAsyncThunk(
  'analytics/fetchCampaignAnalytics',
  async (params, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getCampaignAnalytics(params);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch campaign analytics';
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  analytics: {
    dashboard: null,
    campaigns: null,
    users: null,
    revenue: null,
    deliverability: null,
    reputation: null,
    trending: null,
  },
  isLoading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateAnalytics: (state, action) => {
      state.analytics = { ...state.analytics, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = { ...state.analytics, ...action.payload };
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics.dashboard = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch campaign analytics
      .addCase(fetchCampaignAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics.campaigns = action.payload;
      })
      .addCase(fetchCampaignAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, updateAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer; 