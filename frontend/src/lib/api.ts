import axios from "axios"

// Create an axios instance with base URL
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Add timeout for requests
  timeout: 10000,
})

// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
  (response) => {
    return response
  },
  (error) => {
    console.error("API Error:", error.message)
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error("Response data:", error.response.data)
      console.error("Response status:", error.response.status)
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request)
    }
    
    if (error.response?.status === 401) {
      // Clear token if unauthorized
      localStorage.removeItem("token")
      
      // Remove auth header
      delete api.defaults.headers.common["Authorization"]
      
      // Redirect to login page if not already there
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth"
      }
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