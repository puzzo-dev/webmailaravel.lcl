import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';

// Async thunks
export const fetchDomains = createAsyncThunk(
  'domains/fetchDomains',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/domains', params);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const createDomain = createAsyncThunk(
  'domains/createDomain',
  async (domainData, { rejectWithValue }) => {
    try {
      const response = await api.post('/domains', domainData);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateDomain = createAsyncThunk(
  'domains/updateDomain',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/domains/${id}`, data);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const deleteDomain = createAsyncThunk(
  'domains/deleteDomain',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/domains/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchDomainAnalytics = createAsyncThunk(
  'domains/fetchDomainAnalytics',
  async (domainId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/powermta/domains/${domainId}/analytics`);
      return { domainId, data: response };
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateSmtpConfig = createAsyncThunk(
  'domains/updateSmtpConfig',
  async ({ id, config }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/domains/${id}/smtp`, config);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const testDomainConnection = createAsyncThunk(
  'domains/testDomainConnection',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/domains/${id}/bounce-processing/test`);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

const initialState = {
  domains: [],
  currentDomain: null,
  analytics: {},
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

const domainSlice = createSlice({
  name: 'domains',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentDomain: (state, action) => {
      state.currentDomain = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch domains
    builder
      .addCase(fetchDomains.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDomains.fulfilled, (state, action) => {
        state.isLoading = false;
        // Ensure domains is always an array
        const domainsData = action.payload.data || action.payload;
        state.domains = Array.isArray(domainsData) ? domainsData : [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchDomains.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create domain
    builder
      .addCase(createDomain.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDomain.fulfilled, (state, action) => {
        state.isLoading = false;
        state.domains.push(action.payload);
      })
      .addCase(createDomain.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update domain
    builder
      .addCase(updateDomain.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDomain.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.domains.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.domains[index] = action.payload;
        }
      })
      .addCase(updateDomain.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete domain
    builder
      .addCase(deleteDomain.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDomain.fulfilled, (state, action) => {
        state.isLoading = false;
        state.domains = state.domains.filter(d => d.id !== action.payload);
      })
      .addCase(deleteDomain.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch domain analytics
    builder
      .addCase(fetchDomainAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDomainAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics[action.payload.domainId] = action.payload.data;
      })
      .addCase(fetchDomainAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Test domain connection
    builder
      .addCase(testDomainConnection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(testDomainConnection.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(testDomainConnection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentDomain } = domainSlice.actions;
export default domainSlice.reducer;
