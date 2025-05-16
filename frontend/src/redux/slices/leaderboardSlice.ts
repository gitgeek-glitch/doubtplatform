import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { api } from "@/lib/api"

interface LeaderboardUser {
  _id: string
  name: string
  avatar?: string
  upvotesReceived: number
  downvotesReceived: number
  reputation: number
  role: string
}

interface LeaderboardState {
  users: LeaderboardUser[]
  loading: boolean
  error: string | null
  totalUpvotes: number
  totalDownvotes: number
  lastFetched: number | null
}

const initialState: LeaderboardState = {
  users: [],
  loading: false,
  error: null,
  totalUpvotes: 0,
  totalDownvotes: 0,
  lastFetched: null,
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// Fetch leaderboard data - now focused on answer upvotes only
export const fetchLeaderboard = createAsyncThunk(
  "leaderboard/fetchLeaderboard",
  async (_, { rejectWithValue, getState }) => {
    try {
      // Check if we have cached data that's still fresh
      const state = getState() as { leaderboard: LeaderboardState }
      const now = Date.now()

      if (
        state.leaderboard.lastFetched &&
        now - state.leaderboard.lastFetched < CACHE_DURATION &&
        state.leaderboard.users.length > 0
      ) {
        // Return a resolved promise with the current data to avoid a new request
        return {
          users: state.leaderboard.users,
          totalUpvotes: state.leaderboard.totalUpvotes,
          totalDownvotes: state.leaderboard.totalDownvotes,
          fromCache: true,
        }
      }

      const response = await api.get("/users/leaderboard")
      return {
        ...response.data,
        fromCache: false,
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch leaderboard data")
    }
  },
)

// Fetch user votes distribution
export const fetchUserVotesDistribution = createAsyncThunk(
  "leaderboard/fetchUserVotesDistribution",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}/votes-distribution`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch user votes distribution")
    }
  }
)

const leaderboardSlice = createSlice({
  name: "leaderboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false

        // Only update state if data is not from cache
        if (!action.payload.fromCache) {
          state.users = action.payload.users
          state.totalUpvotes = action.payload.totalUpvotes
          state.totalDownvotes = action.payload.totalDownvotes
          state.lastFetched = Date.now()
        }
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export default leaderboardSlice.reducer