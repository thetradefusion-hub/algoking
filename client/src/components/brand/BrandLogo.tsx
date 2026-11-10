import { cn } from '@/lib/utils'

/** Full AlgoKing Ribbon wordmark — best on dark/navy surfaces. */
export function BrandLogo({
  className,
  imgClassName,
  size = 'md',
}: {
  className?: string
  imgClassName?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const heights = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-16',
  }

  return (
    <img
      src="/logo.png"
      alt="AlgoKing"
      className={cn(
        'w-auto max-w-full object-contain object-left',
        heights[size],
        imgClassName,
        className
      )}
    />
  )
}

/** Compact mark for tight nav / admin chrome. */
export function AppIcon({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="AlgoKing"
      className={cn('h-9 w-auto object-contain object-left', className)}
    />
  )
}
