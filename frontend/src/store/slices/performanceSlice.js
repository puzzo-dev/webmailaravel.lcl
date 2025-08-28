import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminService } from '../../services/api';

// Async thunks for performance monitoring operations
export const fetchSystemMetrics = createAsyncThunk(
  'performance/fetchSystemMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getSystemMetrics();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch system metrics');
    }
  }
);

export const fetchOperationMetrics = createAsyncThunk(
  'performance/fetchOperationMetrics',
  async ({ operation, hours = 24 }, { rejectWithValue }) => {
    try {
      const response = await adminService.getSystemMetrics(); // Note: operation metrics not available in current backend
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch operation metrics');
    }
  }
);

export const generatePerformanceReport = createAsyncThunk(
  'performance/generateReport',
  async (hours = 24, { rejectWithValue }) => {
    try {
      const response = await adminService.getSystemMetrics(); // Note: report generation not available in current backend
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate performance report');
    }
  }
);

export const recordPerformanceMetric = createAsyncThunk(
  'performance/recordMetric',
  async (metricData, { rejectWithValue }) => {
    try {
      // Local frontend metric recording - no backend call needed
      return { success: true, metric: metricData };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record performance metric');
    }
  }
);

// Frontend performance tracking
export const trackFrontendPerformance = createAsyncThunk(
  'performance/trackFrontend',
  async (performanceData, { rejectWithValue }) => {
    try {
      // Track frontend performance metrics
      const metrics = {
        operation: 'frontend_performance',
        duration: performanceData.duration,
        metadata: {
          component: performanceData.component,
          action: performanceData.action,
          user_agent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          connection: navigator.connection?.effectiveType || 'unknown',
          ...performanceData.metadata
        }
      };
      
      // Local frontend metric tracking - no backend call needed
      return { success: true, metrics };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to track frontend performance');
    }
  }
);

const initialState = {
  // System metrics
  systemMetrics: {
    training_unified: null,
    email_sending_unified: null,
    billing_refined: null,
    campaign_creation: null,
    database_query: null,
    system: null
  },
  
  // Operation-specific metrics
  operationMetrics: {},
  
  // Performance report
  report: null,
  
  // Frontend performance tracking
  frontendMetrics: {
    pageLoadTimes: [],
    componentRenderTimes: [],
    apiResponseTimes: [],
    errorRates: {}
  },
  
  // UI state
  loading: {
    systemMetrics: false,
    operationMetrics: false,
    report: false,
    recording: false,
    frontendTracking: false
  },
  
  error: null,
  success: null,
  lastUpdated: null
};

const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccess(state) {
      state.success = null;
    },
    clearReport(state) {
      state.report = null;
    },
    recordFrontendMetric(state, action) {
      const { type, data } = action.payload;
      switch (type) {
        case 'pageLoad':
          state.frontendMetrics.pageLoadTimes.push(data);
          break;
        case 'componentRender':
          state.frontendMetrics.componentRenderTimes.push(data);
          break;
        case 'apiResponse':
          state.frontendMetrics.apiResponseTimes.push(data);
          break;
        case 'error':
          const errorKey = data.component || 'general';
          state.frontendMetrics.errorRates[errorKey] = 
            (state.frontendMetrics.errorRates[errorKey] || 0) + 1;
          break;
      }
    },
    clearFrontendMetrics(state) {
      state.frontendMetrics = {
        pageLoadTimes: [],
        componentRenderTimes: [],
        apiResponseTimes: [],
        errorRates: {}
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch system metrics
      .addCase(fetchSystemMetrics.pending, (state) => {
        state.loading.systemMetrics = true;
        state.error = null;
      })
      .addCase(fetchSystemMetrics.fulfilled, (state, action) => {
        state.loading.systemMetrics = false;
        state.systemMetrics = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.success = 'System metrics fetched successfully';
      })
      .addCase(fetchSystemMetrics.rejected, (state, action) => {
        state.loading.systemMetrics = false;
        state.error = action.payload;
      })
      
      // Fetch operation metrics
      .addCase(fetchOperationMetrics.pending, (state) => {
        state.loading.operationMetrics = true;
        state.error = null;
      })
      .addCase(fetchOperationMetrics.fulfilled, (state, action) => {
        state.loading.operationMetrics = false;
        const operation = action.payload.operation;
        state.operationMetrics[operation] = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.success = `${operation} metrics fetched successfully`;
      })
      .addCase(fetchOperationMetrics.rejected, (state, action) => {
        state.loading.operationMetrics = false;
        state.error = action.payload;
      })
      
      // Generate performance report
      .addCase(generatePerformanceReport.pending, (state) => {
        state.loading.report = true;
        state.error = null;
      })
      .addCase(generatePerformanceReport.fulfilled, (state, action) => {
        state.loading.report = false;
        state.report = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.success = 'Performance report generated successfully';
      })
      .addCase(generatePerformanceReport.rejected, (state, action) => {
        state.loading.report = false;
        state.error = action.payload;
      })
      
      // Record performance metric
      .addCase(recordPerformanceMetric.pending, (state) => {
        state.loading.recording = true;
        state.error = null;
      })
      .addCase(recordPerformanceMetric.fulfilled, (state, action) => {
        state.loading.recording = false;
        state.success = 'Performance metric recorded successfully';
      })
      .addCase(recordPerformanceMetric.rejected, (state, action) => {
        state.loading.recording = false;
        state.error = action.payload;
      })
      
      // Track frontend performance
      .addCase(trackFrontendPerformance.pending, (state) => {
        state.loading.frontendTracking = true;
        state.error = null;
      })
      .addCase(trackFrontendPerformance.fulfilled, (state, action) => {
        state.loading.frontendTracking = false;
        state.success = 'Frontend performance tracked successfully';
      })
      .addCase(trackFrontendPerformance.rejected, (state, action) => {
        state.loading.frontendTracking = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  clearSuccess, 
  clearReport, 
  recordFrontendMetric, 
  clearFrontendMetrics 
} = performanceSlice.actions;

export default performanceSlice.reducer;
