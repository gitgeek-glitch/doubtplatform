import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { QuestionsState, Question, Answer } from "../types/questions"
import {
  fetchQuestions,
  fetchQuestionDetails,
  fetchVotes,
  voteAnswer,
  acceptAnswer,
  submitAnswer,
  submitQuestion,
  deleteQuestion,
  deleteAnswer
} from "../thunks/questionsThunks"

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
  answerVotes: {},
  lastFetchTime: 0,
}

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
      state.answerVotes = {}
    },
    clearCache: (state) => {
      state.lastFetchTime = 0
    },
    addNewQuestion: (state, action: PayloadAction<Question>) => {
      const exists = state.questions.some((q) => q._id === action.payload._id)
      if (!exists) {
        state.questions = [action.payload, ...state.questions]
      }
    },
    refreshQuestions: (state) => {
      state.lastFetchTime = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state, action) => {
        if (!(action.meta.arg?.loadMore ?? false)) {
          state.loading = true
          state.error = null
        }
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false
        const { questions, loadMore, lastFetchTime, fromCache, hasMore } = action.payload

        if (!fromCache && lastFetchTime) {
          state.lastFetchTime = lastFetchTime
        }

        if (loadMore) {
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

      .addCase(fetchQuestionDetails.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchQuestionDetails.fulfilled, (state, action) => {
        state.loading = false
        state.currentQuestion = action.payload.question

        if (state.answers.length > 0) {
          const existingAnswerIds = new Set(state.answers.map((a) => a._id))
          const newAnswers = action.payload.answers.filter((a: Answer) => !existingAnswerIds.has(a._id))

          const updatedExistingAnswers = state.answers.map((existingAnswer) => {
            const freshAnswer = action.payload.answers.find((a: Answer) => a._id === existingAnswer._id)
            return freshAnswer || existingAnswer
          })

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

      .addCase(fetchVotes.fulfilled, (state, action) => {
        const votes = action.payload.answerVotes;
        state.answerVotes = {};
        for (const vote of votes) {
          state.answerVotes[vote.answerId] = vote.value;
        }
      })

      .addCase(voteAnswer.fulfilled, (state, action) => {
        const updatedAnswer = action.payload.answer;
        const vote = action.payload.vote;

        const index = state.answers.findIndex((a) => a._id === updatedAnswer._id);
        if (index !== -1) {
          state.answers[index] = {
            ...state.answers[index],
            ...updatedAnswer,
          };
        }

        state.answerVotes = {
          ...state.answerVotes,
          [updatedAnswer._id]: vote?.value ?? 0,
        };
      })

      .addCase(acceptAnswer.fulfilled, (state, action) => {
        const answerId = action.payload
        state.answers = state.answers.map((answer) => ({
          ...answer,
          isAccepted: answer._id === answerId,
        }))

        if (state.currentQuestion) {
          state.currentQuestion.isSolved = true
        }
      })

      .addCase(submitAnswer.fulfilled, (state, action) => {
        const exists = state.answers.some((a) => a._id === action.payload._id)
        if (!exists) {
          state.answers.push(action.payload)

          if (state.currentQuestion) {
            state.currentQuestion.answerCount += 1
          }
        }
      })

      .addCase(submitQuestion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitQuestion.fulfilled, (state, action) => {
        state.loading = false
        state.lastFetchTime = 0

        const exists = state.questions.some((q) => q._id === action.payload._id)
        if (!exists) {
          state.questions = [action.payload, ...state.questions]
        }
      })
      .addCase(submitQuestion.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      .addCase(deleteQuestion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.loading = false
        state.questions = state.questions.filter((question) => question._id !== action.payload)
        if (state.currentQuestion && state.currentQuestion._id === action.payload) {
          state.currentQuestion = null
        }
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      .addCase(deleteAnswer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteAnswer.fulfilled, (state, action) => {
        state.loading = false
        state.answers = state.answers.filter((answer) => answer._id !== action.payload)
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