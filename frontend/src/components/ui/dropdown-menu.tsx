"use client"

import React, {
  createContext,
  forwardRef,
  useContext,
  useState,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"

// Context for dropdown state
const DropdownMenuContext = createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

export interface DropdownMenuProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function DropdownMenu({ children, ...props }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div {...props} ref={dropdownRef}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export interface DropdownMenuTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: ReactNode
}

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, asChild = false, children, ...props }, ref) => {
    const { open, setOpen } = useContext(DropdownMenuContext)

    // If asChild is true, we need a different approach
    if (asChild && React.isValidElement(children)) {
      // We cannot properly use cloneElement with ref forwarding in this context
      // Instead, we'll wrap the child in a div that handles the click
      return (
        <div
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open) // Toggle the open state
            if (children.props.onClick) {
              children.props.onClick(e)
            }
          }}
        >
          {children}
        </div>
      )
    }

    return (
      <button
        ref={ref}
        className={cn("", className)}
        onClick={() => setOpen(!open)} // Toggle the open state
        {...props}
      >
        {children}
      </button>
    )
  },
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end"
  forceMount?: boolean
}

export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "center", forceMount, ...props }, ref) => {
    const { open } = useContext(DropdownMenuContext)

    if (!open && !forceMount) return null

    return (
      <div
        ref={ref}
        className={cn(
          "dropdown-menu-content",
          align === "start" && "dropdown-menu-content-start",
          align === "end" && "dropdown-menu-content-end",
          className,
        )}
        {...props}
      />
    )
  },
)
DropdownMenuContent.displayName = "DropdownMenuContent"

export interface DropdownMenuItemProps extends HTMLAttributes<HTMLDivElement> {}

export const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(({ className, ...props }, ref) => {
  const { setOpen } = useContext(DropdownMenuContext)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (props.onClick) {
      props.onClick(e)
    }
    // Close the dropdown when an item is clicked
    setOpen(false)
  }

  return <div ref={ref} className={cn("dropdown-menu-item", className)} onClick={handleClick} {...props} />
})
DropdownMenuItem.displayName = "DropdownMenuItem"

export interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {}

export const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("dropdown-menu-separator", className)} {...props} />
  },
)
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"
