import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';
import { serializeError } from '../../utils/errorHandler';

export const fetchCampaigns = createAsyncThunk(
  'campaigns/fetchCampaigns',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/campaigns', params);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const fetchRecentCampaigns = createAsyncThunk(
  'campaigns/fetchRecentCampaigns',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/campaigns/recent', params);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const fetchCampaign = createAsyncThunk(
  'campaigns/fetchCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const createCampaign = createAsyncThunk(
  'campaigns/createCampaign',
  async (campaignData, { rejectWithValue }) => {
    try {


      // Remove Content-Type header for FormData
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      const response = await api.post('/campaigns', campaignData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const updateCampaign = createAsyncThunk(
  'campaigns/updateCampaign',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      const response = await api.put(`/campaigns/${id}`, data, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const deleteCampaign = createAsyncThunk(
  'campaigns/deleteCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/campaigns/${campaignId}`);
      return campaignId;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const startCampaign = createAsyncThunk(
  'campaigns/startCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/campaigns/${campaignId}/start`);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const pauseCampaign = createAsyncThunk(
  'campaigns/pauseCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/campaigns/${campaignId}/pause`);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const stopCampaign = createAsyncThunk(
  'campaigns/stopCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/campaigns/${campaignId}/stop`);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const resumeCampaign = createAsyncThunk(
  'campaigns/resumeCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/campaigns/${campaignId}/resume`);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const duplicateCampaign = createAsyncThunk(
  'campaigns/duplicateCampaign',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/campaigns/${campaignId}/duplicate`);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const fetchCampaignStats = createAsyncThunk(
  'campaigns/fetchCampaignStats',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/campaigns/${campaignId}/stats`);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const fetchCampaignTracking = createAsyncThunk(
  'campaigns/fetchCampaignTracking',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/campaigns/${campaignId}/tracking`);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

export const fetchSenders = createAsyncThunk(
  'campaigns/fetchSenders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/senders');
      return {
        data: response.data?.data || [],
        pagination: response.data?.pagination || null
      };
    } catch (error) {
      console.error('Error fetching senders:', error);
      return rejectWithValue(serializeError(error));
    }
  }
);

export const fetchDomains = createAsyncThunk(
  'campaigns/fetchDomains',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/domains');
      return {
        data: response.data?.data || [],
        pagination: response.data?.pagination || null
      };
    } catch (error) {
      console.error('Error fetching domains:', error);
      return rejectWithValue(serializeError(error));
    }
  }
);

export const fetchContents = createAsyncThunk(
  'campaigns/fetchContents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/contents');
      return {
        data: response.data?.data || [],
        pagination: response.data?.pagination || null
      };
    } catch (error) {
      console.error('Error fetching contents:', error);
      return rejectWithValue(serializeError(error));
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
        // Handle API response structure: { success, message, data, pagination }
        const campaignsData = action.payload.data || [];
        state.campaigns = Array.isArray(campaignsData) ? campaignsData : [];
        state.pagination = action.payload.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: Array.isArray(campaignsData) ? campaignsData.length : 0,
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
        // Handle API response structure: { success, message, data, pagination }
        const campaignsData = action.payload.data || [];
        state.campaigns = Array.isArray(campaignsData) ? campaignsData : [];
        state.pagination = action.payload.pagination || action.payload.meta;
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
        state.currentCampaign = action.payload.data || action.payload;
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
      .addCase(updateCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        state.isLoading = false;
        const campaign = action.payload.data || action.payload;
        const index = state.campaigns.findIndex(c => c.id === campaign.id);
        if (index !== -1) {
          state.campaigns[index] = campaign;
        }
        if (state.currentCampaign?.id === campaign.id) {
          state.currentCampaign = campaign;
        }
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
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
        const campaign = action.payload.data || action.payload;
        const index = state.campaigns.findIndex(c => c.id === campaign.id);
        if (index !== -1) {
          state.campaigns[index] = campaign;
        }
        if (state.currentCampaign?.id === campaign.id) {
          state.currentCampaign = campaign;
        }
      })

      // Pause Campaign
      .addCase(pauseCampaign.pending, (state) => {
        state.loading = true;
      })
      .addCase(pauseCampaign.fulfilled, (state, action) => {
        state.loading = false;
        const campaign = action.payload.data || action.payload;
        const index = state.campaigns.findIndex(c => c.id === campaign.id);
        if (index !== -1) {
          state.campaigns[index] = campaign;
        }
        if (state.currentCampaign?.id === campaign.id) {
          state.currentCampaign = campaign;
        }
      })
      .addCase(pauseCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to pause campaign';
      })

      // Stop Campaign
      .addCase(stopCampaign.fulfilled, (state, action) => {
        const campaign = action.payload.data || action.payload;
        const index = state.campaigns.findIndex(c => c.id === campaign.id);
        if (index !== -1) {
          state.campaigns[index] = campaign;
        }
        if (state.currentCampaign?.id === campaign.id) {
          state.currentCampaign = campaign;
        }
      })

      // Resume Campaign
      .addCase(resumeCampaign.pending, (state) => {
        state.loading = true;
      })
      .addCase(resumeCampaign.fulfilled, (state, action) => {
        state.loading = false;
        const campaign = action.payload.data || action.payload;
        const index = state.campaigns.findIndex(c => c.id === campaign.id);
        if (index !== -1) {
          state.campaigns[index] = campaign;
        }
        if (state.currentCampaign?.id === campaign.id) {
          state.currentCampaign = campaign;
        }
      })
      .addCase(resumeCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to resume campaign';
      })

      // Duplicate Campaign
      .addCase(duplicateCampaign.fulfilled, (state, action) => {
        const duplicatedCampaign = action.payload.data || action.payload;
        // Add the duplicated campaign to the beginning of the campaigns list
        state.campaigns.unshift(duplicatedCampaign);
      })

      // Fetch Campaign Stats
      .addCase(fetchCampaignStats.fulfilled, (state, action) => {
        state.campaignStats = action.payload.data || action.payload;
      })

      // Fetch Campaign Tracking
      .addCase(fetchCampaignTracking.fulfilled, (state, action) => {
        state.campaignTracking = action.payload.data || action.payload;
      })

      // Fetch Senders
      .addCase(fetchSenders.fulfilled, (state, action) => {
        const sendersData = action.payload.data || action.payload;
        state.senders = Array.isArray(sendersData) ? sendersData : [];
      })
      .addCase(fetchSenders.rejected, (state, action) => {
        state.senders = [];
        state.error = action.payload;
      })

      // Fetch Domains
      .addCase(fetchDomains.fulfilled, (state, action) => {
        const domainsData = action.payload.data || action.payload;
        state.domains = Array.isArray(domainsData) ? domainsData : [];
      })
      .addCase(fetchDomains.rejected, (state, action) => {
        state.domains = [];
        state.error = action.payload;
      })

      // Fetch Contents
      .addCase(fetchContents.fulfilled, (state, action) => {
        const contentsData = action.payload.data || action.payload;
        state.contents = Array.isArray(contentsData) ? contentsData : [];
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
