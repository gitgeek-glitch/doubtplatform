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
  }

  export interface InternalAxiosRequestConfig extends AxiosRequestConfig {
    cachedData?: any
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
  timeout: 10000,
})

// Cache for responses
interface CacheEntry {
  data: any
  timestamp: number
}

const responseCache: Record<string, CacheEntry> = {}
const CACHE_DURATION = 5 * 1000 // 5 seconds for more frequent updates

// Function to clear cache entries
export const clearCache = (pattern?: string) => {
  if (pattern) {
    // Clear specific cache entries matching the pattern
    Object.keys(responseCache).forEach((key) => {
      if (key.includes(pattern)) {
        console.log(`Clearing cache for: ${key}`)
        delete responseCache[key]
      }
    })
  } else {
    // Clear all cache
    console.log("Clearing entire cache")
    Object.keys(responseCache).forEach((key) => {
      delete responseCache[key]
    })
  }
}

export const clearQuestionsCache = () => {
  // Clear questions cache
  clearCache('/questions')
  // Clear answers cache
  clearCache('/answers')
  // Dispatch Redux action to clear cache
  store.dispatch(clearCacheAction())
}

// Get cached response if available
const getCachedResponse = (config: AxiosRequestConfig) => {
  // Don't use cache if there's a _t parameter (cache busting)
  if (config.params && config.params._t) {
    return null
  }

  const cacheKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`
  const cachedEntry = responseCache[cacheKey]

  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION) {
    return cachedEntry.data
  }

  return null
}

// Cache a response
const cacheResponse = (config: AxiosRequestConfig, data: any) => {
  // Don't cache if there's a _t parameter or if it's a questions/answers endpoint
  if (
    (config.params && config.params._t) ||
    (config.url && (config.url.includes('/questions') || config.url.includes('/answers')))
  ) {
    return
  }

  const cacheKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`
  responseCache[cacheKey] = {
    data,
    timestamp: Date.now(),
  }
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

    // Check cache for GET requests
    if (config.method?.toLowerCase() === "get" && !config.skipCache) {
      const cachedData = getCachedResponse(config)
      if (cachedData) {
        // Create a new AbortController to cancel the actual request
        const controller = new AbortController()
        config.signal = controller.signal
        controller.abort()

        // Store cached data in a way we can retrieve it later
        // @ts-ignore - We need this for our caching mechanism
        config.__cached = true
        // @ts-ignore - We need this for our caching mechanism
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
    // Clear cache for write operations on questions/answers
    if (
      response.config.method?.toLowerCase() !== 'get' &&
      (response.config.url?.includes('/questions')|| response.config.url?.includes('/answers'))
    ) {
      clearQuestionsCache()
    }

    // Cache only non-questions/answers GET responses
    if (response.config.method?.toLowerCase() === 'get' && !response.config.__cached) {
      cacheResponse(response.config, response.data)
    }

    return response
  },
  async (error: unknown) => {
    const axiosError = error as CustomAxiosError
    console.error("API Error:", axiosError.message || "Unknown error")

    if (axiosError.response) {
      console.error("Response data:", axiosError.response.data)
      console.error("Response status:", axiosError.response.status)

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