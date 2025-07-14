import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';

// Async thunks
export const fetchSenders = createAsyncThunk(
  'senders/fetchSenders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/senders', params);
      return response;
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
      return response;
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
      return response;
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
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/senders/${id}/test`);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
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
        state.senders = action.payload.data || action.payload;
        state.pagination = action.payload.pagination || state.pagination;
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
        state.senders.push(action.payload);
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
        const index = state.senders.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.senders[index] = action.payload;
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
        state.senders = state.senders.filter(s => s.id !== action.payload);
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
