import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';

export const fetchMonitoringStatus = createAsyncThunk(
  'monitoring/fetchMonitoringStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/monitoring/status');
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchMonitoringResults = createAsyncThunk(
  'monitoring/fetchMonitoringResults',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/monitoring/results');
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const runMonitoring = createAsyncThunk(
  'monitoring/runMonitoring',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/monitoring/run');
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const clearMonitoringData = createAsyncThunk(
  'monitoring/clearMonitoringData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete('/monitoring/clear');
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

const initialState = {
  monitoringStatus: null,
  monitoringResults: null,
  isLoading: false,
  error: null,
};

const monitoringSlice = createSlice({
  name: 'monitoring',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMonitoring: (state) => {
      state.monitoringStatus = null;
      state.monitoringResults = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Monitoring Status
      .addCase(fetchMonitoringStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMonitoringStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.monitoringStatus = action.payload;
      })
      .addCase(fetchMonitoringStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Monitoring Results
      .addCase(fetchMonitoringResults.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMonitoringResults.fulfilled, (state, action) => {
        state.isLoading = false;
        state.monitoringResults = action.payload;
      })
      .addCase(fetchMonitoringResults.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Run Monitoring
      .addCase(runMonitoring.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(runMonitoring.fulfilled, (state, action) => {
        state.isLoading = false;
        state.monitoringResults = action.payload;
      })
      .addCase(runMonitoring.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Clear Monitoring Data
      .addCase(clearMonitoringData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearMonitoringData.fulfilled, (state) => {
        state.isLoading = false;
        state.monitoringResults = null;
      })
      .addCase(clearMonitoringData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearMonitoring,
} = monitoringSlice.actions;

export default monitoringSlice.reducer; 