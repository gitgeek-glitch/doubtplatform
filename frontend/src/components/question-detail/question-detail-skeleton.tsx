import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export function QuestionDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>

      <Separator className="bg-gray-300 dark:bg-gray-800" />

      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}