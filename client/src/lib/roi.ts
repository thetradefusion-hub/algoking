import type { InvestmentOrder } from '@/types'

const MS_PER_HOUR = 60 * 60 * 1000

export type RoiLiveMeta = {
  totalIncome: number
  totalHours: number
  paidHours: number
  totalIncomePaid: number
  hourlyIncome: number
  progressPct: number
  liveEarned: number
  hoursCompleted: number
  nextHourAt: string | null
  secondsToNextHour: number | null
}

export function getOrderRoiMeta(order: InvestmentOrder, now = Date.now()): RoiLiveMeta {
  const totalIncome = Number(
    order.totalIncome ?? order.projectedIncomeSnapshot ?? order.planSnapshot?.projectedTotalIncome ?? 0
  )
  const days = Math.max(1, Number(order.durationDays || order.planSnapshot?.durationDays || 1))
  const totalHours = Number(order.totalHours || days * 24)
  const paidHours = Number(order.paidHours || 0)
  const totalIncomePaid = Number(order.totalIncomePaid || 0)
  const start = order.startDate ? new Date(order.startDate).getTime() : now
  const end = order.endDate ? new Date(order.endDate).getTime() : start + totalHours * MS_PER_HOUR
  const elapsedMs = Math.min(Math.max(now - start, 0), Math.max(end - start, 0))
  const progressPct =
    end > start ? Math.min(100, Math.max(0, Number(((elapsedMs / (end - start)) * 100).toFixed(2)))) : 0
  const liveEarned =
    end > start
      ? Number(Math.min(totalIncome, (elapsedMs / (end - start)) * totalIncome).toFixed(4))
      : totalIncomePaid
  const hourlyIncome =
    Number(order.hourlyIncome) || (totalHours > 0 ? Number((totalIncome / totalHours).toFixed(6)) : 0)
  const hoursCompleted = Math.min(totalHours, Math.floor(elapsedMs / MS_PER_HOUR))
  const nextHourAt =
    order.status === 'active' && hoursCompleted < totalHours
      ? new Date(start + (hoursCompleted + 1) * MS_PER_HOUR).toISOString()
      : null
  const secondsToNextHour = nextHourAt
    ? Math.max(0, Math.ceil((new Date(nextHourAt).getTime() - now) / 1000))
    : null

  return {
    totalIncome,
    totalHours,
    paidHours,
    totalIncomePaid,
    hourlyIncome,
    progressPct,
    liveEarned,
    hoursCompleted,
    nextHourAt,
    secondsToNextHour,
  }
}

export function formatCountdown(totalSeconds: number | null) {
  if (totalSeconds == null) return '—'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
