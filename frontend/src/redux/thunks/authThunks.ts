import { createAsyncThunk } from "@reduxjs/toolkit"
import { api } from "@/lib/api"
import { AuthState } from "../types/authTypes"

const setupAuthHeader = (token: string) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
  }
}

export const checkAuthStatus = createAsyncThunk("auth/checkStatus", async (_, { rejectWithValue, getState }) => {
  try {
    const state = getState() as { auth: AuthState }
    let token = state.auth.token

    if (!token) {
      token = localStorage.getItem("token")
    }

    if (!token) {
      return rejectWithValue("No token found")
    }

    setupAuthHeader(token)

    const response = await api.get("/auth/me")
    return { user: response.data.user, token }
  } catch (error) {
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

      localStorage.setItem("token", token)
      setupAuthHeader(token)

      return { user: response.data.user, token }
    } catch (error: any) {
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

      localStorage.setItem("token", token)
      setupAuthHeader(token)

      return { user: response.data.user, token }
    } catch (error: any) {
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

export { setupAuthHeader }