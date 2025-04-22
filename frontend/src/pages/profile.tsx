"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Award, Calendar, Edit, ArrowUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import QuestionCard from "@/components/question-card"

interface User {
  _id: string
  name: string
  email: string
  bio: string
  avatar?: string
  reputation: number
  badges: string[]
  createdAt: string
  questionsCount: number
  answersCount: number
}

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

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("questions")

  const isOwnProfile = currentUser?._id === id

  useEffect(() => {
    if (id) {
      fetchUserProfile()
    }
  }, [id])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const [userRes, questionsRes, answersRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/users/${id}/questions`),
        api.get(`/users/${id}/answers`),
      ])

      setUser(userRes.data)
      setQuestions(questionsRes.data)
      setAnswers(answersRes.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Badge colors based on level
  const getBadgeColor = (badge: string) => {
    if (badge.includes("Gold")) return "bg-yellow-600"
    if (badge.includes("Silver")) return "bg-gray-400"
    if (badge.includes("Bronze")) return "bg-amber-700"
    return "bg-purple-600"
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="space-y-4 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold mb-2">User not found</h2>
        <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="relative">
        <div className="h-48 rounded-xl bg-gradient-to-r from-purple-900 to-indigo-900" />

        <div className="flex flex-col md:flex-row gap-6 items-start -mt-16 md:px-6">
          <Avatar className="h-32 w-32 border-4 border-black">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="space-y-4 flex-1 pt-16 md:pt-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">@{user.email.split("@")[0]}</p>
              </div>

              {isOwnProfile && (
                <Button variant="outline" className="border-gray-800">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            {user.bio && <p className="text-muted-foreground">{user.bio}</p>}

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-gray-900/50 px-4 py-2 rounded-lg">
                <Award className="h-5 w-5 text-purple-400" />
                <span className="font-medium">{user.reputation}</span>
                <span className="text-muted-foreground">reputation</span>
              </div>

              <div className="flex items-center gap-2 bg-gray-900/50 px-4 py-2 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                <span className="font-medium">{user.questionsCount}</span>
                <span className="text-muted-foreground">questions</span>
              </div>

              <div className="flex items-center gap-2 bg-gray-900/50 px-4 py-2 rounded-lg">
                <ArrowUp className="h-5 w-5 text-purple-400" />
                <span className="font-medium">{user.answersCount}</span>
                <span className="text-muted-foreground">answers</span>
              </div>

              <div className="flex items-center gap-2 bg-gray-900/50 px-4 py-2 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-400" />
                <span className="text-muted-foreground">
                  Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {user.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge, index) => (
                  <Badge key={index} className={`${getBadgeColor(badge)} hover:${getBadgeColor(badge)}`}>
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs for questions and answers */}
      <Tabs defaultValue="questions" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md bg-gray-900">
          <TabsTrigger value="questions" className="data-[state=active]:bg-purple-600">
            Questions ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="answers" className="data-[state=active]:bg-purple-600">
            Answers ({answers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-6 space-y-4">
          {questions.length > 0 ? (
            questions.map((question) => <QuestionCard key={question._id} question={question} />)
          ) : (
            <div className="text-center p-8 border border-dashed border-gray-800 rounded-lg">
              <p className="text-muted-foreground">No questions asked yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="answers" className="mt-6 space-y-6">
          {answers.length > 0 ? (
            answers.map((answer) => (
              <div key={answer._id} className="border border-gray-800 rounded-lg p-6 bg-gray-900/50">
                <div className="mb-4">
                  <Link to={`/question/${answer.question._id}`} className="text-lg font-medium hover:text-purple-400">
                    {answer.question.title}
                  </Link>
                </div>

                <div className="prose prose-invert max-w-none line-clamp-3 mb-4">
                  <p>{answer.content.substring(0, 200)}...</p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-gray-800 border-gray-700">
                      {answer.upvotes - answer.downvotes} votes
                    </Badge>
                    {answer.isAccepted && <Badge className="bg-green-700 hover:bg-green-700">Accepted</Badge>}
                  </div>

                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8 border border-dashed border-gray-800 rounded-lg">
              <p className="text-muted-foreground">No answers provided yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}