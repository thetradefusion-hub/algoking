import { cn } from '@/lib/utils'

const tones: Record<string, string> = {
  success: 'bg-brand-success/10 text-brand-success',
  warning: 'bg-brand-warning/15 text-[#9a6510]',
  danger: 'bg-brand-danger/10 text-brand-danger',
  info: 'bg-brand-accent/10 text-brand-accent',
  muted: 'bg-brand-bg text-brand-muted',
  active: 'bg-brand-success/10 text-brand-success',
  pending: 'bg-brand-warning/15 text-[#9a6510]',
  completed: 'bg-brand-primary/10 text-brand-primary',
  rejected: 'bg-brand-danger/10 text-brand-danger',
  blocked: 'bg-brand-danger/10 text-brand-danger',
  approved: 'bg-brand-success/10 text-brand-success',
  processing: 'bg-blue-50 text-blue-700',
  open: 'bg-brand-accent/10 text-brand-accent',
  inactive: 'bg-brand-bg text-brand-muted',
  archived: 'bg-brand-bg text-brand-muted',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status?.toLowerCase?.() || 'muted'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize',
        tones[key] || tones.muted,
        className
      )}
    >
      {status?.replaceAll('_', ' ')}
    </span>
  )
}
