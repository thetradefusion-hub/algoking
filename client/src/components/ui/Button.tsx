import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'brand-gradient text-white shadow-[0_10px_24px_rgba(0,102,255,0.28)] hover:brightness-110',
        secondary: 'brand-accent-gradient text-brand-dark hover:brightness-105',
        outline: 'border-2 border-brand-primary/25 bg-white text-brand-primary hover:bg-brand-bg',
        ghost: 'text-brand-text hover:bg-black/5',
        danger: 'bg-brand-danger text-white hover:brightness-110',
        soft: 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-11 px-4',
        lg: 'h-12 px-5 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : null}
      {children}
    </button>
  )
}
