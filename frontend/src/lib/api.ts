import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios"
import { store } from "@/redux/store"
import { clearCache as clearCacheAction } from "@/redux/slices/questionsSlice"

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

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
})

interface CacheEntry {
  data: any
  timestamp: number
  expiresAt: number
}

const responseCache: Record<string, CacheEntry> = {}
const CACHE_DURATION = 60 * 1000
const QUESTIONS_CACHE_DURATION = 30 * 1000
const LEADERBOARD_CACHE_DURATION = 5 * 60 * 1000

const pendingRequests: Record<string, Promise<any>> = {}
const lastRequestTime: Record<string, number> = {}
const MIN_REQUEST_INTERVAL = 1000

export const clearCache = (pattern?: string) => {
  if (pattern) {
    Object.keys(responseCache).forEach((key) => {
      if (key.includes(pattern)) {
        delete responseCache[key]
      }
    })
  } else {
    Object.keys(responseCache).forEach((key) => {
      delete responseCache[key]
    })
  }
}

export const clearQuestionsCache = () => {
  clearCache("/questions")
  clearCache("/answers")
  store.dispatch(clearCacheAction())
}

const getCachedResponse = (config: AxiosRequestConfig) => {
  if (config.skipCache) {
    return null
  }

  const cacheKey = getCacheKey(config)
  const cachedEntry = responseCache[cacheKey]

  if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
    return cachedEntry.data
  }

  return null
}

const cacheResponse = (config: AxiosRequestConfig, data: any) => {
  if (config.method?.toLowerCase() !== "get") {
    return
  }

  const cacheKey = getCacheKey(config)
  const url = config.url || ""

  let cacheDuration = CACHE_DURATION
  if (url.includes("/questions")) {
    cacheDuration = QUESTIONS_CACHE_DURATION
  } else if (url.includes("/leaderboard")) {
    cacheDuration = LEADERBOARD_CACHE_DURATION
  }

  responseCache[cacheKey] = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + cacheDuration,
  }
}

const getCacheKey = (config: AxiosRequestConfig): string => {
  const params = { ...config.params }
  if (params && params._t) {
    delete params._t
  }

  return `${config.method}:${config.url}:${JSON.stringify(params || {})}`
}

interface CustomAxiosError extends AxiosError {
  config: InternalAxiosRequestConfig & { headers?: Record<string, string> }
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const requestId = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`
    config.__requestId = requestId

    if (config.method?.toLowerCase() === "get") {
      const now = Date.now()
      const lastTime = lastRequestTime[requestId] || 0

      if (now - lastTime < MIN_REQUEST_INTERVAL) {
        const cachedData = getCachedResponse(config)
        if (cachedData) {
          const controller = new AbortController()
          config.signal = controller.signal
          controller.abort()

          config.__cached = true
          config.cachedData = cachedData
          return config
        }

        if (typeof pendingRequests[requestId] !== "undefined") {
          const controller = new AbortController()
          config.signal = controller.signal
          controller.abort()
          config.__cached = true

          return config
        }
      }

      lastRequestTime[requestId] = now
    }

    if (config.method?.toLowerCase() === "get" && !config.skipCache) {
      if (
        Object.prototype.hasOwnProperty.call(pendingRequests, config.__requestId) &&
        pendingRequests[config.__requestId] !== undefined
      ) {
        const controller = new AbortController()
        config.signal = controller.signal
        controller.abort()
        config.__cached = true
        return config
      }

      const cachedData = getCachedResponse(config)
      if (cachedData) {
        const controller = new AbortController()
        config.signal = controller.signal
        controller.abort()

        config.__cached = true
        config.cachedData = cachedData
        return config
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config
    const requestId = config.__requestId

    if (requestId && Object.prototype.hasOwnProperty.call(pendingRequests, requestId)) {
      delete pendingRequests[requestId]
    }

    if (
      config.method?.toLowerCase() !== "get" &&
      (config.url?.includes("/questions") || config.url?.includes("/answers"))
    ) {
      clearQuestionsCache()
    }

    if (config.method?.toLowerCase() === "get" && !config.__cached) {
      cacheResponse(config, response.data)
    }

    return response
  },
  async (error: unknown) => {
    const axiosError = error as CustomAxiosError

    if (axiosError.message === "canceled" && axiosError.config?.__cached) {
      if (axiosError.config.cachedData) {
        return Promise.resolve({
          data: axiosError.config.cachedData,
          status: 200,
          statusText: "OK (Cached)",
          headers: {},
          config: axiosError.config,
          request: axiosError.request,
        })
      } else if (
        axiosError.config.__requestId &&
        Object.prototype.hasOwnProperty.call(pendingRequests, axiosError.config.__requestId)
      ) {
        try {
          const data = await pendingRequests[axiosError.config.__requestId]
          return Promise.resolve({
            data,
            status: 200,
            statusText: "OK (Shared)",
            headers: {},
            config: axiosError.config,
            request: axiosError.request,
          })
        } catch (err) {
          return Promise.reject(err)
        }
      }
    }

    if (axiosError.config?.__requestId) {
      delete pendingRequests[axiosError.config.__requestId]
    }

    if (axiosError.response) {
      if (axiosError.response.status === 429) {
        if (axiosError.config.__requestId) {
          const cacheKey = getCacheKey(axiosError.config)
          responseCache[cacheKey] = {
            data: { error: "Rate limited", message: "Too many requests, please try again later." },
            timestamp: Date.now(),
            expiresAt: Date.now() + 30000,
          }
        }
      }

      if (axiosError.response.status === 401) {
        if (window.location.pathname !== "/auth") {
          localStorage.removeItem("token")
          delete api.defaults.headers.common["Authorization"]
          window.location.href = "/auth"
          return Promise.reject(new Error("Session expired. Please login again."))
        }
      }
    }

    return Promise.reject(error)
  },
)

export const hasValidToken = () => {
  const token = localStorage.getItem("token")
  return !!token
}

export default api
