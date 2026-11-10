import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

export function QuickActionButton({
  to,
  label,
  icon: Icon,
}: {
  to: string
  label: string
  icon: LucideIcon
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-[16px] bg-white p-3 text-center shadow-[0_8px_24px_rgba(23,19,29,0.04)] transition hover:-translate-y-0.5"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-xs font-semibold text-brand-text">{label}</span>
    </Link>
  )
}
