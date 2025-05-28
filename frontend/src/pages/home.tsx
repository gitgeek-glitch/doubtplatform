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
import { MessageSquare, Clock, PlusCircle, RefreshCw } from "lucide-react"
import QuestionCard from "@/components/question-card"
import TopContributors from "@/components/top-contributors"
import VotesDistribution from "@/components/votes-distribution"
import { useLocomotiveScroll } from "@/context/locomotive-context"
import { cn } from "@/lib/utils"

interface FetchQuestionsParams {
  filter: string
  category: string
  search: string
  tag: string
  forceRefresh?: boolean
  loadMore?: boolean
  page?: number
  unanswered?: boolean
}

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

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const search = params.get("search") || ""
    const tag = params.get("tag") || ""

    setSearchParams({ search, tag })
  }, [location.search])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/")
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (isAuthenticated) {
      const fetchParams: FetchQuestionsParams = {
        filter,
        category,
        search: searchParams.search,
        tag: searchParams.tag,
        forceRefresh: true,
      }

      if (filter === "unanswered") {
        fetchParams.unanswered = true
      }

      dispatch(fetchQuestions(fetchParams))

      if (scroll) {
        scroll.scrollTo(0, { duration: 0, disableLerp: true })
      }
    }
  }, [dispatch, filter, category, searchParams, isAuthenticated, scroll])

  useEffect(() => {
    if (!isAuthenticated) return

    const intervalId = setInterval(() => {
      const now = Date.now()
      if (now - lastRefreshTime > 60000) {
        const fetchParams: FetchQuestionsParams = {
          filter,
          category,
          search: searchParams.search,
          tag: searchParams.tag,
        }

        if (filter === "unanswered") {
          fetchParams.unanswered = true
        }

        dispatch(fetchQuestions(fetchParams))
      }
    }, 60000)

    return () => clearInterval(intervalId)
  }, [dispatch, filter, category, searchParams, isAuthenticated, lastRefreshTime])

  useEffect(() => {
    if (!isAuthenticated) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now()
        if (now - lastRefreshTime > 30000) {
          const fetchParams: FetchQuestionsParams = {
            filter,
            category,
            search: searchParams.search,
            tag: searchParams.tag,
          }

          if (filter === "unanswered") {
            fetchParams.unanswered = true
          }

          dispatch(fetchQuestions(fetchParams))
          setLastRefreshTime(now)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [dispatch, filter, category, searchParams, isAuthenticated, lastRefreshTime])

  const handleFilterChange = (value: string) => {
    dispatch(setFilter(value))
  }

  const handleCategoryChange = (value: string) => {
    dispatch(setCategory(value))
  }

  const handleLoadMore = () => {
    const fetchParams: FetchQuestionsParams = {
      filter,
      category,
      search: searchParams.search,
      tag: searchParams.tag,
      loadMore: true,
      page: Math.floor(questions.length / 10) + 1,
    }

    if (filter === "unanswered") {
      fetchParams.unanswered = true
    }

    dispatch(fetchQuestions(fetchParams))
  }

  const handleRefresh = useCallback(
    debounce(() => {
      const now = Date.now()
      if (now - lastRefreshTime > 5000) {
        setRefreshing(true)
        const fetchParams: FetchQuestionsParams = {
          filter,
          category,
          search: searchParams.search,
          tag: searchParams.tag,
          forceRefresh: true,
        }

        if (filter === "unanswered") {
          fetchParams.unanswered = true
        }

        dispatch(fetchQuestions(fetchParams)).finally(() => {
          setRefreshing(false)
          setLastRefreshTime(now)
        })
      } else {
        setRefreshing(true)
        setTimeout(() => setRefreshing(false), 500)
      }
    }, 500),
    [dispatch, filter, category, searchParams, lastRefreshTime],
  )

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

        <div className="home-filters flex items-center justify-between gap-4 flex-wrap">
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
            <TabsList className="home-tabs-list transition-all duration-200">
              <TabsTrigger value="latest" className={cn("px-4", filter === "latest" && "home-tab-active")}>
                <Clock className="h-4 w-4 mr-2" />
                Latest
              </TabsTrigger>
              <TabsTrigger value="unanswered" className={cn("px-4", filter === "unanswered" && "home-tab-active")}>
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
              className="h-10 w-10 flex items-center justify-center"
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
                {filter === "unanswered"
                  ? "All questions have been answered, ask yours..."
                  : searchParams.search || searchParams.tag
                    ? "Try a different search term or tag"
                    : "Be the first to ask a question!"}
              </p>
              <Button onClick={() => navigate("/ask")} className="ask-question-submit mt-4">
                Ask a Question
              </Button>
            </div>
          )}
        </div>

        <div className="home-sidebar">
          <div className="home-sidebar-widgets">
            <TopContributors />
            <VotesDistribution communityView={true} />
          </div>
        </div>
      </div>
    </div>
  )
}