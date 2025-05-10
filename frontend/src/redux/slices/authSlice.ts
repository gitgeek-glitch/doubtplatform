import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '@/lib/api'

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
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
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
      const response = await api.post('/auth/login', { email, password })
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.token)
      
      // Set default auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
      
      return response.data.user
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Invalid email or password')
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
      const response = await api.post('/auth/register', { name, email, password })
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.token)
      
      // Set default auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
      
      return response.data.user
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Could not create account')
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
    },
    clearError: (state) => {
      state.error = null
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
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer