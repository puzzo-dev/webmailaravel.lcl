import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { domainService } from '../../services/api';

// Async thunks
export const fetchDomains = createAsyncThunk(
  'domains/fetchDomains',
  async (_, { rejectWithValue }) => {
    try {
      const response = await domainService.getDomains();
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch domains';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createDomain = createAsyncThunk(
  'domains/createDomain',
  async (domainData, { rejectWithValue }) => {
    try {
      const response = await domainService.createDomain(domainData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create domain';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateDomain = createAsyncThunk(
  'domains/updateDomain',
  async ({ id, domainData }, { rejectWithValue }) => {
    try {
      const response = await domainService.updateDomain(id, domainData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update domain';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteDomain = createAsyncThunk(
  'domains/deleteDomain',
  async (id, { rejectWithValue }) => {
    try {
      await domainService.deleteDomain(id);
      return id;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete domain';
      return rejectWithValue(errorMessage);
    }
  }
);



// Admin functions
export const fetchAdminDomains = createAsyncThunk(
  'domains/fetchAdminDomains',
  async (_, { rejectWithValue }) => {
    try {
      const response = await domainService.getDomains();
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch admin domains';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateDomainStatus = createAsyncThunk(
  'domains/updateDomainStatus',
  async ({ domainId, status }, { rejectWithValue }) => {
    try {
      const response = await domainService.updateDomain(domainId, { status });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update domain status';
      return rejectWithValue(errorMessage);
    }
  }
);

export const testDomainConnection = createAsyncThunk(
  'domains/testDomainConnection',
  async (domainId, { rejectWithValue }) => {
    try {
      const response = await domainService.testBounceConnection(domainId);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to test domain connection';
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  domains: [],
  isLoading: false,
  error: null,
  currentDomain: null,
};

const domainsSlice = createSlice({
  name: 'domains',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentDomain: (state, action) => {
      state.currentDomain = action.payload;
    },
    clearCurrentDomain: (state) => {
      state.currentDomain = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch domains
      .addCase(fetchDomains.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDomains.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle nested response structure from backend
        const responseData = action.payload.data || action.payload;
        const domainsData = responseData.domains || responseData;
        state.domains = Array.isArray(domainsData) ? domainsData : [];
        state.pagination = responseData.pagination || {};
      })
      .addCase(fetchDomains.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create domain
      .addCase(createDomain.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDomain.fulfilled, (state, action) => {
        state.isLoading = false;
        state.domains.push(action.payload.data || action.payload);
      })
      .addCase(createDomain.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update domain
      .addCase(updateDomain.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDomain.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedDomain = action.payload.data || action.payload;
        const index = state.domains.findIndex(domain => domain.id === updatedDomain.id);
        if (index !== -1) {
          state.domains[index] = updatedDomain;
        }
      })
      .addCase(updateDomain.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete domain
      .addCase(deleteDomain.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDomain.fulfilled, (state, action) => {
        state.isLoading = false;
        state.domains = state.domains.filter(domain => domain.id !== action.payload);
      })
      .addCase(deleteDomain.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Admin functions
      .addCase(fetchAdminDomains.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminDomains.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle nested response structure from backend
        const responseData = action.payload.data || action.payload;
        const domainsData = responseData.domains || responseData;
        state.domains = Array.isArray(domainsData) ? domainsData : [];
        state.pagination = responseData.pagination || {};
      })
      .addCase(fetchAdminDomains.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateDomainStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDomainStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedDomain = action.payload.data || action.payload;
        const index = state.domains.findIndex(domain => domain.id === updatedDomain.id);
        if (index !== -1) {
          state.domains[index] = updatedDomain;
        }
      })
      .addCase(updateDomainStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
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

export const { clearError, setCurrentDomain, clearCurrentDomain } = domainsSlice.actions;
export default domainsSlice.reducer; 