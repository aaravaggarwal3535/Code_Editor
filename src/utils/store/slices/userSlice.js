import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Async thunk for user login
 */
export const loginUser = createAsyncThunk(
  'user/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      // Simulate API call
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          // Mock successful login for demo purposes
          if (username === 'demo' && password === 'password') {
            resolve({
              status: 200,
              data: {
                id: '1',
                username: 'demo',
                name: 'Demo User',
                email: 'demo@example.com',
                preferences: { theme: 'dark' }
              }
            });
          } else {
            resolve({ status: 401, data: { message: 'Invalid credentials' } });
          }
        }, 1000);
      });

      if (response.status !== 200) {
        return rejectWithValue(response.data);
      }

      // Store token in localStorage
      localStorage.setItem('auth_token', 'demo_token_' + Date.now());
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Async thunk for user logout
 */
export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Clear auth token
      localStorage.removeItem('auth_token');
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * User slice for Redux store
 */
const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserPreferences: (state, action) => {
      if (state.currentUser) {
        state.currentUser.preferences = {
          ...state.currentUser.preferences,
          ...action.payload
        };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.currentUser = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.currentUser = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Logout failed';
      });
  },
});

export const { clearError, updateUserPreferences } = userSlice.actions;
export default userSlice.reducer;