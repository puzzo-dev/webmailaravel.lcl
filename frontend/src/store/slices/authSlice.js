import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/api';

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // Try to get user profile - if successful, user is authenticated
      const response = await authService.getProfile(true); // Mark as auth init
      const user = response.data?.user || response.user || response;

      if (user) {
        return { user };
      } else {
        return rejectWithValue('No user found');
      }
    } catch (_error) {
      // If API call fails (no cookie, expired token, etc.), user is not authenticated
      return rejectWithValue('Not authenticated');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ identifier, password, remember }, { rejectWithValue }) => {
    try {
      const response = await authService.login({
        identifier,
        password,
        remember: remember,
      });

      // The API returns: { success: true, data: { user: {...} } }
      if (response.success && response.data && response.data.user) {
        return response;
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);

      // The API returns: { success: true, data: { user: {...} } }
      if (response.success && response.data && response.data.user) {
        return response;
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (error) {
      console.error('Register error in authSlice:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await authService.logout();
      return {};
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local data
      return {};
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.refreshToken();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Password reset request failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (resetData, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(resetData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Password reset failed');
    }
  }
);

export const verify2FA = createAsyncThunk(
  'auth/verify2FA',
  async (verificationData, { rejectWithValue }) => {
    try {
      const response = await authService.verify2FA(verificationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || '2FA verification failed');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Password change failed');
    }
  }
);

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await authService.updatePassword(passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Password update failed');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData);
      const responseData = await response.json();
      const user = responseData.user || responseData;

      return { user };
    } catch (error) {
      return rejectWithValue(error.message || 'Profile update failed');
    }
  }
);

// Check if we might be authenticated on app start (to prevent flash of unauthenticated content)
const hasStoredAuth = () => {
  try {
    // Check if we have any indication of being logged in
    return document.cookie.includes('laravel_session') ||
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('auth_token');
  } catch {
    return false;
  }
};

const initialState = {
  user: null, // Will be initialized by initializeAuth
  isAuthenticated: false, // Will be determined by API call
  isLoading: true, // Always start with loading to prevent premature redirects
  error: null,
  currentView: 'user', // 'user' or 'admin' - for admin users to switch between views
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.currentView = 'user';
    },
    switchToAdminView: (state) => {
      if (state.user?.role === 'admin') {
        state.currentView = 'admin';
      }
    },
    switchToUserView: (state) => {
      if (state.user?.role === 'admin') {
        state.currentView = 'user';
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        const user = action.payload.user;
        state.user = user;
        state.isAuthenticated = !!user;
        // Admin users start in user view by default
        state.currentView = 'user';
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle both response structures: action.payload.data.user and action.payload.user
        const user = action.payload.data?.user || action.payload.user;
        state.user = user;
        state.isAuthenticated = !!user;
        // Admin users start in user view by default
        state.currentView = 'user';
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle both response structures: action.payload.data.user and action.payload.user
        const user = action.payload.data?.user || action.payload.user;
        state.user = user;
        state.isAuthenticated = !!user;
        // Admin users start in user view by default
        state.currentView = 'user';
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Refresh Token
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshToken.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Verify 2FA
      .addCase(verify2FA.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verify2FA.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verify2FA.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Change Password
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
      })
      // Update Password
      .addCase(updatePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser, clearAuth, switchToAdminView, switchToUserView } = authSlice.actions;
export default authSlice.reducer; 