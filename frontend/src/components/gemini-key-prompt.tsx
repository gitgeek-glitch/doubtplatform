"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export function GeminiApiKeyPrompt() {
  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    // First check environment variable
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY
    
    if (envApiKey) {
      // Save to localStorage and close dialog
      localStorage.setItem("GEMINI_API_KEY", envApiKey)
      setOpen(false)
      return
    }
    
    // Fallback to localStorage
    const localStorageKey = localStorage.getItem("GEMINI_API_KEY")
    if (!localStorageKey) {
      setOpen(true)
    } else {
      setOpen(false)
    }
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "GEMINI_API_KEY" && !e.newValue) {
        setOpen(true)
      } else if (e.key === "GEMINI_API_KEY" && e.newValue) {
        setOpen(false)
      }
    }
    
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key",
        variant: "destructive",
      })
      return
    }

    // Save API key to localStorage
    localStorage.setItem("GEMINI_API_KEY", apiKey.trim())
    setOpen(false)

    toast({
      title: "API Key Saved",
      description: "Your Gemini API key has been saved",
    })
    
    // Trigger a storage event to notify other components about the change
    const storageEvent = new StorageEvent("storage", {
      key: "GEMINI_API_KEY",
      newValue: apiKey.trim(),
      storageArea: localStorage,
    })
    window.dispatchEvent(storageEvent)
    
    // Dispatch custom event
    const event = new Event("gemini-api-key-loaded")
    window.dispatchEvent(event)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Gemini API Key</DialogTitle>
          <DialogDescription>
            To enable content moderation, please enter your Gemini API key. You can get one from the Google AI Studio.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Enter your Gemini API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type="password"
          />
          <p className="text-xs text-muted-foreground">
            Your API key is stored locally in your browser and is not sent to our servers.
          </p>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}