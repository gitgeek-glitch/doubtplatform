import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { pendingRequests } from "./requestInterceptor"
import { clearQuestionsCache, cacheResponse, getCacheKey, responseCache } from "./cacheManager"

interface CustomAxiosError extends AxiosError {
  config: InternalAxiosRequestConfig & { headers?: Record<string, string> }
}

export const responseInterceptor = (response: AxiosResponse) => {
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
}

export const errorInterceptor = async (error: unknown) => {
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
        window.location.href = "/auth"
        return Promise.reject(new Error("Session expired. Please login again."))
      }
    }
  }

  return Promise.reject(error)
}