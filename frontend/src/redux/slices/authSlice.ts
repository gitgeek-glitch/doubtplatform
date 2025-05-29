import { createSlice } from "@reduxjs/toolkit"
import { api } from "@/lib/api"
import { AuthState } from "../types/authTypes"
import { checkAuthStatus, loginUser, registerUser, setupAuthHeader } from "../thunks/authThunks"

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  rateLimited: false,
  rateLimitRetryAfter: 0,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token")
      delete api.defaults.headers.common["Authorization"]
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
      state.isLoading = false
    },
    rehydrateAuth: (state) => {
      if (state.token) {
        setupAuthHeader(state.token)
      } else {
        const token = localStorage.getItem("token")
        if (token) {
          state.token = token
          setupAuthHeader(token)
        }
      }

      if (state.token && !state.user) {
        state.isLoading = true
      }
    },
  },
  extraReducers: (builder) => {
    builder
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