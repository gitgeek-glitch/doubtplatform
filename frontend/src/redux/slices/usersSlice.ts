import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '@/lib/api'

// Define types
interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  reputation: number
  questionsCount: number
  answersCount: number
  badges: string[]
  createdAt: string
}

interface Question {
  _id: string
  title: string
  content: string
  tags: string[]
  upvotes: number
  downvotes: number
  answers: any[]
  hasAcceptedAnswer: boolean
  createdAt: string
  author: {
    _id: string
    name: string
    avatar?: string
  }
}

interface Answer {
  _id: string
  content: string
  upvotes: number
  downvotes: number
  isAccepted: boolean
  createdAt: string
  author: {
    _id: string
    name: string
    avatar?: string
  }
  question: {
    _id: string
    title: string
  }
}

interface UsersState {
  currentProfile: User | null
  userQuestions: Question[]
  userAnswers: Answer[]
  loading: boolean
  error: string | null
}

const initialState: UsersState = {
  currentProfile: null,
  userQuestions: [],
  userAnswers: [],
  loading: false,
  error: null
}

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'users/fetchUserProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const [userRes, questionsRes, answersRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/users/${userId}/questions`),
        api.get(`/users/${userId}/answers`)
      ])

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

// Create the slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    resetUserState: (state) => {
      state.currentProfile = null
      state.userQuestions = []
      state.userAnswers = []
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user profile
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
  }
})

export const { resetUserState } = usersSlice.actions
export default usersSlice.reducer