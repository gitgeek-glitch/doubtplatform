import { createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '@/lib/api'

export const fetchUserProfile = createAsyncThunk(
  'users/fetchUserProfile',
  async (userId: string, { rejectWithValue, dispatch }) => {
    try {
      const [userRes, questionsRes, answersRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/users/${userId}/questions`),
        api.get(`/users/${userId}/answers`)
      ])

      dispatch(fetchUserVotesDistribution(userId))

      return {
        user: userRes.data,
        questions: questionsRes.data,
        answers: answersRes.data
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile')
    }
  }
)

export const fetchUserVotesDistribution = createAsyncThunk(
  'users/fetchUserVotesDistribution',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}/votes-distribution`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user votes')
    }
  }
)