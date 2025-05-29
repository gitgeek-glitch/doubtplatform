import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Calendar, Edit, ArrowUp, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { generateAvatar } from "@/lib/avatar"

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

export default function ProfileHeader({ user, isOwnProfile, userVotesDistribution }: ProfileHeaderProps) {
  const getBadgeColor = (badge: string): string => {
    if (badge.includes("Gold")) return "profile-badge-gold"
    if (badge.includes("Silver")) return "profile-badge-silver"
    if (badge.includes("Bronze")) return "profile-badge-bronze"
    return "bg-purple-600"
  }

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case "Master":
        return "bg-amber-500 text-white"
      case "Expert":
        return "bg-blue-500 text-white"
      case "Intermediate":
        return "bg-green-500 text-white"
      case "Newbie":
      default:
        return "bg-gray-500 text-white"
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
  const avatarSrc = generateAvatar(user.email, true)

  return (
    <div className="relative">
      <div className="profile-header-banner" />

      <div className="profile-header-content">
        <div className="profile-avatar">
          <img 
            src={avatarSrc} 
            alt={user.name}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
          />
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <div>
              <h1 className="profile-name text-white">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="profile-username text-white">@{user.email.split("@")[0]}</p>
                <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
              </div>
            </div>

            {isOwnProfile && (
              <Button variant="outline" className="profile-edit-button text-white">
                <Edit className="h-4 w-4 mr-2 text-white" />
                Edit Profile
              </Button>
            )}
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
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5">
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
  )
}