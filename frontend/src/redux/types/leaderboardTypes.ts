export interface LeaderboardUser {
  _id: string
  name: string
  avatar?: string
  upvotesReceived: number
  downvotesReceived: number
  reputation: number
  role: string
}

export interface LeaderboardState {
  users: LeaderboardUser[]
  loading: boolean
  error: string | null
  totalUpvotes: number
  totalDownvotes: number
  lastFetched: number | null
}