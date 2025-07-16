import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';

export const fetchCampaigns = createAsyncThunk(
  'campaigns/fetchCampaigns',
  async (params, { rejectWithValue }) => {
    try {
      return await api.get('/campaigns', params);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchRecentCampaigns = createAsyncThunk(
  'campaigns/fetchRecentCampaigns',
  async (params, { rejectWithValue }) => {
    try {
      return await api.get('/campaigns/recent', params);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchCampaign = createAsyncThunk(
  'campaigns/fetchCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      return await api.get(`/campaigns/${campaignId}`);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const createCampaign = createAsyncThunk(
  'campaigns/createCampaign',
  async (campaignData, { rejectWithValue }) => {
    try {
      return await api.post('/campaigns', campaignData);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateCampaign = createAsyncThunk(
  'campaigns/updateCampaign',
  async ({ campaignId, campaignData }, { rejectWithValue }) => {
    try {
      return await api.put(`/campaigns/${campaignId}`, campaignData);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const deleteCampaign = createAsyncThunk(
  'campaigns/deleteCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      return await api.delete(`/campaigns/${campaignId}`);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const startCampaign = createAsyncThunk(
  'campaigns/startCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      return await api.post(`/campaigns/${campaignId}/start`);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const pauseCampaign = createAsyncThunk(
  'campaigns/pauseCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      return await api.post(`/campaigns/${campaignId}/pause`);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const stopCampaign = createAsyncThunk(
  'campaigns/stopCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      return await api.post(`/campaigns/${campaignId}/stop`);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchCampaignStats = createAsyncThunk(
  'campaigns/fetchCampaignStats',
  async (campaignId, { rejectWithValue }) => {
    try {
      return await api.get(`/campaigns/${campaignId}/stats`);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchCampaignTracking = createAsyncThunk(
  'campaigns/fetchCampaignTracking',
  async ({ campaignId, type }, { rejectWithValue }) => {
    try {
      return await api.get(`/campaigns/${campaignId}/tracking`, { type });
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchSenders = createAsyncThunk(
  'campaigns/fetchSenders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/senders');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching senders:', error);
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchDomains = createAsyncThunk(
  'campaigns/fetchDomains',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/domains');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching domains:', error);
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchContents = createAsyncThunk(
  'campaigns/fetchContents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/contents');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching contents:', error);
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

const initialState = {
  campaigns: [],
  currentCampaign: null,
  campaignStats: null,
  campaignTracking: null,
  senders: [],
  domains: [],
  contents: [],
  isLoading: false,
  error: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  },
};

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentCampaign: (state, action) => {
      state.currentCampaign = action.payload;
    },
    clearCurrentCampaign: (state) => {
      state.currentCampaign = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Campaigns
      .addCase(fetchCampaigns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.campaigns = action.payload.data || action.payload;
        state.pagination = action.payload.meta || action.payload.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: (action.payload.data || action.payload)?.length || 0,
        };
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Recent Campaigns
      .addCase(fetchRecentCampaigns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentCampaigns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.campaigns = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchRecentCampaigns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Single Campaign
      .addCase(fetchCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCampaign = action.payload;
      })
      .addCase(fetchCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Campaign
      .addCase(createCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        const campaign = action.payload.data || action.payload;
        if (campaign) {
          state.campaigns.unshift(campaign);
        }
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Campaign
      .addCase(updateCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
        if (state.currentCampaign?.id === action.payload.id) {
          state.currentCampaign = action.payload;
        }
      })
      
      // Delete Campaign
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.filter(c => c.id !== action.payload);
        if (state.currentCampaign?.id === action.payload) {
          state.currentCampaign = null;
        }
      })
      
      // Start Campaign
      .addCase(startCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
        if (state.currentCampaign?.id === action.payload.id) {
          state.currentCampaign = action.payload;
        }
      })
      
      // Pause Campaign
      .addCase(pauseCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
        if (state.currentCampaign?.id === action.payload.id) {
          state.currentCampaign = action.payload;
        }
      })
      
      // Stop Campaign
      .addCase(stopCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
        if (state.currentCampaign?.id === action.payload.id) {
          state.currentCampaign = action.payload;
        }
      })
      
      // Fetch Campaign Stats
      .addCase(fetchCampaignStats.fulfilled, (state, action) => {
        state.campaignStats = action.payload;
      })
      
      // Fetch Campaign Tracking
      .addCase(fetchCampaignTracking.fulfilled, (state, action) => {
        state.campaignTracking = action.payload;
      })
      
      // Fetch Senders
      .addCase(fetchSenders.fulfilled, (state, action) => {
        state.senders = action.payload || [];
      })
      .addCase(fetchSenders.rejected, (state, action) => {
        state.senders = [];
        state.error = action.payload;
      })
      
      // Fetch Domains
      .addCase(fetchDomains.fulfilled, (state, action) => {
        state.domains = action.payload || [];
      })
      .addCase(fetchDomains.rejected, (state, action) => {
        state.domains = [];
        state.error = action.payload;
      })
      
      // Fetch Contents
      .addCase(fetchContents.fulfilled, (state, action) => {
        state.contents = action.payload || [];
      })
      .addCase(fetchContents.rejected, (state, action) => {
        state.contents = [];
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentCampaign,
  clearCurrentCampaign,
} = campaignSlice.actions;

export default campaignSlice.reducer;
