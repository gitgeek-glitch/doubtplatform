import { createAsyncThunk } from "@reduxjs/toolkit"
import { api } from "@/lib/api"
import { LeaderboardState } from "../types/leaderboardTypes"

const CACHE_DURATION = 5 * 60 * 1000

export const fetchLeaderboard = createAsyncThunk(
  "leaderboard/fetchLeaderboard",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { leaderboard: LeaderboardState }
      const now = Date.now()

      if (
        state.leaderboard.lastFetched &&
        now - state.leaderboard.lastFetched < CACHE_DURATION &&
        state.leaderboard.users.length > 0
      ) {
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