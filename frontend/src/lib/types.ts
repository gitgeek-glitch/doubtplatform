declare module "axios" {
  export interface AxiosRequestConfig {
    skipCache?: boolean
    __cached?: boolean
    __isRetryRequest?: boolean
    cachedData?: any
    __requestId?: string
  }

  export interface InternalAxiosRequestConfig extends AxiosRequestConfig {
    cachedData?: any
    __requestId?: string
  }
}

export interface Question {
  id: string
  questions: Question[]
  content: string
}

export interface QuestionsState {
  questions: Question[]
  clearCacheFlag: boolean
}

export interface CacheEntry {
  data: any
  timestamp: number
  expiresAt: number
}