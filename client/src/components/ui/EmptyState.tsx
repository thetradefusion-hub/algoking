import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string
  description?: string
  icon?: LucideIcon
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[16px] bg-white px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-bg text-brand-muted">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-brand-text">{title}</h3>
      {description ? <p className="mt-1 max-w-xs text-sm text-brand-muted">{description}</p> : null}
    </div>
  )
}
