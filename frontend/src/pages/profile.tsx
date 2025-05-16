"use client"

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchUserProfile, resetUserState } from "@/redux/slices/usersSlice"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Award, Calendar, Edit, ArrowUp, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"
import QuestionCard from "@/components/question-card"
import { cn } from "@/lib/utils"
import VotesDistribution from "@/components/votes-distribution"

// Role thresholds - match with backend User.js model
const ROLE_THRESHOLDS = {
  NEWBIE: 0,       // 0-99 answer upvotes
  INTERMEDIATE: 100, // 100-499 answer upvotes
  EXPERT: 500,     // 500-999 answer upvotes
  MASTER: 1000     // 1000+ answer upvotes
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { 
    currentProfile: user, 
    userQuestions: questions, 
    userAnswers: answers, 
    userVotesDistribution,
    loading 
  } = useAppSelector(state => state.users)
  const { user: currentUser } = useAppSelector(state => state.auth)
  const [activeTab, setActiveTab] = useState("questions")

  const isOwnProfile = currentUser?._id === id

  useEffect(() => {
    if (id) {
      dispatch(fetchUserProfile(id))
    }
    
    // Cleanup on unmount
    return () => {
      dispatch(resetUserState())
    }
  }, [id, dispatch])

  // Badge colors based on level
  const getBadgeColor = (badge: string): string => {
    if (badge.includes("Gold")) return "profile-badge-gold"
    if (badge.includes("Silver")) return "profile-badge-silver"
    if (badge.includes("Bronze")) return "profile-badge-bronze"
    return "bg-purple-600"
  }

  // Get role badge color
  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case "Master":
        return "bg-amber-500 text-white";
      case "Expert":
        return "bg-blue-500 text-white";
      case "Intermediate":
        return "bg-green-500 text-white";
      case "Newbie":
      default:
        return "bg-gray-500 text-white";
    }
  }

  // Calculate progress towards next role
  const calculateRoleProgress = (): { progress: number; nextRole: string; upvotesNeeded: number } => {
    if (!user || !userVotesDistribution) return { progress: 0, nextRole: "Intermediate", upvotesNeeded: 100 };

    const upvotes = userVotesDistribution.answerUpvotes;
    
    if (upvotes >= ROLE_THRESHOLDS.MASTER) {
      return { progress: 100, nextRole: "Master", upvotesNeeded: 0 }; // Already at highest role
    } else if (upvotes >= ROLE_THRESHOLDS.EXPERT) {
      const progress = ((upvotes - ROLE_THRESHOLDS.EXPERT) / (ROLE_THRESHOLDS.MASTER - ROLE_THRESHOLDS.EXPERT)) * 100;
      return { 
        progress: Math.min(progress, 99), 
        nextRole: "Master", 
        upvotesNeeded: ROLE_THRESHOLDS.MASTER - upvotes 
      };
    } else if (upvotes >= ROLE_THRESHOLDS.INTERMEDIATE) {
      const progress = ((upvotes - ROLE_THRESHOLDS.INTERMEDIATE) / (ROLE_THRESHOLDS.EXPERT - ROLE_THRESHOLDS.INTERMEDIATE)) * 100;
      return { 
        progress: Math.min(progress, 99), 
        nextRole: "Expert", 
        upvotesNeeded: ROLE_THRESHOLDS.EXPERT - upvotes 
      };
    } else {
      const progress = (upvotes / ROLE_THRESHOLDS.INTERMEDIATE) * 100;
      return { 
        progress: Math.min(progress, 99), 
        nextRole: "Intermediate", 
        upvotesNeeded: ROLE_THRESHOLDS.INTERMEDIATE - upvotes 
      };
    }
  };

  const roleProgress = calculateRoleProgress();

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
                <div className="flex items-center gap-2 mt-1">
                  <p className="profile-username">@{user.email.split("@")[0]}</p>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                </div>
              </div>

              {isOwnProfile && (
                <Button variant="outline" className="profile-edit-button">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            {user.bio && <p className="profile-bio">{user.bio}</p>}

            {/* Role progress bar */}
            {user.role !== "Master" && userVotesDistribution && (
              <div className="mt-3 mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> 
                    Progress to {roleProgress.nextRole}
                  </span>
                  <span>{userVotesDistribution.answerUpvotes} / {user.role === "Newbie" ? 100 : user.role === "Intermediate" ? 500 : 1000}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-purple-600 h-2.5 rounded-full" 
                    style={{ width: `${roleProgress.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {roleProgress.upvotesNeeded} more answer upvotes needed for {roleProgress.nextRole} role
                </p>
              </div>
            )}

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

            {user.badges && user.badges.length > 0 && (
              <div className="profile-badges">
                {user.badges.map((badge: string, index: number) => (
                  <Badge key={index} className={getBadgeColor(badge)}>
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
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
                questions.map((question: any) => <QuestionCard key={question._id} question={question} />)
              ) : (
                <div className="profile-empty-state">
                  <p className="text-muted-foreground">No questions asked yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="answers" className="profile-content">
              {answers.length > 0 ? (
                answers.map((answer: any) => (
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
        
        {/* Right sidebar with votes distribution */}
        <div className="md:col-span-1">
          <VotesDistribution />
        </div>
      </div>
    </div>
  )
}