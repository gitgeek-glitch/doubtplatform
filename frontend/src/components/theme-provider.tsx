"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setTheme } from "@/redux/slices/uiSlice"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark", // Changed default to dark to match your CSS default
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const dispatch = useAppDispatch()
  const reduxTheme = useAppSelector(state => state.ui.theme)
  const [theme, setThemeState] = useState<Theme>(reduxTheme || defaultTheme)

  useEffect(() => {
    const root = window.document.documentElement
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

    // First remove both classes
    root.classList.remove("light", "dark")

    // Apply the appropriate class
    if (theme === "system") {
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Set data attribute for components that use it
    root.setAttribute("data-theme", theme === "system" ? systemTheme : theme)

    // Force a repaint to ensure styles are applied correctly
    const originalDisplay = document.body.style.display
    document.body.style.display = "none"
    void document.body.offsetHeight // Trigger a reflow
    document.body.style.display = originalDisplay
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme === "system") {
      const mqListener = (e: MediaQueryListEvent) => {
        const root = window.document.documentElement
        const newTheme = e.matches ? "dark" : "light"

        root.classList.remove("light", "dark")
        root.classList.add(newTheme)
        root.setAttribute("data-theme", newTheme)
      }

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      mediaQuery.addEventListener("change", mqListener)

      return () => mediaQuery.removeEventListener("change", mqListener)
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      dispatch(setTheme(theme))
      setThemeState(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}