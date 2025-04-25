"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Clock, TrendingUp } from 'lucide-react'
import { api } from "@/lib/api"
import { useLocomotiveScroll } from "@/context/locomotive-context"
import QuestionCard from "@/components/question-card"
import { cn } from "@/lib/utils"

interface Question {
  _id: string
  title: string
  content: string
  tags: string[]
  upvotes: number
  downvotes: number
  answerCount: number
  author: {
    _id: string
    name: string
    avatar?: string
  }
  createdAt: string
}

export default function HomePage() {
  const [searchParams] = useSearchParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const navigate = useNavigate();
  const [hasMore, setHasMore] = useState(true)
  const [filter, setFilter] = useState("latest")
  const [category, setCategory] = useState("all")
  const { scroll } = useLocomotiveScroll()

  const searchQuery = searchParams.get("search") || ""
  const tag = searchParams.get("tag") || ""

  useEffect(() => {
    fetchQuestions()
    // Reset scroll position when filter changes
    if (scroll) {
      scroll.scrollTo(0, { duration: 0, disableLerp: true })
    }
  }, [filter, category, searchQuery, tag])

  const fetchQuestions = async (loadMore = false) => {
    try {
      if (loadMore) {
        setPage((prev) => prev + 1)
      } else {
        setLoading(true)
        setPage(1)
      }

      const params = new URLSearchParams({
        page: loadMore ? String(page + 1) : "1",
        limit: "10",
        sort: filter,
        ...(category !== "all" && { category }),
        ...(searchQuery && { search: searchQuery }),
        ...(tag && { tag }),
      })

      const response = await api.get(`/questions?${params}`)

      if (loadMore) {
        setQuestions((prev) => [...prev, ...(response.data.questions || [])])
      } else {
        setQuestions(response.data.questions || [])
      }

      setHasMore(response.data.questions && response.data.questions.length === 10)
    } catch (error) {
      console.error("Error fetching questions:", error)
      // Set questions to empty array if there's an error
      if (!loadMore) {
        setQuestions([])
      }
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    fetchQuestions(true)
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

  return (
    <div className="space-y-6" data-scroll-section>
      <div className="home-header">
        <div>
          <h1 className="home-title">
            {searchQuery
              ? `Search results for "${searchQuery}"`
              : tag
                ? `Questions tagged with "${tag}"`
                : "Explore Questions"}
          </h1>
          <p className="home-subtitle">Discover and solve interesting problems from your peers</p>
        </div>

        <div className="home-filters">
          <Select value={category} onValueChange={setCategory}>
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

          <Tabs defaultValue="latest" className="home-tabs" value={filter} onValueChange={setFilter}>
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
        </div>
      </div>

      {loading ? (
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
              <Button onClick={handleLoadMore} variant="outline" className="home-load-more-button">
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="home-empty-state" data-scroll data-scroll-speed="0.1">
          <h3 className="home-empty-title">No questions found</h3>
          <p className="home-empty-message">
            {searchQuery || tag ? "Try a different search term or tag" : "Be the first to ask a question!"}
          </p>
          <Button onClick={() => navigate("/ask")} className="ask-question-submit">
            Ask a Question
          </Button>
        </div>
      )}
    </div>
  )
}
