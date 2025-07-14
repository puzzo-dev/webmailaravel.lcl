import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../utils/api';

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      return await api.get('/admin/users', params);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchAdminUsers = createAsyncThunk(
  'users/fetchAdminUsers',
  async (params, { rejectWithValue }) => {
    try {
      return await api.get('/admin/users', params);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'users/updateUserStatus',
  async ({ userId, status }, { rejectWithValue }) => {
    try {
      return await api.put(`/admin/users/${userId}`, { status });
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const fetchUser = createAsyncThunk(
  'users/fetchUser',
  async (userId, { rejectWithValue }) => {
    try {
      return await api.get(`/admin/users/${userId}`);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      return await api.put(`/admin/users/${userId}`, userData);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      return await api.delete(`/admin/users/${userId}`);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'users/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      return await api.put('/user/profile', profileData);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'users/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      return await api.put('/user/password', passwordData);
    } catch (error) {
      return rejectWithValue(handleApiError(error).message);
    }
  }
);

const initialState = {
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  },
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Single User
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u.id !== action.payload);
        if (state.currentUser?.id === action.payload) {
          state.currentUser = null;
        }
      })
      
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      })
      
      // Change Password
      .addCase(changePassword.fulfilled, (state) => {
        // Password change successful, no state update needed
      });
  },
});

export const {
  clearError,
  setCurrentUser,
  clearCurrentUser,
} = userSlice.actions;

export default userSlice.reducer; 