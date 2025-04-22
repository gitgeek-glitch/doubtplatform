"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Clock, TrendingUp } from "lucide-react"
import { api } from "@/lib/api"
import { useLocomotiveScroll } from "@/context/locomotive-context"
import QuestionCard from "@/components/question-card"

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {searchQuery
              ? `Search results for "${searchQuery}"`
              : tag
                ? `Questions tagged with "${tag}"`
                : "Explore Questions"}
          </h1>
          <p className="text-muted-foreground mt-1">Discover and solve interesting problems from your peers</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-900 border-gray-800">
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

          <Tabs defaultValue="latest" className="w-full sm:w-auto" value={filter} onValueChange={setFilter}>
            <TabsList className="grid grid-cols-3 w-full sm:w-[300px] bg-gray-900">
              <TabsTrigger value="latest" className="data-[state=active]:bg-purple-600">
                <Clock className="h-4 w-4 mr-2" />
                Latest
              </TabsTrigger>
              <TabsTrigger value="trending" className="data-[state=active]:bg-purple-600">
                <TrendingUp className="h-4 w-4 mr-2" />
                Hot
              </TabsTrigger>
              <TabsTrigger value="unanswered" className="data-[state=active]:bg-purple-600">
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
            <div className="flex justify-center pt-4">
              <Button onClick={handleLoadMore} variant="outline" className="border-gray-800 hover:bg-gray-800">
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-gray-800 rounded-lg"
          data-scroll
          data-scroll-speed="0.1"
        >
          <h3 className="text-xl font-semibold mb-2">No questions found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || tag ? "Try a different search term or tag" : "Be the first to ask a question!"}
          </p>
          <Button onClick={() => (window.location.href = "/ask")} className="bg-purple-600 hover:bg-purple-700">
            Ask a Question
          </Button>
        </div>
      )}
    </div>
  )
}