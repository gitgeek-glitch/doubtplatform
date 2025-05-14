import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api, isRateLimited, getRateLimitInfo } from '@/lib/api'

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  reputation: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  rateLimited: boolean
  rateLimitRetryAfter: number
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  rateLimited: false,
  rateLimitRetryAfter: 0
}

// Async thunks
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        return null
      }
      
      // Set default auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Verify token and get user data
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      // Clear invalid token
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      return rejectWithValue('Authentication failed')
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Check if endpoint is rate limited before making request
      const endpoint = '/auth/login';
      if (isRateLimited(endpoint)) {
        const rateLimitInfo = getRateLimitInfo(endpoint);
        const waitTimeMs = Math.max(rateLimitInfo.nextAllowedTime - Date.now(), 1000);
        const waitTimeSec = Math.ceil(waitTimeMs / 1000);
        
        return rejectWithValue({
          message: `Too many login attempts. Please try again in ${waitTimeSec} seconds.`,
          rateLimited: true,
          retryAfter: waitTimeMs
        });
      }
      
      const response = await api.post('/auth/login', { email, password });
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      
      // Set default auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      return response.data.user;
    } catch (error: any) {
      // Check if rate limited
      if (error.response?.status === 429) {
        // Get retry-after header or use default
        const retryAfter = error.response.headers["retry-after"];
        const waitTimeMs = (retryAfter ? parseInt(retryAfter, 10) * 1000 : 30000);
        const waitTimeSec = Math.ceil(waitTimeMs / 1000);
        
        return rejectWithValue({
          message: error.response?.data || `Too many login attempts. Please try again in ${waitTimeSec} seconds.`,
          rateLimited: true,
          retryAfter: waitTimeMs,
          status: 429
        });
      }
      
      return rejectWithValue({
        message: error.response?.data?.message || 'Invalid email or password',
        rateLimited: false
      });
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    { name, email, password }: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      // Check if endpoint is rate limited before making request
      const endpoint = '/auth/register'
      if (isRateLimited(endpoint)) {
        const rateLimitInfo = getRateLimitInfo(endpoint)
        const waitTimeMs = rateLimitInfo.retryAfter
        const waitTimeSec = Math.ceil(waitTimeMs / 1000)
        
        return rejectWithValue({
          message: `Too many registration attempts. Please try again in ${waitTimeSec} seconds.`,
          rateLimited: true,
          retryAfter: waitTimeMs
        })
      }
      
      const response = await api.post('/auth/register', { name, email, password })
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.token)
      
      // Set default auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
      
      return response.data.user
    } catch (error: any) {
      // Check if rate limited
      if (error.response?.status === 429) {
        const rateLimitInfo = getRateLimitInfo('/auth/register')
        const waitTimeMs = rateLimitInfo.retryAfter
        const waitTimeSec = Math.ceil(waitTimeMs / 1000)
        
        return rejectWithValue({
          message: `Too many registration attempts. Please try again in ${waitTimeSec} seconds.`,
          rateLimited: true,
          retryAfter: waitTimeMs
        })
      }
      
      return rejectWithValue({
        message: error.response?.data?.message || 'Could not create account',
        rateLimited: false
      })
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // Clear token from localStorage
      localStorage.removeItem('token')
      
      // Remove auth header
      delete api.defaults.headers.common['Authorization']
      
      // Reset state
      state.user = null
      state.isAuthenticated = false
      state.error = null
      state.rateLimited = false
      state.rateLimitRetryAfter = 0
    },
    clearError: (state) => {
      state.error = null
      state.rateLimited = false
      state.rateLimitRetryAfter = 0
    },
  },
  extraReducers: (builder) => {
    builder
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) {
          state.user = action.payload
          state.isAuthenticated = true
        } else {
          state.user = null
          state.isAuthenticated = false
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.isAuthenticated = false
      })
      
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.rateLimited = false
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
        state.rateLimited = false
        state.rateLimitRetryAfter = 0
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        
        // Handle rate limiting rejection
        const payload = action.payload as any
        if (payload?.rateLimited) {
          state.rateLimited = true
          state.rateLimitRetryAfter = payload.retryAfter || 0
        } else {
          state.rateLimited = false
          state.rateLimitRetryAfter = 0
        }
        
        state.error = payload?.message || 'Login failed'
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.rateLimited = false
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
        state.rateLimited = false
        state.rateLimitRetryAfter = 0
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        
        // Handle rate limiting rejection
        const payload = action.payload as any
        if (payload?.rateLimited) {
          state.rateLimited = true
          state.rateLimitRetryAfter = payload.retryAfter || 0
        } else {
          state.rateLimited = false
          state.rateLimitRetryAfter = 0
        }
        
        state.error = payload?.message || 'Registration failed'
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer