import { InternalAxiosRequestConfig } from "axios"
import { getCachedResponse } from "./cacheManager"

export const pendingRequests: Record<string, Promise<any>> = {}
export const lastRequestTime: Record<string, number> = {}
export const MIN_REQUEST_INTERVAL = 1000

export const requestInterceptor = async (config: InternalAxiosRequestConfig) => {
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
}