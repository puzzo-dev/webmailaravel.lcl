import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';

// Async thunks
export const fetchSubscriptions = createAsyncThunk(
  'billing/fetchSubscriptions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/subscriptions', params);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const createSubscription = createAsyncThunk(
  'billing/createSubscription',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/subscriptions', subscriptionData);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'billing/cancelSubscription',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/subscriptions/${id}/cancel`);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const createBTCPayInvoice = createAsyncThunk(
  'billing/createBTCPayInvoice',
  async (invoiceData, { rejectWithValue }) => {
    try {
      const response = await api.post('/btcpay/invoice', invoiceData);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'billing/fetchPaymentHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/btcpay/history', params);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchPaymentRates = createAsyncThunk(
  'billing/fetchPaymentRates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/btcpay/rates');
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const createManualPayment = createAsyncThunk(
  'billing/createManualPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/btcpay/manual/payment', paymentData);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

const initialState = {
  subscriptions: [],
  currentSubscription: null,
  paymentHistory: [],
  paymentRates: {},
  invoices: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentSubscription: (state, action) => {
      state.currentSubscription = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch subscriptions
    builder
      .addCase(fetchSubscriptions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscriptions = action.payload.data || action.payload;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create subscription
    builder
      .addCase(createSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscriptions.push(action.payload);
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Cancel subscription
    builder
      .addCase(cancelSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.subscriptions.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.subscriptions[index] = action.payload;
        }
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create BTCPay invoice
    builder
      .addCase(createBTCPayInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBTCPayInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices.push(action.payload);
      })
      .addCase(createBTCPayInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch payment history
    builder
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentHistory = action.payload.data || action.payload;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch payment rates
    builder
      .addCase(fetchPaymentRates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentRates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentRates = action.payload;
      })
      .addCase(fetchPaymentRates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create manual payment
    builder
      .addCase(createManualPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createManualPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentHistory.unshift(action.payload);
      })
      .addCase(createManualPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentSubscription } = billingSlice.actions;
export default billingSlice.reducer;
