import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { api } from "@/lib/api"

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  reputation: number
}

interface AuthState {
  user: User | null
  token: string | null // Added token field to match your store configuration
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  rateLimited: boolean
  rateLimitRetryAfter: number
}

const initialState: AuthState = {
  user: null,
  token: null, // Initialize token as null
  isAuthenticated: false,
  isLoading: true,
  error: null,
  rateLimited: false,
  rateLimitRetryAfter: 0,
}

// Helper function to setup auth header
const setupAuthHeader = (token: string) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
  }
}

// Async thunks
export const checkAuthStatus = createAsyncThunk("auth/checkStatus", async (_, { rejectWithValue, getState }) => {
  try {
    // Get token from state or localStorage as fallback
    const state = getState() as { auth: AuthState }
    let token = state.auth.token

    if (!token) {
      token = localStorage.getItem("token")
    }

    if (!token) {
      return rejectWithValue("No token found")
    }

    // Set default auth header
    setupAuthHeader(token)

    // Verify token and get user data
    const response = await api.get("/auth/me")
    return { user: response.data.user, token }
  } catch (error) {
    // Clear invalid token
    localStorage.removeItem("token")
    delete api.defaults.headers.common["Authorization"]
    return rejectWithValue("Authentication failed")
  }
})

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", { email, password })
      const token = response.data.token

      // Save token to localStorage
      localStorage.setItem("token", token)

      // Set default auth header
      setupAuthHeader(token)

      return { user: response.data.user, token }
    } catch (error: any) {
      // Handle server-returned rate limiting if it occurs
      if (error.response?.status === 429) {
        return rejectWithValue({
          message: error.response?.data?.message || "Too many login attempts. Please try again later.",
          rateLimited: true,
          retryAfter: error.response?.headers?.["retry-after"]
            ? Number.parseInt(error.response.headers["retry-after"]) * 1000
            : 30000,
        })
      }

      return rejectWithValue({
        message: error.response?.data?.message || "Invalid email or password",
        rateLimited: false,
      })
    }
  },
)

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ name, email, password }: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/register", { name, email, password })
      const token = response.data.token

      // Save token to localStorage
      localStorage.setItem("token", token)

      // Set default auth header
      setupAuthHeader(token)

      return { user: response.data.user, token }
    } catch (error: any) {
      // Handle server-returned rate limiting if it occurs
      if (error.response?.status === 429) {
        return rejectWithValue({
          message: error.response?.data?.message || "Too many registration attempts. Please try again later.",
          rateLimited: true,
          retryAfter: error.response?.headers?.["retry-after"]
            ? Number.parseInt(error.response.headers["retry-after"]) * 1000
            : 30000,
        })
      }

      return rejectWithValue({
        message: error.response?.data?.message || "Could not create account",
        rateLimited: false,
      })
    }
  },
)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      // Clear token from localStorage
      localStorage.removeItem("token")

      // Remove auth header
      delete api.defaults.headers.common["Authorization"]

      // Reset state
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      state.rateLimited = false
      state.rateLimitRetryAfter = 0
    },
    clearError: (state) => {
      state.error = null
      state.rateLimited = false
      state.rateLimitRetryAfter = 0
      state.isLoading = false // Also reset loading state
    },
    // Add a rehydrate action to ensure auth header is set on redux persist rehydration
    rehydrateAuth: (state) => {
      if (state.token) {
        setupAuthHeader(state.token)
      } else {
        // Try fallback to localStorage
        const token = localStorage.getItem("token")
        if (token) {
          state.token = token
          setupAuthHeader(token)
        }
      }

      // If we have a token but no user, we need to fetch the user data
      if (state.token && !state.user) {
        state.isLoading = true
      }
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
          state.user = action.payload.user
          state.token = action.payload.token
          state.isAuthenticated = true
        } else {
          state.user = null
          state.token = null
          state.isAuthenticated = false
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
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
        state.user = action.payload.user
        state.token = action.payload.token
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

        state.error = payload?.message || "Login failed"
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.rateLimited = false
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
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

        state.error = payload?.message || "Registration failed"
      })
  },
})

export const { logout, clearError, rehydrateAuth } = authSlice.actions
export default authSlice.reducer
