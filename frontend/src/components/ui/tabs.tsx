"use client"

import { createContext, forwardRef, useContext, type HTMLAttributes, type ReactNode } from "react"
import { cn } from "@/lib/utils"

// Context for tabs state
const TabsContext = createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: "",
  onValueChange: () => {},
})

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
  defaultValue?: string
  children: ReactNode
}

export function Tabs({ value, onValueChange, defaultValue, children, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("tabs-list", className)} {...props} />
})
TabsList.displayName = "TabsList"

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(({ className, value, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = useContext(TabsContext)
  const isSelected = selectedValue === value

  return (
    <button
      ref={ref}
      className={cn(
        "tabs-trigger",
        isSelected ? "tabs-trigger-active" : "tabs-trigger-inactive",
        className,
      )}
      onClick={() => onValueChange(value)}
      data-state={isSelected ? "active" : "inactive"}
      {...props}
    />
  )
})
TabsTrigger.displayName = "TabsTrigger"

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(({ className, value, ...props }, ref) => {
  const { value: selectedValue } = useContext(TabsContext)
  const isSelected = selectedValue === value

  if (!isSelected) return null

  return (
    <div
      ref={ref}
      className={cn("tabs-content", className)}
      data-state={isSelected ? "active" : "inactive"}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"
