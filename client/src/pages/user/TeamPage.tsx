import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Check,
  Copy,
  Crown,
  Gift,
  HandCoins,
  Share2,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Badge'
import { fetchReferralSummary, fetchTeam } from '@/services/userService'
import { formatINR, formatShortDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const levelFilters = [
  { key: undefined as number | undefined, label: 'All' },
  { key: 1, label: 'L1' },
  { key: 2, label: 'L2' },
  { key: 3, label: 'L3' },
]

const levelTone = [
  { chip: 'bg-[#E7F1FF] text-brand-primary', bar: 'bg-brand-primary' },
  { chip: 'bg-[#E6F7EF] text-brand-success', bar: 'bg-brand-success' },
  { chip: 'bg-[#FFF4D6] text-[#B8860B]', bar: 'bg-brand-gold' },
]

function initials(name?: string) {
  if (!name) return 'M'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function TeamPage() {
  const [level, setLevel] = useState<number | undefined>(undefined)
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)

  const summary = useQuery({ queryKey: ['referral-summary'], queryFn: fetchReferralSummary })
  const team = useQuery({
    queryKey: ['team', level],
    queryFn: () => fetchTeam(level),
  })

  const commissionRules = summary.data?.commissionRules || []
  const maxPct = Math.max(...commissionRules.map((c: { percentage: number }) => c.percentage), 1)
  const members = team.data?.data || []

  const flashCopy = (kind: 'link' | 'code') => {
    setCopied(kind)
    setTimeout(() => setCopied(null), 1500)
  }

  const copyLink = async () => {
    if (!summary.data?.referralLink) return
    await navigator.clipboard.writeText(summary.data.referralLink)
    flashCopy('link')
    toast.success('Referral link copied')
  }

  const copyCode = async () => {
    if (!summary.data?.referralCode) return
    await navigator.clipboard.writeText(summary.data.referralCode)
    flashCopy('code')
    toast.success('Referral code copied')
  }

  const shareLink = async () => {
    if (!summary.data?.referralLink) return
    if (navigator.share) {
      await navigator.share({
        title: 'AlgoKing',
        text: 'Join AlgoKing',
        url: summary.data.referralLink,
      })
    } else {
      await copyLink()
    }
  }

  return (
    <div className="pb-2">
      {/* Hero */}
      <div className="brand-gradient relative overflow-hidden px-4 pb-7 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-gold/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 left-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <Crown className="pointer-events-none absolute -right-1 top-6 h-24 w-24 text-brand-gold/15" />

        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
            AlgoKing Team
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Refer & Earn</h1>
            <Gift className="h-5 w-5 text-brand-gold" />
          </div>

          {summary.isLoading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-14 rounded-2xl bg-white/15" />
              <Skeleton className="h-11 rounded-2xl bg-white/15" />
            </div>
          ) : (
            <>
              <div className="mt-4 rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-white/65">
                      Referral Code
                    </p>
                    <p className="mt-0.5 text-xl font-extrabold tracking-wider text-brand-gold">
                      {summary.data?.referralCode || '—'}
                    </p>
                  </div>
                  <button
                    onClick={copyCode}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 transition hover:bg-white/25"
                    aria-label="Copy referral code"
                  >
                    {copied === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 truncate text-[11px] text-white/60">{summary.data?.referralLink}</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={shareLink}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-white text-sm font-semibold text-brand-primary shadow-sm"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <button
                  onClick={copyLink}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-white/35 bg-white/10 text-sm font-semibold text-white"
                >
                  {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy Link
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative z-10 -mt-4 space-y-4 px-4">
        {/* Overview stats */}
        {summary.isLoading ? (
          <Skeleton className="h-36 rounded-[18px]" />
        ) : (
          <div className="ak-card p-4 shadow-[0_12px_28px_rgba(0,27,61,0.08)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-brand-text">Team Overview</h2>
              <Users className="h-4 w-4 text-brand-primary" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-brand-bg p-3 text-center">
                <span className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <UsersRound className="h-4 w-4" />
                </span>
                <p className="text-[10px] text-brand-muted">Total</p>
                <p className="mt-0.5 text-xl font-extrabold text-brand-primary">
                  {summary.data?.totalTeamMembers || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-brand-bg p-3 text-center">
                <span className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#E6F7EF] text-brand-success">
                  <UserRound className="h-4 w-4" />
                </span>
                <p className="text-[10px] text-brand-muted">Active</p>
                <p className="mt-0.5 text-xl font-extrabold text-brand-success">
                  {summary.data?.activeMembers || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-brand-bg p-3 text-center">
                <span className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF4D6] text-[#B8860B]">
                  <HandCoins className="h-4 w-4" />
                </span>
                <p className="text-[10px] text-brand-muted">Income</p>
                <p className="mt-0.5 text-[13px] font-extrabold leading-tight text-brand-text">
                  {formatINR(summary.data?.totalReferralIncome)}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'Level 1', value: summary.data?.levels?.level1 || 0, tone: levelTone[0].chip },
                { label: 'Level 2', value: summary.data?.levels?.level2 || 0, tone: levelTone[1].chip },
                { label: 'Level 3', value: summary.data?.levels?.level3 || 0, tone: levelTone[2].chip },
              ].map((item) => (
                <div key={item.label} className={cn('rounded-2xl p-3 text-center', item.tone)}>
                  <p className="text-[10px] font-medium opacity-80">{item.label}</p>
                  <p className="mt-0.5 text-lg font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commission */}
        <div className="ak-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-brand-text">Commission</h2>
            <Crown className="h-4 w-4 text-brand-gold" />
          </div>
          {commissionRules.length ? (
            <div className="space-y-2.5">
              {commissionRules.map((c: { level: number; percentage: number }, idx: number) => {
                const tone = levelTone[(c.level - 1) % levelTone.length] || levelTone[0]
                const width = Math.max((c.percentage / maxPct) * 100, 12)
                return (
                  <div key={c.level} className="rounded-2xl bg-brand-bg p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-xl text-[11px] font-bold',
                            tone.chip
                          )}
                        >
                          L{c.level}
                        </span>
                        <span className="text-sm font-semibold text-brand-text">Level {c.level}</span>
                      </div>
                      <span className="text-sm font-extrabold text-brand-primary">{c.percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className={cn('h-full rounded-full transition-all', tone.bar)}
                        style={{ width: `${width}%`, animationDelay: `${idx * 80}ms` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-brand-muted">No commission rules yet.</p>
          )}
        </div>

        {/* Members */}
        <div>
          <div className="mb-2 flex items-center justify-between px-0.5">
            <h2 className="text-sm font-bold text-brand-text">Team Members</h2>
            <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
              {members.length} shown
            </span>
          </div>

          <div className="ak-card mb-3 flex gap-1.5 overflow-x-auto p-1.5">
            {levelFilters.map((f) => {
              const active = level === f.key
              return (
                <button
                  key={String(f.key)}
                  onClick={() => setLevel(f.key)}
                  className={cn(
                    'flex min-w-[64px] flex-1 items-center justify-center rounded-2xl px-3 py-2.5 text-xs font-semibold transition',
                    active
                      ? 'brand-gradient text-white shadow-[0_8px_18px_rgba(0,102,255,0.28)]'
                      : 'text-brand-muted hover:bg-brand-bg'
                  )}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {team.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-[18px]" />
              <Skeleton className="h-16 rounded-[18px]" />
            </div>
          ) : members.length ? (
            <div className="space-y-2">
              {members.map(
                (item: {
                  _id: string
                  level: number
                  member?: { fullName: string; status: string; createdAt: string; referralCode?: string }
                }) => {
                  const tone = levelTone[(item.level - 1) % levelTone.length] || levelTone[0]
                  return (
                    <div
                      key={item._id}
                      className="ak-card flex items-center gap-3 p-3.5 transition hover:-translate-y-0.5"
                    >
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold',
                          tone.chip
                        )}
                      >
                        {initials(item.member?.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-brand-text">
                            {item.member?.fullName || 'Member'}
                          </p>
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                              tone.chip
                            )}
                          >
                            L{item.level}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-brand-muted">
                          Joined {formatShortDate(item.member?.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={item.member?.status || 'inactive'} />
                    </div>
                  )
                }
              )}
            </div>
          ) : (
            <EmptyState title="No team members yet" description="Share your referral link to grow your team." />
          )}
        </div>
      </div>
    </div>
  )
}
