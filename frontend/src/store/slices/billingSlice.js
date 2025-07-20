import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { billingService } from '../../services/api';

// Async thunks
export const fetchSubscriptions = createAsyncThunk(
  'billing/fetchSubscriptions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await billingService.getSubscriptions(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch subscriptions');
    }
  }
);

export const createSubscription = createAsyncThunk(
  'billing/createSubscription',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const response = await billingService.createSubscription(subscriptionData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create subscription');
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'billing/cancelSubscription',
  async (id, { rejectWithValue }) => {
    try {
      const response = await billingService.cancelSubscription(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to cancel subscription');
    }
  }
);

export const createBTCPayInvoice = createAsyncThunk(
  'billing/createBTCPayInvoice',
  async (invoiceData, { rejectWithValue }) => {
    try {
      const response = await billingService.createBTCPayInvoice(invoiceData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create BTCPay invoice');
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'billing/fetchPaymentHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await billingService.getPaymentHistory(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch payment history');
    }
  }
);

export const fetchPaymentRates = createAsyncThunk(
  'billing/fetchPaymentRates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await billingService.getPaymentRates();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch payment rates');
    }
  }
);

export const createManualPayment = createAsyncThunk(
  'billing/createManualPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await billingService.createManualPayment(paymentData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create manual payment');
    }
  }
);

// Admin billing thunks
export const fetchPlans = createAsyncThunk(
  'billing/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await billingService.getPlans();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch plans');
    }
  }
);

export const createPlan = createAsyncThunk(
  'billing/createPlan',
  async (planData, { rejectWithValue }) => {
    try {
      const response = await billingService.createPlan(planData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create plan');
    }
  }
);

export const updatePlan = createAsyncThunk(
  'billing/updatePlan',
  async ({ id, planData }, { rejectWithValue }) => {
    try {
      const response = await billingService.updatePlan(id, planData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update plan');
    }
  }
);

export const deletePlan = createAsyncThunk(
  'billing/deletePlan',
  async (id, { rejectWithValue }) => {
    try {
      const response = await billingService.deletePlan(id);
      return { id, ...response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete plan');
    }
  }
);

export const fetchBillingStats = createAsyncThunk(
  'billing/fetchBillingStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await billingService.getBillingStats();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch billing stats');
    }
  }
);

export const fetchAllSubscriptions = createAsyncThunk(
  'billing/fetchAllSubscriptions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await billingService.getAllSubscriptions(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch all subscriptions');
    }
  }
);

export const processManualPayment = createAsyncThunk(
  'billing/processManualPayment',
  async ({ subscriptionId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await billingService.processManualPayment(subscriptionId, paymentData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to process manual payment');
    }
  }
);

const initialState = {
  subscriptions: [],
  currentSubscription: null,
  paymentHistory: [],
  paymentRates: {},
  invoices: [],
  plans: [],
  billingStats: {},
  allSubscriptions: [],
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
        // Handle nested data structure: action.payload.data
        state.subscriptions = action.payload.data || action.payload || [];
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
        // Handle nested data structure: action.payload.data
        state.paymentHistory = action.payload.data || action.payload || [];
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
        state.paymentRates = action.payload || {};
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

    // Fetch plans
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = action.payload || [];
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create plan
    builder
      .addCase(createPlan.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPlan.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans.push(action.payload);
      })
      .addCase(createPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update plan
    builder
      .addCase(updatePlan.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePlan.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.plans.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.plans[index] = action.payload;
        }
      })
      .addCase(updatePlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete plan
    builder
      .addCase(deletePlan.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletePlan.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = state.plans.filter(p => p.id !== action.payload.id);
      })
      .addCase(deletePlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch billing stats
    builder
      .addCase(fetchBillingStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBillingStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.billingStats = action.payload || {};
      })
      .addCase(fetchBillingStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch all subscriptions
    builder
      .addCase(fetchAllSubscriptions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllSubscriptions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allSubscriptions = action.payload || [];
      })
      .addCase(fetchAllSubscriptions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Process manual payment
    builder
      .addCase(processManualPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processManualPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.allSubscriptions.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.allSubscriptions[index] = action.payload;
        }
      })
      .addCase(processManualPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentSubscription } = billingSlice.actions;
export default billingSlice.reducer;
