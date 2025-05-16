"use client"

import { useEffect, useState, useCallback } from "react"
import debounce from "lodash/debounce"
import { useNavigate, useLocation } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchQuestions, setFilter, setCategory } from "@/redux/slices/questionsSlice"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Clock, TrendingUp, PlusCircle, RefreshCw } from "lucide-react"
import QuestionCard from "@/components/question-card"
import TopContributors from "@/components/top-contributors"
import VotesDistribution from "@/components/votes-distribution"
import { useLocomotiveScroll } from "@/context/locomotive-context"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const dispatch = useAppDispatch()
  const { questions, loading, hasMore, filter, category } = useAppSelector((state) => state.questions)
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  const navigate = useNavigate()
  const location = useLocation()
  const { scroll } = useLocomotiveScroll()
  const [searchParams, setSearchParams] = useState({
    search: "",
    tag: "",
  })
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(0)

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
      navigate("/")
    }
  }, [isAuthenticated, isLoading, navigate])

  // Fetch questions on initial load and when filters change
  useEffect(() => {
    if (isAuthenticated) {
      // Force refresh on initial load and when filters change
      dispatch(
        fetchQuestions({
          filter,
          category,
          search: searchParams.search,
          tag: searchParams.tag,
          forceRefresh: true,
        }),
      )

      // Reset scroll position when filter changes
      if (scroll) {
        scroll.scrollTo(0, { duration: 0, disableLerp: true })
      }
    }
  }, [dispatch, filter, category, searchParams, isAuthenticated, scroll])

  // Reduce polling interval and use a more efficient approach
  useEffect(() => {
    if (!isAuthenticated) return

    // Use a less frequent polling interval (60 seconds instead of 15)
    const intervalId = setInterval(() => {
      const now = Date.now()
      // Only refresh if it's been at least 60 seconds since the last manual refresh
      if (now - lastRefreshTime > 60000) {
        dispatch(
          fetchQuestions({
            filter,
            category,
            search: searchParams.search,
            tag: searchParams.tag,
          }),
        )
      }
    }, 60000) // Poll every 60 seconds

    return () => clearInterval(intervalId)
  }, [dispatch, filter, category, searchParams, isAuthenticated, lastRefreshTime])

  // Refresh questions when window regains focus, but with throttling
  useEffect(() => {
    if (!isAuthenticated) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now()
        // Only refresh if it's been at least 30 seconds since the last refresh
        if (now - lastRefreshTime > 30000) {
          dispatch(
            fetchQuestions({
              filter,
              category,
              search: searchParams.search,
              tag: searchParams.tag,
            }),
          )
          setLastRefreshTime(now)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Clean up event listener on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [dispatch, filter, category, searchParams, isAuthenticated, lastRefreshTime])

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
        page: questions.length / 10 + 1,
      }),
    )
  }

  // Manual refresh with debounce and cooldown
  const handleRefresh = useCallback(
    debounce(() => {
      const now = Date.now()
      // Only allow refresh if it's been at least 5 seconds since the last refresh
      if (now - lastRefreshTime > 5000) {
        setRefreshing(true)
        dispatch(
          fetchQuestions({
            filter,
            category,
            search: searchParams.search,
            tag: searchParams.tag,
            forceRefresh: true,
          }),
        ).finally(() => {
          setRefreshing(false)
          setLastRefreshTime(now)
        })
      } else {
        // If trying to refresh too soon, show a brief "refreshing" state
        setRefreshing(true)
        setTimeout(() => setRefreshing(false), 500)
      }
    }, 500),
    [dispatch, filter, category, searchParams, lastRefreshTime],
  )

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
    <div className="home-container" data-scroll-section>
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
              <TabsTrigger value="latest" className={cn(filter === "latest" && "home-tab-active")}>
                <Clock className="h-4 w-4 mr-2" />
                Latest
              </TabsTrigger>
              <TabsTrigger value="trending" className={cn(filter === "trending" && "home-tab-active")}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Hot
              </TabsTrigger>
              <TabsTrigger value="unanswered" className={cn(filter === "unanswered" && "home-tab-active")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Unanswered
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="icon"
              className="h-10 w-10"
              title="Refresh questions"
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>

            <Button onClick={() => navigate("/ask")} className="ask-question-submit">
              <PlusCircle className="h-4 w-4 mr-2" />
              Ask Question
            </Button>
          </div>
        </div>
      </div>

      <div className="home-content">
        <div className="home-main">
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
                {searchParams.search || searchParams.tag
                  ? "Try a different search term or tag"
                  : "Be the first to ask a question!"}
              </p>
              <Button onClick={() => navigate("/ask")} className="ask-question-submit">
                Ask a Question
              </Button>
            </div>
          )}
        </div>

        <div className="home-sidebar">
          <div className="home-sidebar-widgets">
            <TopContributors />
            <VotesDistribution />
          </div>
        </div>
      </div>
    </div>
  )
}
