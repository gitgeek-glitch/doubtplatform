export interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  reputation: number
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  rateLimited: boolean
  rateLimitRetryAfter: number
}