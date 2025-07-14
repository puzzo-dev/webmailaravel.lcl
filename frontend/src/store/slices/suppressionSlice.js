import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';

// Async thunks
export const fetchSuppressionStatistics = createAsyncThunk(
  'suppression/fetchSuppressionStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/suppression-list/statistics');
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const exportSuppressionList = createAsyncThunk(
  'suppression/exportSuppressionList',
  async (exportData, { rejectWithValue }) => {
    try {
      const response = await api.post('/suppression-list/export', exportData);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const importSuppressionList = createAsyncThunk(
  'suppression/importSuppressionList',
  async (importData, { rejectWithValue }) => {
    try {
      const response = await api.post('/suppression-list/import', importData);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const processFBLFile = createAsyncThunk(
  'suppression/processFBLFile',
  async (fileData, { rejectWithValue }) => {
    try {
      const response = await api.post('/suppression-list/process-fbl', fileData);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const removeEmailFromSuppression = createAsyncThunk(
  'suppression/removeEmailFromSuppression',
  async (emailData, { rejectWithValue }) => {
    try {
      const response = await api.delete('/suppression-list/remove-email', {
        data: emailData,
      });
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const cleanupSuppressionList = createAsyncThunk(
  'suppression/cleanupSuppressionList',
  async (cleanupData, { rejectWithValue }) => {
    try {
      const response = await api.post('/suppression-list/cleanup', cleanupData);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const downloadSuppressionFile = createAsyncThunk(
  'suppression/downloadSuppressionFile',
  async (filename, { rejectWithValue }) => {
    try {
      const response = await api.get(`/suppression-list/download/${filename}`);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

const initialState = {
  statistics: {
    totalSuppressed: 0,
    totalBounces: 0,
    totalComplaints: 0,
    totalUnsubscribes: 0,
    recentActivity: [],
  },
  exportHistory: [],
  importHistory: [],
  isLoading: false,
  isExporting: false,
  isImporting: false,
  error: null,
  progress: 0,
};

const suppressionSlice = createSlice({
  name: 'suppression',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setProgress: (state, action) => {
      state.progress = action.payload;
    },
    resetProgress: (state) => {
      state.progress = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch suppression statistics
    builder
      .addCase(fetchSuppressionStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSuppressionStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchSuppressionStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Export suppression list
    builder
      .addCase(exportSuppressionList.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportSuppressionList.fulfilled, (state, action) => {
        state.isExporting = false;
        state.exportHistory.unshift(action.payload);
      })
      .addCase(exportSuppressionList.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload;
      });

    // Import suppression list
    builder
      .addCase(importSuppressionList.pending, (state) => {
        state.isImporting = true;
        state.error = null;
      })
      .addCase(importSuppressionList.fulfilled, (state, action) => {
        state.isImporting = false;
        state.importHistory.unshift(action.payload);
        // Update statistics after import
        if (action.payload.statistics) {
          state.statistics = { ...state.statistics, ...action.payload.statistics };
        }
      })
      .addCase(importSuppressionList.rejected, (state, action) => {
        state.isImporting = false;
        state.error = action.payload;
      });

    // Process FBL file
    builder
      .addCase(processFBLFile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processFBLFile.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update statistics after processing
        if (action.payload.statistics) {
          state.statistics = { ...state.statistics, ...action.payload.statistics };
        }
      })
      .addCase(processFBLFile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Remove email from suppression
    builder
      .addCase(removeEmailFromSuppression.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeEmailFromSuppression.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update statistics after removal
        if (action.payload.statistics) {
          state.statistics = { ...state.statistics, ...action.payload.statistics };
        }
      })
      .addCase(removeEmailFromSuppression.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Cleanup suppression list
    builder
      .addCase(cleanupSuppressionList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cleanupSuppressionList.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update statistics after cleanup
        if (action.payload.statistics) {
          state.statistics = { ...state.statistics, ...action.payload.statistics };
        }
      })
      .addCase(cleanupSuppressionList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setProgress, resetProgress } = suppressionSlice.actions;
export default suppressionSlice.reducer;
