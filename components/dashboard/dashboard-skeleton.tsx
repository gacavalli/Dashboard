import {
  CHART_HEIGHT,
  CONTROL_HEIGHT,
  DASHBOARD_CARD,
} from "@/components/dashboard/card-style"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function FiltersSkeleton() {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <Skeleton className={cn(CONTROL_HEIGHT, "w-full sm:w-96")} />
      <Skeleton className={cn(CONTROL_HEIGHT, "w-[36rem] max-w-full")} />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-7">
      <div className="grid gap-5 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Card key={index} className={DASHBOARD_CARD}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-10 w-44" />
              <Skeleton className="h-5 w-52" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Card key={index} className={DASHBOARD_CARD}>
            <CardHeader className="gap-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-52" />
            </CardHeader>
            <CardContent>
              <Skeleton className={cn(CHART_HEIGHT, "w-full")} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
