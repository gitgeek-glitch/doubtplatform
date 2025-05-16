"use client"

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchUserVotesDistribution } from "@/redux/slices/usersSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUp, ArrowDown } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

export default function VotesDistribution() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { userVotesDistribution, votesLoading } = useAppSelector((state) => state.users)
  const [fetchAttempted, setFetchAttempted] = useState(false)

  useEffect(() => {
    // Only fetch once per component mount and if not already loading and if we have a userId
    if (!fetchAttempted && !votesLoading && id) {
      setFetchAttempted(true)
      dispatch(fetchUserVotesDistribution(id))
    }
  }, [dispatch, votesLoading, id, fetchAttempted])

  // Prepare data for the pie chart - showing only answer votes for now
  const pieData = userVotesDistribution ? [
    { name: "Answer Upvotes", value: userVotesDistribution.answerUpvotes, color: "#9333ea" }, // Purple for upvotes
    { name: "Answer Downvotes", value: userVotesDistribution.answerDownvotes, color: "#e11d48" }, // Red for downvotes
  ] : []

  const totalVotes = userVotesDistribution ? 
    userVotesDistribution.answerUpvotes + userVotesDistribution.answerDownvotes : 0

  return (
    <Card className="votes-distribution-card">
      <CardHeader className="votes-distribution-header">
        <CardTitle className="votes-distribution-title">User Votes Distribution</CardTitle>
      </CardHeader>
      <CardContent className="votes-distribution-content">
        {votesLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Skeleton className="h-[180px] w-[180px] rounded-full" />
          </div>
        ) : !userVotesDistribution ? (
          <div className="flex justify-center items-center h-[200px] text-muted-foreground">No vote data available</div>
        ) : totalVotes === 0 ? (
          <div className="flex justify-center items-center h-[200px] text-muted-foreground">No votes received yet</div>
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
                      backgroundColor: "rgba(23, 23, 23, 0.9)",
                      borderColor: "#333",
                      borderRadius: "0.5rem",
                      color: "#fff",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span style={{ color: "#fff" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="votes-distribution-stats">
                <div className="votes-distribution-stat">
                  <ArrowUp className="votes-distribution-icon votes-distribution-icon-up" />
                  <span>{userVotesDistribution.answerUpvotes} upvotes</span>
                </div>
                <div className="votes-distribution-stat">
                  <ArrowDown className="votes-distribution-icon votes-distribution-icon-down" />
                  <span>{userVotesDistribution.answerDownvotes} downvotes</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}