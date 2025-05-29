import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchUserVotesDistribution } from "@/redux/thunks/usersThunks"
import { fetchLeaderboard } from "@/redux/thunks/leaderboardThunks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUp, ArrowDown, Users } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

// Component props to make it flexible for different use cases
interface VotesDistributionProps {
  // If true, shows community-wide stats instead of individual user stats
  communityView?: boolean;
  // If provided, will use this directly instead of fetching
  userData?: {
    answerUpvotes: number;
    answerDownvotes: number;
  };
}

export default function VotesDistribution({ 
  communityView = false,
  userData
}: VotesDistributionProps) {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  
  // Get user-specific data from users state
  const { 
    userVotesDistribution, 
    votesLoading  } = useAppSelector((state) => state.users)
  
  // Get community-wide data from leaderboard state
  const { totalUpvotes, totalDownvotes, loading: leaderboardLoading, lastFetched } = useAppSelector(
    (state) => state.leaderboard
  )

  // Determine if we're in profile mode or community mode
  const isProfileMode = !communityView && !!id

  useEffect(() => {
    // If in profile mode, fetch that specific user's votes
    if (isProfileMode && !userData) {
      dispatch(fetchUserVotesDistribution(id))
    } 
    // If in community mode or no ID is available, fetch community-wide stats
    else if (communityView && (!lastFetched || Date.now() - lastFetched > 5 * 60 * 1000)) {
      dispatch(fetchLeaderboard())
    }
  }, [dispatch, isProfileMode, id, communityView, lastFetched, userData])

  // Use provided userData if available, otherwise use data from the store
  const votesData = userData || userVotesDistribution

  // Prepare data for the chart based on the mode
 // In votes-distribution.tsx - modify these lines around line 70-75
// Fix the getChartData function that prepares pie chart data

const getChartData = () => {
  // Check if we're in profile mode and we have data either from props or store
  if (isProfileMode) {
    const data = userData || userVotesDistribution;
    if (data) {
      return [
        { name: "Answer Upvotes", value: Number(data.answerUpvotes) || 0, color: "#9333ea" },
        { name: "Answer Downvotes", value: Number(data.answerDownvotes) || 0, color: "#e11d48" },
      ];
    }
  } else if (!isProfileMode) {
    // Community-wide data
    return [
      { name: "Total Upvotes", value: totalUpvotes, color: "#9333ea" },
      { name: "Total Downvotes", value: totalDownvotes, color: "#e11d48" },
    ];
  }
  return [];
};
// Near the beginning of the component function
console.log("VotesDistribution props:", { communityView, userData });
console.log("Store data:", { userVotesDistribution, votesLoading });

  const pieData = getChartData()
  
  // Calculate total votes based on the mode
  const totalVotes = isProfileMode
  ? (userData?.answerUpvotes || 0) + (userData?.answerDownvotes || 0) || 
    (userVotesDistribution?.answerUpvotes || 0) + (userVotesDistribution?.answerDownvotes || 0)
  : totalUpvotes + totalDownvotes;

  // Determine if we're in a loading state
  const isLoading = (!userData && isProfileMode) ? votesLoading : leaderboardLoading
  
  // Determine if we have data
  const hasData = isProfileMode ? !!votesData : (totalUpvotes > 0 || totalDownvotes > 0)

  console.log("Final data we're using:", {
  isProfileMode,
  userData,
  votesData,
  pieData,
  totalVotes
  });

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
              <div className="votes-distribution-stat">
                <ArrowUp className="votes-distribution-icon votes-distribution-icon-up" />
                <span>
                  {isProfileMode
                    ? `${(userData?.answerUpvotes || userVotesDistribution?.answerUpvotes || 0)} upvotes`
                    : `${totalUpvotes} upvotes`}
                </span>
              </div>
              <div className="votes-distribution-stat">
                <ArrowDown className="votes-distribution-icon votes-distribution-icon-down" />
                <span>
                  {isProfileMode
                    ? `${(userData?.answerDownvotes || userVotesDistribution?.answerDownvotes || 0)} downvotes`
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