import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';

// Async thunks for 2FA
export const enable2FA = createAsyncThunk(
  'security/enable2FA',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/security/2fa/enable');
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const verify2FA = createAsyncThunk(
  'security/verify2FA',
  async (code, { rejectWithValue }) => {
    try {
      const response = await api.post('/security/2fa/verify', { code });
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const disable2FA = createAsyncThunk(
  'security/disable2FA',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete('/security/2fa/disable');
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

// Async thunks for API Keys
export const fetchApiKeys = createAsyncThunk(
  'security/fetchApiKeys',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/security/api-keys');
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const createApiKey = createAsyncThunk(
  'security/createApiKey',
  async (keyData, { rejectWithValue }) => {
    try {
      const response = await api.post('/security/api-keys', keyData);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const revokeApiKey = createAsyncThunk(
  'security/revokeApiKey',
  async (keyId, { rejectWithValue }) => {
    try {
      await api.delete(`/security/api-keys/${keyId}`);
      return keyId;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

// Async thunks for Activity Log
export const fetchActivityLog = createAsyncThunk(
  'security/fetchActivityLog',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/security/activity', params);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

// Async thunks for Password Change
export const changePassword = createAsyncThunk(
  'security/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await api.post('/security/password/change', passwordData);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

// Async thunk for fetching security settings
export const fetchSecuritySettings = createAsyncThunk(
  'security/fetchSecuritySettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/security/settings');
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

// Async thunk for deleting API key (alias for revokeApiKey for compatibility)
export const deleteApiKey = revokeApiKey;

// Async thunk for fetching active sessions
export const fetchActiveSessions = createAsyncThunk(
  'security/fetchActiveSessions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/security/sessions');
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

// Async thunk for revoking session
export const revokeSession = createAsyncThunk(
  'security/revokeSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await api.delete(`/security/sessions/${sessionId}`);
      return sessionId;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

// Async thunk for fetching trusted devices
export const fetchTrustedDevices = createAsyncThunk(
  'security/fetchTrustedDevices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/security/devices');
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

// Async thunk for trusting device
export const trustDevice = createAsyncThunk(
  'security/trustDevice',
  async (deviceData, { rejectWithValue }) => {
    try {
      const response = await api.post('/security/devices/trust', deviceData);
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

const initialState = {
  // 2FA state
  is2FAEnabled: false,
  qrCodeUrl: null,
  backupCodes: [],
  
  // API Keys state
  apiKeys: [],
  newApiKey: null,
  
  // Activity Log state
  activityLog: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  
  // Security settings
  securitySettings: {},
  
  // Sessions state
  activeSessions: [],
  
  // Trusted devices state
  trustedDevices: [],
  
  // General state
  isLoading: false,
  error: null,
};

const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearNewApiKey: (state) => {
      state.newApiKey = null;
    },
    set2FAEnabled: (state, action) => {
      state.is2FAEnabled = action.payload;
    },
    clear2FASetup: (state) => {
      state.qrCodeUrl = null;
      state.backupCodes = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Enable 2FA
    builder
      .addCase(enable2FA.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(enable2FA.fulfilled, (state, action) => {
        state.isLoading = false;
        state.qrCodeUrl = action.payload.qr_code_url;
        state.backupCodes = action.payload.backup_codes;
      })
      .addCase(enable2FA.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Verify 2FA
    builder
      .addCase(verify2FA.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verify2FA.fulfilled, (state) => {
        state.isLoading = false;
        state.is2FAEnabled = true;
        state.qrCodeUrl = null;
      })
      .addCase(verify2FA.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Disable 2FA
    builder
      .addCase(disable2FA.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(disable2FA.fulfilled, (state) => {
        state.isLoading = false;
        state.is2FAEnabled = false;
        state.qrCodeUrl = null;
        state.backupCodes = [];
      })
      .addCase(disable2FA.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch API Keys
    builder
      .addCase(fetchApiKeys.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApiKeys.fulfilled, (state, action) => {
        state.isLoading = false;
        state.apiKeys = action.payload.data || action.payload;
      })
      .addCase(fetchApiKeys.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create API Key
    builder
      .addCase(createApiKey.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createApiKey.fulfilled, (state, action) => {
        state.isLoading = false;
        state.apiKeys.push(action.payload);
        state.newApiKey = action.payload;
      })
      .addCase(createApiKey.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Revoke API Key
    builder
      .addCase(revokeApiKey.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(revokeApiKey.fulfilled, (state, action) => {
        state.isLoading = false;
        state.apiKeys = state.apiKeys.filter(key => key.id !== action.payload);
      })
      .addCase(revokeApiKey.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Activity Log
    builder
      .addCase(fetchActivityLog.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivityLog.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activityLog = action.payload.data || action.payload;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchActivityLog.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Security Settings
    builder
      .addCase(fetchSecuritySettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSecuritySettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.securitySettings = action.payload;
        state.is2FAEnabled = action.payload.is_2fa_enabled || false;
      })
      .addCase(fetchSecuritySettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Active Sessions
    builder
      .addCase(fetchActiveSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeSessions = action.payload.data || action.payload;
      })
      .addCase(fetchActiveSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Revoke Session
    builder
      .addCase(revokeSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(revokeSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeSessions = state.activeSessions.filter(session => session.id !== action.payload);
      })
      .addCase(revokeSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Trusted Devices
    builder
      .addCase(fetchTrustedDevices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrustedDevices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trustedDevices = action.payload.data || action.payload;
      })
      .addCase(fetchTrustedDevices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Trust Device
    builder
      .addCase(trustDevice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(trustDevice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trustedDevices.push(action.payload);
      })
      .addCase(trustDevice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearNewApiKey, set2FAEnabled, clear2FASetup } = securitySlice.actions;
export default securitySlice.reducer;
