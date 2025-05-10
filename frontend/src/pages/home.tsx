"use client"

import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchQuestions, setFilter, setCategory } from "@/redux/slices/questionsSlice"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MessageSquare, Clock, TrendingUp, PlusCircle } from 'lucide-react'
import QuestionCard from "@/components/question-card"
import { useLocomotiveScroll } from "@/context/locomotive-context"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const dispatch = useAppDispatch()
  const { questions, loading, hasMore, filter, category } = useAppSelector(state => state.questions)
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth)
  const navigate = useNavigate()
  const location = useLocation()
  const { scroll } = useLocomotiveScroll()
  const [searchParams, setSearchParams] = useState({
    search: "",
    tag: "",
  })

  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const search = params.get("search") || ""
    const tag = params.get("tag") || ""
    
    setSearchParams({ search, tag })
  }, [location.search])

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, isLoading, navigate])

  // Fetch questions on initial load and when filters change
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(
        fetchQuestions({
          filter,
          category,
          search: searchParams.search,
          tag: searchParams.tag,
        })
      )
      
      // Reset scroll position when filter changes
      if (scroll) {
        scroll.scrollTo(0, { duration: 0, disableLerp: true })
      }
    }
  }, [dispatch, filter, category, searchParams, isAuthenticated, scroll])

  // Handle filter change
  const handleFilterChange = (value: string) => {
    dispatch(setFilter(value))
  }

  // Handle category change
  const handleCategoryChange = (value: string) => {
    dispatch(setCategory(value))
  }

  // Load more questions
  const handleLoadMore = () => {
    dispatch(
      fetchQuestions({
        filter,
        category,
        search: searchParams.search,
        tag: searchParams.tag,
        loadMore: true,
      })
    )
  }

  // Categories for filtering
  const categories = [
    { value: "all", label: "All Topics" },
    { value: "dsa", label: "DSA" },
    { value: "maths", label: "Mathematics" },
    { value: "programming", label: "Programming" },
    { value: "web", label: "Web Development" },
    { value: "mobile", label: "Mobile Development" },
    { value: "ai", label: "AI & ML" },
    { value: "database", label: "Databases" },
  ]

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="space-y-6" data-scroll-section>
      <div className="home-header">
        <div>
          <h1 className="home-title">
            {searchParams.search
              ? `Search results for "${searchParams.search}"`
              : searchParams.tag
                ? `Questions tagged with "${searchParams.tag}"`
                : "Explore Questions"}
          </h1>
          <p className="home-subtitle">Discover and solve interesting problems from your peers</p>
        </div>

        <div className="home-filters">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="home-category-select">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs defaultValue="latest" className="home-tabs" value={filter} onValueChange={handleFilterChange}>
            <TabsList className="home-tabs-list">
              <TabsTrigger 
                value="latest" 
                className={cn(filter === "latest" && "home-tab-active")}
              >
                <Clock className="h-4 w-4 mr-2" />
                Latest
              </TabsTrigger>
              <TabsTrigger 
                value="trending" 
                className={cn(filter === "trending" && "home-tab-active")}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Hot
              </TabsTrigger>
              <TabsTrigger 
                value="unanswered" 
                className={cn(filter === "unanswered" && "home-tab-active")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Unanswered
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button onClick={() => navigate("/ask")} className="ask-question-submit">
            <PlusCircle className="h-4 w-4 mr-2" />
            Ask Question
          </Button>
        </div>
      </div>

      {loading && questions.length === 0 ? (
        <div className="space-y-4" data-scroll data-scroll-speed="0.1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-6 rounded-lg border border-gray-800 bg-gray-900/50">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : questions && questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question._id} data-scroll data-scroll-speed={0.1 + (index % 3) * 0.05}>
              <QuestionCard question={question} />
            </div>
          ))}

          {hasMore && (
            <div className="home-load-more">
              <Button 
                onClick={handleLoadMore} 
                variant="outline" 
                className="home-load-more-button"
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="home-empty-state" data-scroll data-scroll-speed="0.1">
          <h3 className="home-empty-title">No questions found</h3>
          <p className="home-empty-message">
            {searchParams.search || searchParams.tag ? "Try a different search term or tag" : "Be the first to ask a question!"}
          </p>
          <Button onClick={() => navigate("/ask")} className="ask-question-submit">
            Ask a Question
          </Button>
        </div>
      )}
    </div>
  )
}