import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-brand-primary/8', className)} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  )
}
