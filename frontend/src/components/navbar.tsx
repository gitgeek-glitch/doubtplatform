"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { logout } from "@/redux/slices/authSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Menu, X, LogOut, User, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { generateAvatar } from "@/lib/avatar"
import { CollegeQuoraLogo } from "@/components/college-quora-logo"

export default function Navbar() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const { theme, setTheme } = useTheme()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [scrolled, setScrolled] = useState(false)

  const isHomePage = location.pathname === "/home"
  const isDarkMode = theme === "dark"
  const avatarSrc = user?.email ? generateAvatar(user.email, isDarkMode) : null

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Debounced search function to avoid too many API calls
  const debounceSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          if (query.trim()) {
            navigate(`/home?search=${encodeURIComponent(query)}`)
          } else {
            // If search is empty, navigate back to home without search params
            navigate("/home")
          }
        }, 300) // 300ms debounce delay
      }
    })(),
    [navigate]
  )

  // Handle search input change with dynamic filtering
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    // Trigger dynamic search with debouncing
    debounceSearch(query)
  }

  // Handle form submission (when user presses Enter)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/home?search=${encodeURIComponent(searchQuery)}`)
      setMobileMenuOpen(false)
    } else {
      navigate("/home")
    }
  }

  // Handle mobile search input change
  const handleMobileSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    // Trigger dynamic search with debouncing for mobile too
    debounceSearch(query)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isAuthenticated) {
      navigate("/home")
    } else {
      navigate("/")
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
    navigate("/")
  }

  // Clear search when navigating away from home page
  useEffect(() => {
    if (!isHomePage) {
      setSearchQuery("")
    }
  }, [isHomePage])

  // Initialize search query from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const searchParam = urlParams.get('search')
    if (searchParam) {
      setSearchQuery(searchParam)
    }
  }, [location.search])

  return (
    <header className={cn("navbar", scrolled ? "navbar-scrolled" : "navbar-transparent")}>
      <div className="navbar-container">
        <div className="flex items-center gap-4">
          <a href="#" onClick={handleLogoClick} className="navbar-logo">
            <CollegeQuoraLogo className="h-8 w-8" />
            <span className="navbar-logo-text">CollegeQuora</span>
          </a>

          {isAuthenticated && isHomePage && (
            <form onSubmit={handleSearch} className="navbar-search">
              <div className="relative group">
                <Input
                  type="search"
                  placeholder="Search questions..."
                  className="navbar-search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoComplete="off"
                />
                <Search className="navbar-search-icon" />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => {
                      setSearchQuery("")
                      navigate("/home")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="navbar-theme-toggle">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthenticated ? (
            <>
              <Button variant="default" className="navbar-button text-white" onClick={() => navigate("/ask")}>
                Ask Question
              </Button>

              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <div className="navbar-avatar-container">
                      <Avatar className="h-8 w-8 cursor-pointer">
                        <AvatarImage src={avatarSrc || ""} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="navbar-dropdown" align="end">
                    <div className="navbar-dropdown-user">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarSrc || ""} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5 leading-none">
                        <p className="font-medium text-sm">{user?.name}</p>
                        <p className="text-xs">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="my-1 h-px bg-gray-300 dark:bg-gray-800" />
                    <DropdownMenuItem
                      onClick={() => navigate(`/profile/${user?._id}`)}
                      className="navbar-dropdown-item"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 h-px bg-gray-300 dark:bg-gray-800" />
                    <DropdownMenuItem onClick={handleLogout} className="navbar-dropdown-item-danger">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <Button variant="default" className="navbar-button text-white" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="navbar-mobile-menu bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="navbar-mobile-container bg-white dark:bg-gray-900 p-4">
            {isAuthenticated && isHomePage && (
              <form onSubmit={handleSearch} className="navbar-mobile-search mb-4">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Search questions..."
                    className="navbar-mobile-search-input pr-10"
                    value={searchQuery}
                    onChange={handleMobileSearchChange}
                    autoComplete="off"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {searchQuery && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => {
                        setSearchQuery("")
                        navigate("/home")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="flex flex-col gap-3">
              {isAuthenticated && (
                <Button
                  variant="default"
                  className="navbar-mobile-button text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  onClick={() => {
                    navigate("/ask")
                    setMobileMenuOpen(false)
                  }}
                >
                  Ask Question
                </Button>
              )}

              {isAuthenticated ? (
                <>
                  <div className="navbar-mobile-user bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarSrc || ""} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                    <Button
                      variant="ghost"
                      className="navbar-mobile-menu-item w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        navigate(`/profile/${user?._id}`)
                        setMobileMenuOpen(false)
                      }}
                    >
                      <User className="mr-3 h-5 w-5" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="navbar-mobile-menu-item w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => {
                        dispatch(logout())
                        setMobileMenuOpen(false)
                        navigate("/")
                      }}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Log out
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  variant="default"
                  className="navbar-mobile-button text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  onClick={() => {
                    navigate("/auth")
                    setMobileMenuOpen(false)
                  }}
                >
                  Sign In
                </Button>
              )}

              <div className="mt-auto bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                <Button 
                  variant="ghost" 
                  className="navbar-mobile-menu-item w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="mr-3 h-5 w-5 text-amber-400" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="mr-3 h-5 w-5 text-indigo-400" />
                      Dark Mode
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}