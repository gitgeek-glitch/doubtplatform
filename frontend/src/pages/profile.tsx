"use client"

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { resetUserState } from "@/redux/slices/usersSlice"
import { fetchUserProfile } from "@/redux/thunks/usersThunks"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileTabs from "@/components/profile/ProfileTabs"
import VotesDistribution from "@/components/votes-distribution"

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const {
    currentProfile: user,
    userQuestions: questions,
    userAnswers: answers,
    userVotesDistribution,
    loading,
  } = useAppSelector((state) => state.users)
  const { user: currentUser } = useAppSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState("questions")

  const isOwnProfile = currentUser?._id === id

  useEffect(() => {
    if (id) {
      dispatch(fetchUserProfile(id))
    }

    return () => {
      dispatch(resetUserState())
    }
  }, [id, dispatch])

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
      <ProfileHeader 
        user={user} 
        isOwnProfile={isOwnProfile} 
        userVotesDistribution={userVotesDistribution}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ProfileTabs 
            questions={questions}
            answers={answers}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        <div className="md:col-span-1">
          <VotesDistribution
            communityView={false}
            userData={userVotesDistribution ? {
              answerUpvotes: userVotesDistribution.answerUpvotes,
              answerDownvotes: userVotesDistribution.answerDownvotes
            } : {
              answerUpvotes: 0,
              answerDownvotes: 0
            }}
          />
        </div>
      </div>
    </div>
  )
}