"use client"

import { createContext, forwardRef, useContext, useState, useEffect, useRef, type HTMLAttributes, type ReactNode } from "react"
import { cn } from "@/lib/utils"

// Context for select state
const SelectContext = createContext<{
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}>({
  value: "",
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
})

export interface SelectProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
}

export function Select({ value, onValueChange, children, ...props }: SelectProps) {
  const [open, setOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  // Close select when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div {...props} ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export interface SelectTriggerProps extends HTMLAttributes<HTMLDivElement> {
  id?: string
}

export const SelectTrigger = forwardRef<HTMLDivElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useContext(SelectContext)

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    )
  },
)
SelectTrigger.displayName = "SelectTrigger"

export interface SelectValueProps extends HTMLAttributes<HTMLSpanElement> {
  placeholder?: string
}

export const SelectValue = forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder, ...props }, ref) => {
    const { value } = useContext(SelectContext)

    return (
      <span ref={ref} className={cn("block truncate", className)} {...props}>
        {value || placeholder}
      </span>
    )
  },
)
SelectValue.displayName = "SelectValue"

export interface SelectContentProps extends HTMLAttributes<HTMLDivElement> {}

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(({ className, children, ...props }, ref) => {
  const { open } = useContext(SelectContext)

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 top-full mt-1 min-w-[8rem] w-full overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SelectContent.displayName = "SelectContent"

export interface SelectItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value: itemValue, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange, setOpen } = useContext(SelectContext)
    const isSelected = selectedValue === itemValue

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent",
          className,
        )}
        onClick={() => {
          onValueChange(itemValue)
          setOpen(false) // Close the dropdown after selection
        }}
        {...props}
      >
        {isSelected && (
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
        )}
        {children}
      </div>
    )
  },
)
SelectItem.displayName = "SelectItem"