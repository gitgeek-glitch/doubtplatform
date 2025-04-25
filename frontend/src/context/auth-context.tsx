"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  reputation: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        
        if (token) {
          // Set default auth header
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`
          
          // Verify token and get user data
          const response = await api.get("/auth/me")
          setUser(response.data)
        }
      } catch (error) {
        // Clear invalid token
        localStorage.removeItem("token")
        delete api.defaults.headers.common["Authorization"]
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password })
      
      // Save token to localStorage
      localStorage.setItem("token", response.data.token)
      
      // Set default auth header
      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`
      
      // Set user data
      setUser(response.data.user)
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${response.data.user.name}!`,
      })
      
      // Redirect to home page
      navigate("/home")
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid email or password",
        variant: "destructive",
      })
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post("/auth/register", { name, email, password })
      
      // Save token to localStorage
      localStorage.setItem("token", response.data.token)
      
      // Set default auth header
      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`
      
      // Set user data
      setUser(response.data.user)
      
      toast({
        title: "Registration successful",
        description: `Welcome to DoubtSolve, ${response.data.user.name}!`,
      })
      
      // Redirect to home page
      navigate("/home")
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Could not create account",
        variant: "destructive",
      })
      throw error
    }
  }

  const logout = () => {
    // Clear token from localStorage
    localStorage.removeItem("token")
    
    // Remove auth header
    delete api.defaults.headers.common["Authorization"]
    
    // Clear user data
    setUser(null)
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
    
    // Redirect to landing page
    navigate("/")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
