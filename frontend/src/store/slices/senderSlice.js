import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';
import { serializeError } from '../../utils/errorHandler';

// Async thunks
export const fetchSenders = createAsyncThunk(
  'senders/fetchSenders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/senders', params);
      // The API response structure is: { success: true, message: "...", data: [...], pagination: {...} }
      // So response.data contains the entire response object
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const createSender = createAsyncThunk(
  'senders/createSender',
  async (senderData, { rejectWithValue }) => {
    try {
      const response = await api.post('/senders', senderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateSender = createAsyncThunk(
  'senders/updateSender',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/senders/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const deleteSender = createAsyncThunk(
  'senders/deleteSender',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/senders/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const testSenderConnection = createAsyncThunk(
  'senders/testSenderConnection',
  async ({ id, test_email }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/senders/${id}/test`, { test_email });
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeError(error));
    }
  }
);

const initialState = {
  senders: [],
  currentSender: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

const senderSlice = createSlice({
  name: 'senders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentSender: (state, action) => {
      state.currentSender = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch senders
    builder
      .addCase(fetchSenders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSenders.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle the API response structure: { success: true, message: "...", data: [...], pagination: {...} }
        const responseData = action.payload;
        const sendersData = responseData?.data || [];
        
        state.senders = Array.isArray(sendersData) ? sendersData : [];
        state.pagination = responseData?.pagination || state.pagination;
      })
      .addCase(fetchSenders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create sender
    builder
      .addCase(createSender.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSender.fulfilled, (state, action) => {
        state.isLoading = false;
        const newSender = action.payload.data || action.payload;
        if (newSender && Array.isArray(state.senders)) {
          state.senders.push(newSender);
        }
      })
      .addCase(createSender.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update sender
    builder
      .addCase(updateSender.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSender.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedSender = action.payload.data || action.payload;
        if (updatedSender && Array.isArray(state.senders)) {
          const index = state.senders.findIndex(s => s.id === updatedSender.id);
          if (index !== -1) {
            state.senders[index] = updatedSender;
          }
        }
      })
      .addCase(updateSender.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete sender
    builder
      .addCase(deleteSender.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSender.fulfilled, (state, action) => {
        state.isLoading = false;
        if (Array.isArray(state.senders)) {
          state.senders = state.senders.filter(s => s.id !== action.payload);
        }
      })
      .addCase(deleteSender.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Test sender connection
    builder
      .addCase(testSenderConnection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(testSenderConnection.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(testSenderConnection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentSender } = senderSlice.actions;
export default senderSlice.reducer;
