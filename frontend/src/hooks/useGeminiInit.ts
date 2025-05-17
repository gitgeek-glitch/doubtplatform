"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function useGeminiInit() {
  const [initialized, setInitialized] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if API key exists in localStorage
    if (typeof window !== "undefined") {
      const apiKey = localStorage.getItem("GEMINI_API_KEY")
      
      if (!apiKey) {
        console.warn("Gemini API key not found in localStorage")
        // No need to show a toast here as the GeminiApiKeyPrompt component will handle this
      } else {
        // Ensure it's available as an environment variable as well
        try {
          // @ts-ignore - This is a workaround to make the API key available to the app
          window.process = window.process || {}
          // @ts-ignore
          window.process.env = window.process.env || {}
          // @ts-ignore
          window.process.env.GEMINI_API_KEY = apiKey

          setInitialized(true)
          
          // Dispatch a custom event to notify other components that the API key is available
          const event = new Event("gemini-api-key-loaded")
          window.dispatchEvent(event)
        } catch (error) {
          console.error("Error initializing Gemini API key:", error)
        }
      }
    }
  }, [toast])

  return {
    initialized
  }
}