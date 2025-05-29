import { createSlice } from '@reduxjs/toolkit'
import { UsersState } from '../types/usersTypes'
import { fetchUserProfile, fetchUserVotesDistribution } from '../thunks/usersThunks'

const initialState: UsersState = {
  currentProfile: null,
  userQuestions: [],
  userAnswers: [],
  userVotesDistribution: null,
  loading: false,
  votesLoading: false,
  error: null
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    resetUserState: (state) => {
      state.currentProfile = null
      state.userQuestions = []
      state.userAnswers = []
      state.userVotesDistribution = null
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.currentProfile = action.payload.user
        state.userQuestions = action.payload.questions
        state.userAnswers = action.payload.answers
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchUserVotesDistribution.pending, (state) => {
        state.votesLoading = true
      })
      .addCase(fetchUserVotesDistribution.fulfilled, (state, action) => {
        state.votesLoading = false
        state.userVotesDistribution = action.payload
      })
      .addCase(fetchUserVotesDistribution.rejected, (state) => {
        state.votesLoading = false
      })
  }
})

export const { resetUserState } = usersSlice.actions
export default usersSlice.reducer