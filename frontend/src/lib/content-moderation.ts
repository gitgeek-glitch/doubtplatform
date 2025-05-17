import { GoogleGenerativeAI } from "@google/generative-ai"

/**
 * Gets API key from environment variable or localStorage as fallback
 */
const getGeminiApiKey = () => {
  // First check if the API key is available in environment variables
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY
  }
  
  // Directly use environment API key if defined (for hardcoded value in .env)
  if (import.meta.env.GEMINI_API_KEY) {
    return import.meta.env.GEMINI_API_KEY
  }
  
  // Fallback to localStorage for client-side usage
  if (typeof window !== "undefined") {
    return localStorage.getItem("GEMINI_API_KEY") || ""
  }
  
  return ""
}

/**
 * Creates a new GenerativeAI instance with the current API key
 */
const getGenAIInstance = () => {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    console.error("Attempted to create GenerativeAI instance with empty API key")
    throw new Error("No API key available")
  }
  return new GoogleGenerativeAI(apiKey)
}

interface ModerationResult {
  isAppropriate: boolean
  reason?: string
}

/**
 * Checks if the provided content contains inappropriate language
 * @param content The text content to check
 * @returns A promise that resolves to a ModerationResult object
 */
export async function checkContentModeration(content: string): Promise<ModerationResult> {
  try {
    // Skip empty content
    if (!content.trim()) {
      return { isAppropriate: true }
    }

    // For very short content, no need to check
    if (content.length < 5) {
      return { isAppropriate: true }
    }

    // Always get a fresh instance with the latest API key
    const genAI = getGenAIInstance()
    
    // Check if we have a valid API key
    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      console.warn("No Gemini API key available, skipping content moderation")
      return { isAppropriate: true }
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Prompt for content moderation
    const prompt = `
      You are a content moderation system. Analyze the following text and determine if it contains inappropriate language, 
      including profanity, hate speech, sexual content, threats, or other harmful content.
      
      Text to analyze: "${content}"
      
      Respond with only "APPROPRIATE" if the content is appropriate, or "INAPPROPRIATE: [reason]" if it contains inappropriate content.
    `

    // Generate content
    const result = await model.generateContent(prompt)
    const response = result.response.text().trim()

    // Parse the response
    if (response.startsWith("APPROPRIATE")) {
      return { isAppropriate: true }
    } else if (response.startsWith("INAPPROPRIATE")) {
      const reason = response.replace("INAPPROPRIATE:", "").trim()
      return { isAppropriate: false, reason }
    }

    // Default to appropriate if the response format is unexpected
    return { isAppropriate: true }
  } catch (error) {
    console.error("Content moderation error:", error)
    // In case of error, allow the content to pass through
    return { isAppropriate: true }
  }
}