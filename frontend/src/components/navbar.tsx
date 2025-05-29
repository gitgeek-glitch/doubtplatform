"use client"

import type React from "react"
import { useState, useEffect } from "react"
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/home?search=${encodeURIComponent(searchQuery)}`)
      setMobileMenuOpen(false)
    }
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
                <Search className="navbar-search-icon" />
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
                        <AvatarFallback className="bg-gradient-to-br">
                          {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="navbar-dropdown" align="end">
                    <div className="navbar-dropdown-user">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarSrc || ""} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br">
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
        <div className="navbar-mobile-menu">
          <div className="navbar-mobile-container">
            {isAuthenticated && isHomePage && (
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
            )}

            <div className="flex flex-col gap-3">
              <Button
                variant="default"
                className="navbar-mobile-button text-white"
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
                      <AvatarImage src={avatarSrc || ""} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-br">
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
                      <User className="mr-3 h-5 w-5" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="navbar-mobile-menu-item"
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
                  className="navbar-mobile-button text-white"
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
