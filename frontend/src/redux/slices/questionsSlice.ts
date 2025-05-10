import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '@/lib/api'

interface Author {
  _id: string
  name: string
  avatar?: string
  reputation: number
}

interface Question {
  _id: string
  title: string
  content: string
  tags: string[]
  upvotes: number
  downvotes: number
  answerCount: number
  viewCount?: number
  author: Author
  createdAt: string
}

interface Answer {
  _id: string
  content: string
  upvotes: number
  downvotes: number
  author: Author
  isAccepted: boolean
  createdAt: string
  question?: {
    _id: string
    title: string
  }
}

interface QuestionsState {
  questions: Question[]
  currentQuestion: Question | null
  answers: Answer[]
  relatedQuestions: Question[]
  loading: boolean
  error: string | null
  hasMore: boolean
  filter: string
  category: string
  page: number
  questionVote: number
  answerVotes: Record<string, number>
}

const initialState: QuestionsState = {
  questions: [],
  currentQuestion: null,
  answers: [],
  relatedQuestions: [],
  loading: false,
  error: null,
  hasMore: true,
  filter: 'latest',
  category: 'all',
  page: 1,
  questionVote: 0,
  answerVotes: {},
}

// Async thunks
export const fetchQuestions = createAsyncThunk(
  'questions/fetchQuestions',
  async (
    {
      page = 1,
      filter = 'latest',
      category = 'all',
      search = '',
      tag = '',
      loadMore = false,
    }: {
      page?: number
      filter?: string
      category?: string
      search?: string
      tag?: string
      loadMore?: boolean
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        sort: filter,
        ...(category !== 'all' && { category }),
        ...(search && { search }),
        ...(tag && { tag }),
      })

      const response = await api.get(`/questions?${params}`)
      return {
        questions: response.data.questions || [],
        loadMore,
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch questions')
    }
  }
)

export const fetchQuestionDetails = createAsyncThunk(
  'questions/fetchQuestionDetails',
  async (id: string, { rejectWithValue }) => {
    try {
      const [questionRes, answersRes, relatedRes] = await Promise.all([
        api.get(`/questions/${id}`),
        api.get(`/questions/${id}/answers`),
        api.get(`/questions/${id}/related`),
      ])

      return {
        question: questionRes.data,
        answers: answersRes.data,
        relatedQuestions: relatedRes.data,
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch question details')
    }
  }
)

export const fetchVotes = createAsyncThunk(
  'questions/fetchVotes',
  async (questionId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/questions/${questionId}/votes`)
      return {
        questionVote: response.data.questionVote || 0,
        answerVotes: response.data.answerVotes.reduce((acc: Record<string, number>, vote: any) => {
          acc[vote.answerId] = vote.value
          return acc
        }, {}),
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch votes')
    }
  }
)

export const voteQuestion = createAsyncThunk(
  'questions/voteQuestion',
  async (
    { questionId, value }: { questionId: string; value: number },
    { rejectWithValue }
  ) => {
    try {
      await api.post(`/questions/${questionId}/vote`, { value })
      return { value }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to vote on question')
    }
  }
)

export const voteAnswer = createAsyncThunk(
  'questions/voteAnswer',
  async (
    { answerId, value }: { answerId: string; value: number },
    { rejectWithValue }
  ) => {
    try {
      await api.post(`/answers/${answerId}/vote`, { value })
      return { answerId, value }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to vote on answer')
    }
  }
)

export const acceptAnswer = createAsyncThunk(
  'questions/acceptAnswer',
  async (answerId: string, { rejectWithValue }) => {
    try {
      await api.post(`/answers/${answerId}/accept`)
      return answerId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept answer')
    }
  }
)

export const submitAnswer = createAsyncThunk(
  'questions/submitAnswer',
  async (
    { questionId, content }: { questionId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(`/questions/${questionId}/answers`, { content })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit answer')
    }
  }
)

export const submitQuestion = createAsyncThunk(
  'questions/submitQuestion',
  async (
    {
      title,
      content,
      category,
      tags,
    }: { title: string; content: string; category: string; tags: string[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(`${import.meta.env.VITE_API_URL}/questions`, {
        title,
        content,
        category,
        tags,
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to post question')
    }
  }
)

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<string>) => {
      state.filter = action.payload
      state.page = 1
    },
    setCategory: (state, action: PayloadAction<string>) => {
      state.category = action.payload
      state.page = 1
    },
    resetQuestionState: (state) => {
      state.currentQuestion = null
      state.answers = []
      state.relatedQuestions = []
      state.questionVote = 0
      state.answerVotes = {}
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch questions
      .addCase(fetchQuestions.pending, (state) => {
        if (!state.loading) {
          state.loading = true
          state.error = null
        }
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false
        const { questions, loadMore } = action.payload
        
        if (loadMore) {
          state.questions = [...state.questions, ...questions]
          state.page += 1
        } else {
          state.questions = questions
          state.page = 1
        }
        
        state.hasMore = questions.length === 10
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        if (!action.meta.arg.loadMore) {
          state.questions = []
        }
        state.hasMore = false
      })
      
      // Fetch question details
      .addCase(fetchQuestionDetails.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchQuestionDetails.fulfilled, (state, action) => {
        state.loading = false
        state.currentQuestion = action.payload.question
        state.answers = action.payload.answers
        state.relatedQuestions = action.payload.relatedQuestions
      })
      .addCase(fetchQuestionDetails.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      
      // Fetch votes
      .addCase(fetchVotes.fulfilled, (state, action) => {
        state.questionVote = action.payload.questionVote
        state.answerVotes = action.payload.answerVotes
      })
      
      // Vote on question
      .addCase(voteQuestion.fulfilled, (state, action) => {
        const { value } = action.payload
        const question = state.currentQuestion
        
        if (question) {
          // Remove previous vote if any
          if (state.questionVote === 1) question.upvotes--
          if (state.questionVote === -1) question.downvotes--
          
          // Add new vote if not removing
          if (value === 1) question.upvotes++
          if (value === -1) question.downvotes++
          
          state.questionVote = value
        }
      })
      
      // Vote on answer
      .addCase(voteAnswer.fulfilled, (state, action) => {
        const { answerId, value } = action.payload
        const currentVote = state.answerVotes[answerId] || 0
        
        state.answers = state.answers.map((answer) => {
          if (answer._id === answerId) {
            const updatedAnswer = { ...answer }
            
            // Remove previous vote if any
            if (currentVote === 1) updatedAnswer.upvotes--
            if (currentVote === -1) updatedAnswer.downvotes--
            
            // Add new vote if not removing
            if (value === 1) updatedAnswer.upvotes++
            if (value === -1) updatedAnswer.downvotes++
            
            return updatedAnswer
          }
          return answer
        })
        
        state.answerVotes = {
          ...state.answerVotes,
          [answerId]: value,
        }
      })
      
      // Accept answer
      .addCase(acceptAnswer.fulfilled, (state, action) => {
        const answerId = action.payload
        state.answers = state.answers.map((answer) => ({
          ...answer,
          isAccepted: answer._id === answerId,
        }))
      })
      
      // Submit answer
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.answers.push(action.payload)
      })
      
      // Submit question
      .addCase(submitQuestion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitQuestion.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(submitQuestion.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { setFilter, setCategory, resetQuestionState } = questionsSlice.actions
export default questionsSlice.reducer