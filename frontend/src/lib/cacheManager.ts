import { AxiosRequestConfig } from "axios"
import { CacheEntry } from "./types"
import { store } from "@/redux/store"
import { clearCache as clearCacheAction } from "@/redux/slices/questionsSlice"

export const responseCache: Record<string, CacheEntry> = {}
export const CACHE_DURATION = 60 * 1000
export const QUESTIONS_CACHE_DURATION = 30 * 1000
export const LEADERBOARD_CACHE_DURATION = 5 * 60 * 1000

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

export const getCachedResponse = (config: AxiosRequestConfig) => {
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

export const cacheResponse = (config: AxiosRequestConfig, data: any) => {
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

export const getCacheKey = (config: AxiosRequestConfig): string => {
  const params = { ...config.params }
  if (params && params._t) {
    delete params._t
  }

  return `${config.method}:${config.url}:${JSON.stringify(params || {})}`
}