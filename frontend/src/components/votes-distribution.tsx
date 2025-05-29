"use client"

import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchUserVotesDistribution } from "@/redux/thunks/usersThunks"
import { fetchLeaderboard } from "@/redux/thunks/leaderboardThunks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUp, ArrowDown, Users } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface VotesDistributionProps {
  communityView?: boolean
  userData?: {
    answerUpvotes: number
    answerDownvotes: number
  }
}

export default function VotesDistribution({ communityView = false, userData }: VotesDistributionProps) {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()

  const { userVotesDistribution, votesLoading } = useAppSelector((state) => state.users)

  const {
    totalUpvotes,
    totalDownvotes,
    loading: leaderboardLoading,
    lastFetched,
  } = useAppSelector((state) => state.leaderboard)

  const isProfileMode = !communityView && !!id

  useEffect(() => {
    if (isProfileMode && !userData) {
      dispatch(fetchUserVotesDistribution(id))
    } else if (communityView && (!lastFetched || Date.now() - lastFetched > 5 * 60 * 1000)) {
      dispatch(fetchLeaderboard())
    }
  }, [dispatch, isProfileMode, id, communityView, lastFetched, userData])

  const votesData = userData || userVotesDistribution

  const getChartData = () => {
    if (isProfileMode) {
      const data = userData || userVotesDistribution
      if (data) {
        return [
          { name: "Answer Upvotes", value: Number(data.answerUpvotes) || 0, color: "hsl(var(--chart-1))" },
          { name: "Answer Downvotes", value: Number(data.answerDownvotes) || 0, color: "hsl(var(--destructive))" },
        ]
      }
    } else if (!isProfileMode) {
      return [
        { name: "Total Upvotes", value: totalUpvotes, color: "hsl(var(--chart-1))" },
        { name: "Total Downvotes", value: totalDownvotes, color: "hsl(var(--destructive))" },
      ]
    }
    return []
  }

  const pieData = getChartData()

  const totalVotes = isProfileMode
    ? (userData?.answerUpvotes || 0) + (userData?.answerDownvotes || 0) ||
      (userVotesDistribution?.answerUpvotes || 0) + (userVotesDistribution?.answerDownvotes || 0)
    : totalUpvotes + totalDownvotes

  const isLoading = !userData && isProfileMode ? votesLoading : leaderboardLoading
  const hasData = isProfileMode ? !!votesData : totalUpvotes > 0 || totalDownvotes > 0

  return (
    <Card className="votes-distribution-card">
      <CardHeader className="votes-distribution-header">
        <CardTitle className="votes-distribution-title">
          {isProfileMode ? "User Votes Distribution" : "Community Votes Distribution"}
        </CardTitle>
      </CardHeader>
      <CardContent className="votes-distribution-content">
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Skeleton className="h-[180px] w-[180px] rounded-full" />
          </div>
        ) : !hasData ? (
          <div className="flex justify-center items-center h-[200px] text-muted-foreground">
            {isProfileMode ? "No vote data available" : "No community votes data available"}
          </div>
        ) : totalVotes === 0 ? (
          <div className="flex justify-center items-center h-[200px] text-muted-foreground">
            {isProfileMode ? "No votes received yet" : "No votes recorded in the community yet"}
          </div>
        ) : (
          <>
            <div className="votes-distribution-chart">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} votes`, ""]}
                    contentStyle={{
                      backgroundColor: "var(--tooltip-background)",
                      borderColor: "var(--tooltip-border)",
                      borderRadius: "0.5rem",
                      color: "var(--tooltip-foreground)",
                      border: "1px solid var(--tooltip-border)",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="votes-distribution-stat">
                <ArrowUp className="votes-distribution-icon votes-distribution-icon-up" />
                <span>
                  {isProfileMode
                    ? `${userData?.answerUpvotes || userVotesDistribution?.answerUpvotes || 0} upvotes`
                    : `${totalUpvotes} upvotes`}
                </span>
              </div>
              <div className="votes-distribution-stat">
                <ArrowDown className="votes-distribution-icon votes-distribution-icon-down" />
                <span>
                  {isProfileMode
                    ? `${userData?.answerDownvotes || userVotesDistribution?.answerDownvotes || 0} downvotes`
                    : `${totalDownvotes} downvotes`}
                </span>
              </div>
              {!isProfileMode && (
                <div className="votes-distribution-stat mt-2">
                  <Users className="votes-distribution-icon" />
                  <span className="text-sm text-muted-foreground">Community statistics</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
