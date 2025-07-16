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

export const verifyDomain = createAsyncThunk(
  'domains/verifyDomain',
  async (id, { rejectWithValue }) => {
    try {
      const response = await domainService.verifyDomain(id);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to verify domain';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateDomainConfig = createAsyncThunk(
  'domains/updateDomainConfig',
  async ({ id, configData }, { rejectWithValue }) => {
    try {
      const response = await domainService.updateDomainConfig(id, configData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update domain configuration';
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
        state.domains = action.payload.data || action.payload;
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
      // Verify domain
      .addCase(verifyDomain.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyDomain.fulfilled, (state, action) => {
        state.isLoading = false;
        const verifiedDomain = action.payload.data || action.payload;
        const index = state.domains.findIndex(domain => domain.id === verifiedDomain.id);
        if (index !== -1) {
          state.domains[index] = verifiedDomain;
        }
      })
      .addCase(verifyDomain.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update domain config
      .addCase(updateDomainConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDomainConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedDomain = action.payload.data || action.payload;
        const index = state.domains.findIndex(domain => domain.id === updatedDomain.id);
        if (index !== -1) {
          state.domains[index] = updatedDomain;
        }
      })
      .addCase(updateDomainConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentDomain, clearCurrentDomain } = domainsSlice.actions;
export default domainsSlice.reducer; 