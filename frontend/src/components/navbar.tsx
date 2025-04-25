"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
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
import { Search, Menu, X, LogOut, User, Settings, Bell, Moon, Sun } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`)
      setMobileMenuOpen(false)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className={cn("navbar", scrolled ? "navbar-scrolled" : "navbar-transparent")}>
      <div className="navbar-container">
        <div className="flex items-center gap-4">
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">
              <span className="text-lg font-bold text-white">DS</span>
            </div>
            <span className="navbar-logo-text">DoubtSolve</span>
          </Link>

          <form onSubmit={handleSearch} className="navbar-search">
            <div className="relative group">
              <Input
                type="search"
                placeholder="Search questions..."
                className="navbar-search-input"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              <Search className="navbar-search-icon" />
            </div>
          </form>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="navbar-theme-toggle">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" className="navbar-notification">
            <Bell className="h-4 w-4" />
            <span className="navbar-notification-badge">3</span>
          </Button>

          {isAuthenticated ? (
            <>
              <Button variant="default" className="navbar-button" onClick={() => navigate("/ask")}>
                Ask Question
              </Button>

              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <div className="navbar-avatar-container">
                      <Avatar className="h-8 w-8 cursor-pointer">
                        <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                          {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="navbar-dropdown" align="end">
                    <div className="navbar-dropdown-user">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                          {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5 leading-none">
                        <p className="font-medium text-sm text-white">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="my-1 h-px bg-gray-800/70" />
                    <DropdownMenuItem
                      onClick={() => navigate(`/profile/${user?._id}`)}
                      className="navbar-dropdown-item"
                    >
                      <User className="mr-2 h-4 w-4 text-gray-400" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="navbar-dropdown-item">
                      <Settings className="mr-2 h-4 w-4 text-gray-400" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 h-px bg-gray-800/70" />
                    <DropdownMenuItem onClick={logout} className="navbar-dropdown-item-danger">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <Button variant="default" className="navbar-button" onClick={() => navigate("/auth")}>
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

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu">
          <div className="navbar-mobile-container">
            <form onSubmit={handleSearch} className="navbar-mobile-search">
              <Input
                type="search"
                placeholder="Search questions..."
                className="navbar-mobile-search-input"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              <Search className="navbar-search-icon" />
            </form>

            <div className="flex flex-col gap-3">
              <Button
                variant="default"
                className="navbar-mobile-button"
                onClick={() => {
                  navigate("/ask")
                  setMobileMenuOpen(false)
                }}
              >
                Ask Question
              </Button>

              {isAuthenticated ? (
                <>
                  <div className="navbar-mobile-user">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <Button
                      variant="ghost"
                      className="navbar-mobile-menu-item"
                      onClick={() => {
                        navigate(`/profile/${user?._id}`)
                        setMobileMenuOpen(false)
                      }}
                    >
                      <User className="mr-3 h-5 w-5 text-purple-400" />
                      Profile
                    </Button>
                    <Button variant="ghost" className="navbar-mobile-menu-item">
                      <Settings className="mr-3 h-5 w-5 text-purple-400" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="navbar-mobile-menu-item"
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                    >
                      <LogOut className="mr-3 h-5 w-5 text-red-400" />
                      Log out
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  variant="default"
                  className="navbar-mobile-button"
                  onClick={() => {
                    navigate("/auth")
                    setMobileMenuOpen(false)
                  }}
                >
                  Sign In
                </Button>
              )}

              <div className="mt-auto">
                <Button variant="ghost" className="navbar-mobile-menu-item" onClick={toggleTheme}>
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
