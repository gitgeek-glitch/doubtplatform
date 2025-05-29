import { createSlice } from "@reduxjs/toolkit"
import { LeaderboardState } from "../types/leaderboardTypes"
import { fetchLeaderboard } from "../thunks/leaderboardThunks"

const initialState: LeaderboardState = {
  users: [],
  loading: false,
  error: null,
  totalUpvotes: 0,
  totalDownvotes: 0,
  lastFetched: null,
}

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