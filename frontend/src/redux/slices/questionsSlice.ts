import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../store" // Add this import
import { api } from "@/lib/api"

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
  isSolved?: boolean // Add this property to indicate if the question is solved
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
  lastFetchTime: number // Add this to track when questions were last fetched
}

interface FetchQuestionsParams {
  page?: number
  filter?: string
  category?: string
  search?: string
  tag?: string
  loadMore?: boolean
  forceRefresh?: boolean
}

// Update the FetchQuestionsReturn interface
interface FetchQuestionsReturn {
  questions: Question[]
  loadMore: boolean
  hasMore: boolean
  lastFetchTime: number
  fromCache?: boolean
}

const initialState: QuestionsState = {
  questions: [],
  currentQuestion: null,
  answers: [],
  relatedQuestions: [],
  loading: false,
  error: null,
  hasMore: true,
  filter: "latest",
  category: "all",
  page: 1,
  questionVote: 0,
  answerVotes: {},
  lastFetchTime: 0, // Initialize to 0
}

// Async thunks
// Update the fetchQuestions thunk with proper RootState type
export const fetchQuestions = createAsyncThunk<
  FetchQuestionsReturn,
  FetchQuestionsParams | undefined,
  {
    state: RootState
  }
>("questions/fetchQuestions", async (params: FetchQuestionsParams = {}, { rejectWithValue, getState }) => {
  try {
    const state = getState()
    const now = Date.now()
    const timeSinceLastFetch = now - state.questions.lastFetchTime

    const {
      page = 1,
      filter = "latest",
      category = "all",
      search = "",
      tag = "",
      loadMore = false,
      forceRefresh = page === 1,
    } = params

    // Extend cache duration to 30 seconds
    if (!forceRefresh && !loadMore && timeSinceLastFetch < 30000) {
      return {
        questions: state.questions.questions,
        loadMore: false,
        hasMore: state.questions.hasMore,
        lastFetchTime: state.questions.lastFetchTime,
        fromCache: true,
      }
    }

    const queryParams = new URLSearchParams({
      page: String(page),
      limit: "10",
      sort: filter,
      ...(category !== "all" && { category }),
      ...(search && { search }),
      ...(tag && { tag }),
    })

    const response = await api.get(`/questions?${queryParams}`)
    return {
      questions: response.data.questions || [],
      loadMore,
      hasMore: response.data.hasMore,
      lastFetchTime: now,
      fromCache: false,
    }
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch questions")
  }
})

export const fetchQuestionDetails = createAsyncThunk(
  "questions/fetchQuestionDetails",
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
      return rejectWithValue(error.response?.data?.message || "Failed to fetch question details")
    }
  },
)

export const fetchVotes = createAsyncThunk("questions/fetchVotes", async (questionId: string, { rejectWithValue }) => {
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
    return rejectWithValue(error.response?.data?.message || "Failed to fetch votes")
  }
})

export const voteQuestion = createAsyncThunk(
  "questions/voteQuestion",
  async ({ questionId, value }: { questionId: string; value: number }, { rejectWithValue }) => {
    try {
      await api.post(`/questions/${questionId}/vote`, { value })
      return { value }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to vote on question")
    }
  },
)

export const voteAnswer = createAsyncThunk(
  "questions/voteAnswer",
  async ({ answerId, value }: { answerId: string; value: number }, { rejectWithValue }) => {
    try {
      await api.post(`/answers/${answerId}/vote`, { value })
      return { answerId, value }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to vote on answer")
    }
  },
)

export const acceptAnswer = createAsyncThunk(
  "questions/acceptAnswer",
  async (answerId: string, { rejectWithValue }) => {
    try {
      await api.post(`/answers/${answerId}/accept`)
      return answerId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to accept answer")
    }
  },
)

export const submitAnswer = createAsyncThunk(
  "questions/submitAnswer",
  async ({ questionId, content }: { questionId: string; content: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post(`/questions/${questionId}/answers`, { content })

      // Force refresh the question details to get the updated answer count and all answers
      await dispatch(fetchQuestionDetails(questionId))

      // Force refresh votes for the new answer
      await dispatch(fetchVotes(questionId))

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to submit answer")
    }
  },
)

// Update the submitQuestion thunk
export const submitQuestion = createAsyncThunk(
  "questions/submitQuestion",
  async (
    { title, content, category, tags }: { title: string; content: string; category: string; tags: string[] },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const response = await api.post(`/questions`, {
        title,
        content,
        category,
        tags,
      })

      // Immediately add the new question to the state
      dispatch(addNewQuestion(response.data))

      // Force refresh questions list with proper typing
      await dispatch(
        fetchQuestions({
          forceRefresh: true,
          filter: "latest",
        }) as any,
      ) // Type assertion needed due to dispatch typing limitations

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to post question")
    }
  },
)

// Add these new thunks after the submitQuestion thunk

// Delete a question
export const deleteQuestion = createAsyncThunk(
  "questions/deleteQuestion",
  async (questionId: string, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/questions/${questionId}`)

      // Force refresh questions list to update UI
      dispatch(clearCache())

      return questionId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete question")
    }
  },
)

// Delete an answer
export const deleteAnswer = createAsyncThunk(
  "questions/deleteAnswer",
  async (answerId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/answers/${answerId}`)
      return answerId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete answer")
    }
  },
)

const questionsSlice = createSlice({
  name: "questions",
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
    clearCache: (state) => {
      // Reset the lastFetchTime to force a refresh on next fetch
      state.lastFetchTime = 0
    },
    addNewQuestion: (state, action: PayloadAction<Question>) => {
      // Check if the question already exists to avoid duplicates
      const exists = state.questions.some((q) => q._id === action.payload._id)
      if (!exists) {
        // Add the new question to the beginning of the questions array
        state.questions = [action.payload, ...state.questions]
      }
    },
    refreshQuestions: (state) => {
      // Reset the lastFetchTime to force a refresh on next fetch
      state.lastFetchTime = 0
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch questions
      .addCase(fetchQuestions.pending, (state, action) => {
        if (!(action.meta.arg?.loadMore ?? false)) {
          state.loading = true
          state.error = null
        }
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false
        const { questions, loadMore, lastFetchTime, fromCache, hasMore } = action.payload

        // Update lastFetchTime if this wasn't from cache
        if (!fromCache && lastFetchTime) {
          state.lastFetchTime = lastFetchTime
        }

        if (loadMore) {
          // Filter out duplicates when loading more
          const newQuestions = questions.filter(
            (newQ: Question) => !state.questions.some((existingQ) => existingQ._id === newQ._id),
          )
          state.questions = [...state.questions, ...newQuestions]
          state.page += 1
        } else {
          state.questions = questions
          state.page = 1
        }

        state.hasMore = hasMore
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        if (!(action.meta.arg?.loadMore ?? false)) {
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

        // Ensure we don't lose existing answers while updating
        if (state.answers.length > 0) {
          // Merge existing answers with new ones, avoiding duplicates
          const existingAnswerIds = new Set(state.answers.map((a) => a._id))
          const newAnswers = action.payload.answers.filter((a: Answer) => !existingAnswerIds.has(a._id))

          // Update existing answers with fresh data
          const updatedExistingAnswers = state.answers.map((existingAnswer) => {
            const freshAnswer = action.payload.answers.find((a: Answer) => a._id === existingAnswer._id)
            return freshAnswer || existingAnswer
          })

          // Combine updated existing answers with new answers
          state.answers = [...updatedExistingAnswers, ...newAnswers]
        } else {
          state.answers = action.payload.answers
        }

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

        // Update the question's isSolved status
        if (state.currentQuestion) {
          state.currentQuestion.isSolved = true
        }
      })

      // Submit answer
      .addCase(submitAnswer.fulfilled, (state, action) => {
        // Check if the answer already exists to avoid duplicates
        const exists = state.answers.some((a) => a._id === action.payload._id)
        if (!exists) {
          state.answers.push(action.payload)

          // Update the answer count on the current question
          if (state.currentQuestion) {
            state.currentQuestion.answerCount += 1
          }
        }
      })

      // Submit question
      .addCase(submitQuestion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitQuestion.fulfilled, (state, action) => {
        state.loading = false
        state.lastFetchTime = 0 // Reset last fetch time to force refresh

        // Add the new question to the beginning of the list
        const exists = state.questions.some((q) => q._id === action.payload._id)
        if (!exists) {
          state.questions = [action.payload, ...state.questions]
        }
      })
      .addCase(submitQuestion.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Delete question
      .addCase(deleteQuestion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.loading = false
        // Remove the deleted question from the questions array
        state.questions = state.questions.filter((question) => question._id !== action.payload)
        // If the current question is the deleted one, reset it
        if (state.currentQuestion && state.currentQuestion._id === action.payload) {
          state.currentQuestion = null
        }
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Delete answer
      .addCase(deleteAnswer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteAnswer.fulfilled, (state, action) => {
        state.loading = false
        // Remove the deleted answer from the answers array
        state.answers = state.answers.filter((answer) => answer._id !== action.payload)
        // If the current question exists, decrement its answer count
        if (state.currentQuestion) {
          state.currentQuestion.answerCount = Math.max(0, state.currentQuestion.answerCount - 1)
        }
      })
      .addCase(deleteAnswer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { setFilter, setCategory, resetQuestionState, clearCache, addNewQuestion, refreshQuestions } =
  questionsSlice.actions
export default questionsSlice.reducer
