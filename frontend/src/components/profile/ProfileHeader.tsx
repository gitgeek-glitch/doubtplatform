"use client"

import { Badge } from "@/components/ui/badge"
import { MessageSquare, Calendar, ArrowUp, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { generateAvatar } from "@/lib/avatar"
import { useTheme } from "@/components/theme-provider"

const ROLE_THRESHOLDS = {
  NEWBIE: 0,
  INTERMEDIATE: 100,
  EXPERT: 500,
  MASTER: 1000,
}

interface ProfileHeaderProps {
  user: any
  isOwnProfile: boolean
  userVotesDistribution: any
}

export default function ProfileHeader({ user, userVotesDistribution }: ProfileHeaderProps) {
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"
  const avatarSrc = user?.email ? generateAvatar(user.email, isDarkMode) : null

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case "Master":
        return "bg-amber-500 text-white hover:bg-amber-500"
      case "Expert":
        return "bg-teal-500 text-white hover:bg-teal-500"
      case "Intermediate":
        return "bg-emerald-500 text-white hover:bg-emerald-500"
      case "Newbie":
      default:
        return "bg-muted text-muted-foreground hover:bg-muted"
    }
  }

  const calculateRoleProgress = (): { progress: number; nextRole: string; upvotesNeeded: number } => {
    if (!user || !userVotesDistribution) return { progress: 0, nextRole: "Intermediate", upvotesNeeded: 100 }

    const upvotes = userVotesDistribution.answerUpvotes

    if (upvotes >= ROLE_THRESHOLDS.MASTER) {
      return { progress: 100, nextRole: "Master", upvotesNeeded: 0 }
    } else if (upvotes >= ROLE_THRESHOLDS.EXPERT) {
      const progress = ((upvotes - ROLE_THRESHOLDS.EXPERT) / (ROLE_THRESHOLDS.MASTER - ROLE_THRESHOLDS.EXPERT)) * 100
      return {
        progress: Math.min(progress, 99),
        nextRole: "Master",
        upvotesNeeded: ROLE_THRESHOLDS.MASTER - upvotes,
      }
    } else if (upvotes >= ROLE_THRESHOLDS.INTERMEDIATE) {
      const progress =
        ((upvotes - ROLE_THRESHOLDS.INTERMEDIATE) / (ROLE_THRESHOLDS.EXPERT - ROLE_THRESHOLDS.INTERMEDIATE)) * 100
      return {
        progress: Math.min(progress, 99),
        nextRole: "Expert",
        upvotesNeeded: ROLE_THRESHOLDS.EXPERT - upvotes,
      }
    } else {
      const progress = (upvotes / ROLE_THRESHOLDS.INTERMEDIATE) * 100
      return {
        progress: Math.min(progress, 99),
        nextRole: "Intermediate",
        upvotesNeeded: ROLE_THRESHOLDS.INTERMEDIATE - upvotes,
      }
    }
  }

  const roleProgress = calculateRoleProgress()

  return (
    <div className="relative">
      <div className="profile-header-banner" />

      <div className="profile-header-content">
        <div className="profile-avatar">
          <img
            src={avatarSrc || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&size=128`}
            alt={user.name}
            className="w-full h-full rounded-full border-4 border-background shadow-lg object-cover"
          />
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <div>
              <h1 className="profile-name">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="profile-username">@{user.email.split("@")[0]}</p>
                <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
              </div>
            </div>
          </div>

          {user.bio && <p className="profile-bio">{user.bio}</p>}

          {user.role !== "Master" && userVotesDistribution && (
            <div className="mt-3 mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Progress to {roleProgress.nextRole}
                </span>
                <span>
                  {userVotesDistribution.answerUpvotes} /{" "}
                  {user.role === "Newbie" ? 100 : user.role === "Intermediate" ? 500 : 1000}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
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
        </div>
      </div>
    </div>
  )
}
