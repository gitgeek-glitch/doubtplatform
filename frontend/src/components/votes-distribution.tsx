"use client"

import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchLeaderboard } from "@/redux/slices/leaderboardSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUp, ArrowDown } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

export default function VotesDistribution() {
  const dispatch = useAppDispatch()
  const { totalUpvotes, totalDownvotes, loading, error } = useAppSelector((state) => state.leaderboard)
  const fetchAttempted = useRef(false)

  useEffect(() => {
    // Only fetch once per component mount and if not already loading
    if (!fetchAttempted.current && !loading) {
      fetchAttempted.current = true
      dispatch(fetchLeaderboard())
    }
  }, [dispatch, loading])

  // Prepare data for the pie chart
  const pieData = [
    { name: "Upvotes", value: totalUpvotes, color: "#9333ea" }, // Purple for upvotes
    { name: "Downvotes", value: totalDownvotes, color: "#e11d48" }, // Red for downvotes
  ]

  return (
    <Card className="votes-distribution-card">
      <CardHeader className="votes-distribution-header">
        <CardTitle className="votes-distribution-title">Votes Distribution</CardTitle>
      </CardHeader>
      <CardContent className="votes-distribution-content">
        {loading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Skeleton className="h-[180px] w-[180px] rounded-full" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-[200px] text-red-500">
            {error}
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
                  <span>{totalUpvotes} upvotes</span>
                </div>
                <div className="votes-distribution-stat">
                  <ArrowDown className="votes-distribution-icon votes-distribution-icon-down" />
                  <span>{totalDownvotes} downvotes</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}