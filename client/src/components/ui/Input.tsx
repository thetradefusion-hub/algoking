import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id || props.name
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-semibold text-brand-text">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          'h-12 w-full rounded-2xl border border-brand-primary/10 bg-brand-bg/60 px-4 text-sm text-brand-text outline-none transition placeholder:text-brand-muted focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/15',
          error && 'border-brand-danger focus:border-brand-danger focus:ring-brand-danger/20',
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-brand-danger">{error}</span> : null}
    </label>
  )
}
