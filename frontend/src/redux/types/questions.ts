export interface Author {
  _id: string
  name: string
  avatar?: string
  reputation: number
}

export interface Question {
  _id: string
  title: string
  content: string
  tags: string[]
  answerCount: number
  viewCount?: number
  author: Author
  createdAt: string
  isSolved?: boolean
}

export interface Answer {
  _id: string
  content: string
  upvotedBy: string[]
  downvotedBy: string[]
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

export interface QuestionsState {
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
  answerVotes: Record<string, number>
  lastFetchTime: number
}

export interface FetchQuestionsParams {
  page?: number
  filter?: string
  category?: string
  search?: string
  tag?: string
  loadMore?: boolean
  forceRefresh?: boolean
  unanswered?: boolean
}

export interface FetchQuestionsReturn {
  questions: Question[]
  loadMore: boolean
  hasMore: boolean
  lastFetchTime: number
  fromCache?: boolean
}