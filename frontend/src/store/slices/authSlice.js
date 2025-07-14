import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // For session auth, just check if user is authenticated
      const response = await api.get('/user/profile');
      // The backend returns: { success: true, message: "...", data: { user data } }
      const user = response.data || response;
      if (!user) {
        return { user: null };
      }
      return { user };
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Don't throw error, just return null user for session auth
      return { user: null };
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ identifier, password, remember }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', {
        identifier,
        password,
        remember: remember,
      });
      
      // Handle the backend response structure
      const responseData = response.data || response;
      const user = responseData.user || responseData;
      
      if (!user) {
        throw new Error('No user data received from server');
      }
      
      return { user };
    } catch (error) {
      console.error('Login error:', error);
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      // Handle the backend response structure
      const responseData = response.data || response;
      const user = responseData.user || responseData;
      
      if (!user) {
        throw new Error('No user data received from server');
      }
      
      return { user };
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      return null;
    } catch (error) {
      // Even if logout fails, we consider it successful for session auth
      return null;
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
      });
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const verify2FA = createAsyncThunk(
  'auth/verify2FA',
  async (code, { rejectWithValue }) => {
    try {
      const response = await api.post('/security/2fa/verify', { code });
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.post('/security/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPassword,
      });
      return response;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await api.put('/user/password', passwordData);
      // Handle the backend response structure
      const responseData = response.data || response;
      return responseData;
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/user/profile', profileData);
      // Handle the backend response structure
      const responseData = response.data || response;
      const user = responseData.user || responseData;
      return { user };
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  requires2FA: false,
  is2FAVerified: false,
  loginAttempts: 0,
  lastLoginAttempt: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setRequires2FA: (state, action) => {
      state.requires2FA = action.payload;
    },
    set2FAVerified: (state, action) => {
      state.is2FAVerified = action.payload;
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      state.lastLoginAttempt = new Date().toISOString();
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Initialize Auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.user) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.requires2FA = action.payload.user.two_factor_enabled || false;
          state.is2FAVerified = !action.payload.user.two_factor_enabled;
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.requires2FA = false;
          state.is2FAVerified = false;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.requires2FA = false;
        state.is2FAVerified = false;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.requires2FA = action.payload.user.two_factor_enabled;
        state.is2FAVerified = !action.payload.user.two_factor_enabled;
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.requires2FA = false;
        state.is2FAVerified = false;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.requires2FA = action.payload.user.two_factor_enabled;
        state.is2FAVerified = !action.payload.user.two_factor_enabled;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.requires2FA = false;
        state.is2FAVerified = false;
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
      });

    // Update Profile
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload.user };
      });

    // Update Password
    builder
      .addCase(updatePassword.fulfilled, (state) => {
        // Password updated successfully
      });
  },
});

export const {
  clearError,
  setRequires2FA,
  set2FAVerified,
  incrementLoginAttempts,
  resetLoginAttempts,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer; 