import axios from "axios"
import { requestInterceptor } from "./requestInterceptor"
import { responseInterceptor, errorInterceptor } from "./responseInterceptor"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
})

api.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error))
api.interceptors.response.use(responseInterceptor, errorInterceptor)

export const hasValidToken = () => {
  const token = localStorage.getItem("token")
  return !!token
}

export { clearCache, clearQuestionsCache } from "./cacheManager"
export default api