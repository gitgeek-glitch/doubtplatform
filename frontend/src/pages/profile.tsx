"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Award, Calendar, Edit, ArrowUp } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import QuestionCard from "@/components/question-card"
import { cn } from "@/lib/utils"

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
    if (badge.includes("Gold")) return "profile-badge-gold"
    if (badge.includes("Silver")) return "profile-badge-silver"
    if (badge.includes("Bronze")) return "profile-badge-bronze"
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
        <div className="profile-header-banner" />

        <div className="profile-header-content">
          <Avatar className="profile-avatar">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="profile-info">
            <div className="profile-name-row">
              <div>
                <h1 className="profile-name">{user.name}</h1>
                <p className="profile-username">@{user.email.split("@")[0]}</p>
              </div>

              {isOwnProfile && (
                <Button variant="outline" className="profile-edit-button">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            {user.bio && <p className="profile-bio">{user.bio}</p>}

            <div className="profile-stats">
              <div className="profile-stat">
                <Award className="profile-stat-icon" />
                <span className="profile-stat-value">{user.reputation}</span>
                <span className="profile-stat-label">reputation</span>
              </div>

              <div className="profile-stat">
                <MessageSquare className="profile-stat-icon" />
                <span className="profile-stat-value">{user.questionsCount}</span>
                <span className="profile-stat-label">questions</span>
              </div>

              <div className="profile-stat">
                <ArrowUp className="profile-stat-icon" />
                <span className="profile-stat-value">{user.answersCount}</span>
                <span className="profile-stat-label">answers</span>
              </div>

              <div className="profile-stat">
                <Calendar className="profile-stat-icon" />
                <span className="profile-stat-label">
                  Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {user.badges.length > 0 && (
              <div className="profile-badges">
                {user.badges.map((badge, index) => (
                  <Badge key={index} className={getBadgeColor(badge)}>
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
        <TabsList className="profile-tabs-list">
          <TabsTrigger 
            value="questions" 
            className={cn(activeTab === "questions" && "profile-tab-active")}
          >
            Questions ({questions.length})
          </TabsTrigger>
          <TabsTrigger 
            value="answers" 
            className={cn(activeTab === "answers" && "profile-tab-active")}
          >
            Answers ({answers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="profile-content">
          {questions.length > 0 ? (
            questions.map((question) => <QuestionCard key={question._id} question={question} />)
          ) : (
            <div className="profile-empty-state">
              <p className="text-muted-foreground">No questions asked yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="answers" className="profile-content">
          {answers.length > 0 ? (
            answers.map((answer) => (
              <div key={answer._id} className="profile-answer-card">
                <div className="mb-4">
                  <Link to={`/question/${answer.question._id}`} className="profile-answer-title">
                    {answer.question.title}
                  </Link>
                </div>

                <div className="profile-answer-content">
                  <p>{answer.content.substring(0, 200)}...</p>
                </div>

                <div className="profile-answer-meta">
                  <div className="profile-answer-stats">
                    <Badge variant="outline" className="profile-answer-badge">
                      {answer.upvotes - answer.downvotes} votes
                    </Badge>
                    {answer.isAccepted && <Badge className="profile-answer-accepted">Accepted</Badge>}
                  </div>

                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="profile-empty-state">
              <p className="text-muted-foreground">No answers provided yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
