import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios"
import { store } from "@/redux/store"
import { clearCache as clearCacheAction } from "@/redux/slices/questionsSlice"

// Extend AxiosRequestConfig and InternalAxiosRequestConfig to include our custom properties
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

// Import or define the Question type
export interface Question {
  id: string
  questions: Question[]
  content: string
  // Add other properties as needed
}

// Define the QuestionsState interface
export interface QuestionsState {
  // Existing properties of QuestionsState
  questions: Question[]
  // Add other properties here

  // Add the clearCacheFlag property
  clearCacheFlag: boolean
}

// Create an axios instance with base URL
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Add timeout for requests
  timeout: 15000, // Increased timeout
})

// Cache for responses
interface CacheEntry {
  data: any
  timestamp: number
  expiresAt: number
}

const responseCache: Record<string, CacheEntry> = {}
const CACHE_DURATION = 60 * 1000 // 60 seconds for most requests
const QUESTIONS_CACHE_DURATION = 30 * 1000 // 30 seconds for questions
const LEADERBOARD_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes for leaderboard

// In-flight requests tracking
const pendingRequests: Record<string, Promise<any>> = {}

// Request throttling
const lastRequestTime: Record<string, number> = {}
const MIN_REQUEST_INTERVAL = 2000 // 2 seconds between identical requests

// Function to clear cache entries
export const clearCache = (pattern?: string) => {
  if (pattern) {
    // Clear specific cache entries matching the pattern
    Object.keys(responseCache).forEach((key) => {
      if (key.includes(pattern)) {
        delete responseCache[key]
      }
    })
  } else {
    // Clear all cache
    Object.keys(responseCache).forEach((key) => {
      delete responseCache[key]
    })
  }
}

export const clearQuestionsCache = () => {
  // Clear questions cache
  clearCache("/questions")
  // Clear answers cache
  clearCache("/answers")
  // Dispatch Redux action to clear cache
  store.dispatch(clearCacheAction())
}

// Get cached response if available
const getCachedResponse = (config: AxiosRequestConfig) => {
  // Skip cache if explicitly requested
  if (config.skipCache) {
    return null
  }

  // Generate cache key
  const cacheKey = getCacheKey(config)
  const cachedEntry = responseCache[cacheKey]

  // Check if cache is valid
  if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
    return cachedEntry.data
  }

  return null
}

// Cache a response with appropriate duration
const cacheResponse = (config: AxiosRequestConfig, data: any) => {
  // Skip caching for non-GET requests
  if (config.method?.toLowerCase() !== "get") {
    return
  }

  const cacheKey = getCacheKey(config)
  const url = config.url || ""

  // Determine appropriate cache duration based on endpoint
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

// Generate a consistent cache key
const getCacheKey = (config: AxiosRequestConfig): string => {
  // Remove _t parameter for cache key generation
  const params = { ...config.params }
  if (params && params._t) {
    delete params._t
  }

  return `${config.method}:${config.url}:${JSON.stringify(params || {})}`
}

// Interface for our custom error with config
interface CustomAxiosError extends AxiosError {
  config: InternalAxiosRequestConfig & { headers?: Record<string, string> }
}

// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Generate a unique request ID
    const requestId = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`
    config.__requestId = requestId

    // Check if we should throttle this request
    if (config.method?.toLowerCase() === "get") {
      const now = Date.now()
      const lastTime = lastRequestTime[requestId] || 0

      // If this is a duplicate request made too soon, use cache or delay
      if (now - lastTime < MIN_REQUEST_INTERVAL) {
        // Try to use cache first
        const cachedData = getCachedResponse(config)
        if (cachedData) {
          // Create a new AbortController to cancel the actual request
          const controller = new AbortController()
          config.signal = controller.signal
          controller.abort()

          // Store cached data in a way we can retrieve it later
          config.__cached = true
          config.cachedData = cachedData
          return config
        }

        // If no cache, check if there's already a pending request
        if (typeof pendingRequests[requestId] !== "undefined") {
          // Reuse the existing request
          const controller = new AbortController()
          config.signal = controller.signal
          controller.abort()
          config.__cached = true

          // We'll handle this in the response interceptor
          return config
        }
      }

      // Update last request time
      lastRequestTime[requestId] = now
    }

    // Check cache for GET requests
    if (config.method?.toLowerCase() === "get" && !config.skipCache) {
      // Check if there's already a pending request for this exact URL and params
      if (
        Object.prototype.hasOwnProperty.call(pendingRequests, config.__requestId) &&
        pendingRequests[config.__requestId] !== undefined
      ) {
        // Reuse the existing request
        const controller = new AbortController()
        config.signal = controller.signal
        controller.abort()
        config.__cached = true
        return config
      }

      const cachedData = getCachedResponse(config)
      if (cachedData) {
        // Create a new AbortController to cancel the actual request
        const controller = new AbortController()
        config.signal = controller.signal
        controller.abort()

        // Store cached data in a way we can retrieve it later
        config.__cached = true
        config.cachedData = cachedData
        return config
      }
    }

    return config
  },
  (error) => {
    console.error("Request interceptor error:", error)
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config
    const requestId = config.__requestId

    // Clear pending request
    if (requestId && Object.prototype.hasOwnProperty.call(pendingRequests, requestId)) {
      delete pendingRequests[requestId]
    }

    // Clear cache for write operations on questions/answers
    if (
      config.method?.toLowerCase() !== "get" &&
      (config.url?.includes("/questions") || config.url?.includes("/answers"))
    ) {
      clearQuestionsCache()
    }

    // Cache GET responses
    if (config.method?.toLowerCase() === "get" && !config.__cached) {
      cacheResponse(config, response.data)
    }

    return response
  },
  async (error: unknown) => {
    const axiosError = error as CustomAxiosError

    // Handle aborted requests with cached data
    if (axiosError.message === "canceled" && axiosError.config?.__cached) {
      if (axiosError.config.cachedData) {
        // Return cached data
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
        // Wait for the pending request to complete
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

    // Clear pending request on error
    if (axiosError.config?.__requestId) {
      delete pendingRequests[axiosError.config.__requestId]
    }

    console.error("API Error:", axiosError.message || "Unknown error")

    if (axiosError.response) {
      console.error("Response data:", axiosError.response.data)
      console.error("Response status:", axiosError.response.status)

      // Handle rate limiting (429)
      if (axiosError.response.status === 429) {
        // Add the request to cache with error to prevent retries
        if (axiosError.config.__requestId) {
          const cacheKey = getCacheKey(axiosError.config)
          responseCache[cacheKey] = {
            data: { error: "Rate limited", message: "Too many requests, please try again later." },
            timestamp: Date.now(),
            expiresAt: Date.now() + 30000, // 30 seconds
          }
        }
      }

      // Handle 401 Unauthorized errors
      if (axiosError.response.status === 401) {
        // Only clear token and redirect if not on auth page
        if (window.location.pathname !== "/auth") {
          localStorage.removeItem("token")
          delete api.defaults.headers.common["Authorization"]
          window.location.href = "/auth"
          return Promise.reject(new Error("Session expired. Please login again."))
        }
      }
    } else if (axiosError.request) {
      // The request was made but no response was received
      console.error("No response received:", axiosError.request)
    }

    return Promise.reject(error)
  },
)

// Export a function to check if token exists and is valid
export const hasValidToken = () => {
  const token = localStorage.getItem("token")
  return !!token
}

export default api
