"use client"

import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchLeaderboard } from "@/redux/thunks/leaderboardThunks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, ArrowUp } from "lucide-react"
import { Link } from "react-router-dom"

export default function TopContributors() {
  const dispatch = useAppDispatch()
  const { users, loading } = useAppSelector((state) => state.leaderboard)
  const fetchAttempted = useRef(false)

  useEffect(() => {
    if (!fetchAttempted.current && !loading) {
      fetchAttempted.current = true
      dispatch(fetchLeaderboard())
    }
  }, [dispatch, loading])

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
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="top-contributors-list">
            {users.slice(0, 5).map((user, index) => {
              return (
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
                  <div className="top-contributors-info flex items-center justify-between">
                    <div className="top-contributors-name">{user.name}</div>
                    <span className="top-contributors-upvotes flex items-center gap-1">
                      <ArrowUp className="top-contributors-vote-icon h-4 w-4" />
                      {user.upvotesReceived}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}