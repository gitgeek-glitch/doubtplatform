import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState } from "../store"
import { api } from "@/lib/api"
import { addNewQuestion, clearCache } from "../slices/questionsSlice"
import type { FetchQuestionsParams, FetchQuestionsReturn } from "../types/questions"

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
      unanswered = false,
    } = params

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
      ...(unanswered && { unanswered: "true" }),
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
      answerVotes: response.data.answerVotes.reduce((acc: Record<string, number>, vote: any) => {
        acc[vote.answerId] = vote.value
        return acc
      }, {}),
    }
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch votes")
  }
})

export const voteAnswer = createAsyncThunk(
  "questions/voteAnswer",
  async ({ answerId, value }: { answerId: string; value: number }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/answers/${answerId}/vote`, { value })
      return {
        answerId,
        vote: response.data.vote ? response.data.vote.value : value,
        answer: response.data.answer,
      }
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to vote",
        status: err.response?.status,
        code: err.response?.status
      })
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
      await dispatch(fetchQuestionDetails(questionId))
      await dispatch(fetchVotes(questionId))
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to submit answer")
    }
  },
)

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

      dispatch(addNewQuestion(response.data))
      await dispatch(
        fetchQuestions({
          forceRefresh: true,
          filter: "latest",
        }) as any,
      )

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to post question")
    }
  },
)

export const deleteQuestion = createAsyncThunk(
  "questions/deleteQuestion",
  async (questionId: string, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/questions/${questionId}`)
      dispatch(clearCache())
      return questionId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete question")
    }
  },
)

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