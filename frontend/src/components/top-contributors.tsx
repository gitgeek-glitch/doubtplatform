"use client"

import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchLeaderboard } from "@/redux/slices/leaderboardSlice"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Trophy, ArrowUp } from "lucide-react"
import { Link } from "react-router-dom"

export default function TopContributors() {
  const dispatch = useAppDispatch()
  const { users, loading } = useAppSelector((state) => state.leaderboard)
  const fetchAttempted = useRef(false)

  useEffect(() => {
    // Only fetch once per component mount and if not already loading
    if (!fetchAttempted.current && !loading) {
      fetchAttempted.current = true
      dispatch(fetchLeaderboard())
    }
  }, [dispatch, loading])

  // Helper function to get role badge color
  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case "Master":
        return "bg-amber-500 hover:bg-amber-600";
      case "Expert":
        return "bg-blue-500 hover:bg-blue-600";
      case "Intermediate":
        return "bg-green-500 hover:bg-green-600";
      case "Newbie":
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  }

  return (
    <Card className="top-contributors-card">
      <CardHeader className="top-contributors-header">
        <CardTitle className="top-contributors-title">
          <Trophy className="top-contributors-icon" />
          Top Answer Contributors
        </CardTitle>
      </CardHeader>
      <CardContent className="top-contributors-content">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="top-contributors-list">
            {users.slice(0, 5).map((user, index) => (
              <Link to={`/profile/${user._id}`} key={user._id} className="top-contributors-item">
                <div className="top-contributors-rank">
                  {index === 0 ? (
                    <span className="top-contributors-rank-gold">{index + 1}</span>
                  ) : index === 1 ? (
                    <span className="top-contributors-rank-silver">{index + 1}</span>
                  ) : index === 2 ? (
                    <span className="top-contributors-rank-bronze">{index + 1}</span>
                  ) : (
                    <span className="top-contributors-rank-normal">{index + 1}</span>
                  )}
                </div>
                <Avatar className="top-contributors-avatar">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="top-contributors-info">
                  <div className="top-contributors-name">{user.name}</div>
                  <div className="top-contributors-stats">
                    <span className="top-contributors-upvotes">
                      <ArrowUp className="top-contributors-vote-icon" />
                      {user.upvotesReceived}
                    </span>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}