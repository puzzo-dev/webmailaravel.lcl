import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../services/api';

// Async thunks
export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getProfile();
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch user profile';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await userService.getUsers(params);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch users';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchAdminUsers = createAsyncThunk(
  'user/fetchAdminUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await userService.getAdminUsers(params);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch admin users';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'user/updateUserStatus',
  async ({ userId, status }, { rejectWithValue }) => {
    try {
      const response = await userService.updateUserStatus(userId, status);
      return { userId, status, ...response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update user status';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userService.deleteUser(userId);
      return { userId, ...response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await userService.updateProfile(profileData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      return rejectWithValue(errorMessage);
    }
  }
);

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await userService.changePassword(passwordData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      return rejectWithValue(errorMessage);
    }
  }
);

// Initial state
const initialState = {
  currentUser: null,
  users: [],
  adminUsers: [],
  loading: false,
  error: null,
  profileLoading: false,
  profileError: null
};

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
      state.profileError = null;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload;
      })
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data || action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch admin users
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.adminUsers = action.payload.data || action.payload;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update user status
      .addCase(updateUserStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update user in both arrays
        const updateUser = (users) => users.map(user => 
          user.id === action.payload.userId 
            ? { ...user, status: action.payload.status }
            : user
        );
        state.users = updateUser(state.users);
        state.adminUsers = updateUser(state.adminUsers);
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(user => user.id !== action.payload.userId);
        state.adminUsers = state.adminUsers.filter(user => user.id !== action.payload.userId);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload;
      })
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.profileLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload;
      });
  }
});

export const { clearUserError, clearCurrentUser } = userSlice.actions;
export default userSlice.reducer; 