import { Link } from 'react-router-dom'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

const labels: Record<string, string> = {
  main: 'Main Wallet',
  income: 'Income Wallet',
  referral: 'Referral Wallet',
}

export function WalletBalanceCard({
  type,
  balance,
  className,
}: {
  type: string
  balance: number
  className?: string
}) {
  return (
    <Link
      to={`/wallet/${type}`}
      className={cn(
        'block rounded-[16px] bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/15',
        className
      )}
    >
      <p className="text-[11px] uppercase tracking-wide text-white/60">{labels[type] || type}</p>
      <p className="mt-1 text-lg font-bold">{formatINR(balance)}</p>
    </Link>
  )
}
