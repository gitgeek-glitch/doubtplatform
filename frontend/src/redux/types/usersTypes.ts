export interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  reputation: number
  questionsCount: number
  answersCount: number
  badges: string[]
  role: string
  answerUpvotesReceived: number
  answerDownvotesReceived: number
  createdAt: string
}

export interface Question {
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
    role: string
  }
}

export interface Answer {
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
    role: string
  }
  question: {
    _id: string
    title: string
  }
}

export interface UserVotesDistribution {
  answerUpvotes: number
  answerDownvotes: number
}

export interface UsersState {
  currentProfile: User | null
  userQuestions: Question[]
  userAnswers: Answer[]
  userVotesDistribution: UserVotesDistribution | null
  loading: boolean
  votesLoading: boolean
  error: string | null
}