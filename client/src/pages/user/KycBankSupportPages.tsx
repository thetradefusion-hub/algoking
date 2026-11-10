import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  Headset,
  Landmark,
  LifeBuoy,
  Mail,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Star,
  Ticket,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  addBank,
  createTicket,
  deleteBank,
  fetchBanks,
  fetchKyc,
  fetchNotifications,
  fetchTicket,
  fetchPublicSettings,
  fetchTickets,
  markAllNotificationsRead,
  markNotificationRead,
  replyTicket,
  submitKyc,
} from '@/services/userService'
import { getErrorMessage } from '@/services/api'
import { formatDate } from '@/lib/format'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const kycSteps = [
  { key: 'not_submitted', label: 'Submit', icon: FileText },
  { key: 'pending', label: 'Review', icon: Clock3 },
  { key: 'approved', label: 'Verified', icon: CheckCircle2 },
]

function stepIndex(status: string) {
  if (status === 'approved') return 2
  if (status === 'pending') return 1
  if (status === 'rejected') return 0
  return 0
}

export function KycPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['kyc'], queryFn: fetchKyc })
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      fullName: '',
      panNumber: '',
      bankAccountHolder: '',
      bankAccountNumber: '',
      ifscCode: '',
    },
  })
  const mutation = useMutation({
    mutationFn: submitKyc,
    onSuccess: async () => {
      toast.success('KYC submitted')
      await qc.invalidateQueries({ queryKey: ['kyc'] })
      await qc.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const status = data?.status || 'not_submitted'
  const canSubmit = status === 'not_submitted' || status === 'rejected'
  const activeStep = stepIndex(status)

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-40 rounded-[18px]" />
        <Skeleton className="h-56 rounded-[18px]" />
      </div>
    )
  }

  return (
    <div className="pb-2">
      {/* Hero */}
      <div className="brand-gradient relative overflow-hidden px-4 pb-8 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-gold/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10">
          <Link to="/profile" className="text-sm font-semibold text-white/80">
            ← Profile
          </Link>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                AlgoKing Security
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight">KYC Verification</h1>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
              <ShieldCheck className="h-6 w-6 text-brand-gold" />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            {kycSteps.map((step, idx) => {
              const Icon = step.icon
              const done = idx < activeStep || status === 'approved'
              const current = idx === activeStep && status !== 'approved'
              return (
                <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full ring-2 transition',
                      done || status === 'approved'
                        ? 'bg-brand-gold text-brand-dark ring-brand-gold/40'
                        : current
                          ? 'bg-white text-brand-primary ring-white/50'
                          : 'bg-white/10 text-white/50 ring-white/15'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-semibold text-white/80">{step.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-4 space-y-4 px-4">
        {/* Status card */}
        <div className="ak-card p-4 shadow-[0_12px_28px_rgba(0,27,61,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">
                Current Status
              </p>
              <div className="mt-1.5">
                <StatusBadge status={status} />
              </div>
            </div>
            {status === 'approved' && (
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F7EF] text-brand-success">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            )}
            {status === 'pending' && (
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF4D6] text-[#B8860B]">
                <Clock3 className="h-5 w-5" />
              </span>
            )}
            {status === 'rejected' && (
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-danger/10 text-brand-danger">
                <XCircle className="h-5 w-5" />
              </span>
            )}
            {status === 'not_submitted' && (
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                <FileText className="h-5 w-5" />
              </span>
            )}
          </div>

          {status === 'pending' && (
            <p className="mt-3 rounded-2xl bg-[#FFF8E8] px-3 py-2.5 text-xs text-[#9a6510]">
              Your documents are under review. This usually takes 24–48 hours.
            </p>
          )}
          {status === 'approved' && (
            <p className="mt-3 rounded-2xl bg-[#E6F7EF] px-3 py-2.5 text-xs text-brand-success">
              Your KYC is verified. Withdrawals and payouts are enabled.
            </p>
          )}
          {data?.kyc?.rejectionReason ? (
            <p className="mt-3 rounded-2xl bg-brand-danger/10 px-3 py-2.5 text-xs text-brand-danger">
              {data.kyc.rejectionReason}
            </p>
          ) : null}
        </div>

        {/* Submitted details */}
        {data?.kyc ? (
          <div className="ak-card p-4">
            <h2 className="mb-3 text-sm font-bold text-brand-text">Submitted Details</h2>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 rounded-2xl bg-brand-bg px-3 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F1FF] text-brand-primary">
                  <UserRound className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] text-brand-muted">Full Name</p>
                  <p className="truncate text-sm font-semibold">{data.kyc.fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-brand-bg px-3 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF4D6] text-[#B8860B]">
                  <CreditCard className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] text-brand-muted">PAN</p>
                  <p className="text-sm font-semibold tracking-wide">{data.kyc.panMasked}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-brand-bg px-3 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6F7EF] text-brand-success">
                  <Building2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] text-brand-muted">Bank Account</p>
                  <p className="text-sm font-semibold">
                    {data.kyc.bankAccountMasked || '—'}
                    {data.kyc.ifscCode ? ` · ${data.kyc.ifscCode}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Form */}
        {canSubmit ? (
          <div className="ak-card p-4">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-brand-text">
                {status === 'rejected' ? 'Resubmit KYC' : 'Submit KYC'}
              </h2>
              <p className="mt-0.5 text-[11px] text-brand-muted">
                Enter your legal name and PAN as per documents.
              </p>
            </div>
            <form
              className="space-y-3"
              onSubmit={handleSubmit(async (values) => {
                await mutation.mutateAsync({
                  ...values,
                  panNumber: values.panNumber.toUpperCase(),
                })
              })}
            >
              <Input label="Full Name" placeholder="As per PAN card" {...register('fullName', { required: true })} />
              <Input
                label="PAN Number"
                placeholder="ABCDE1234F"
                className="uppercase"
                {...register('panNumber', { required: true })}
              />
              <div className="rounded-2xl border border-dashed border-brand-primary/20 bg-brand-bg/50 p-3">
                <p className="mb-2.5 text-xs font-semibold text-brand-text">Bank details (optional)</p>
                <div className="space-y-3">
                  <Input label="Account Holder" {...register('bankAccountHolder')} />
                  <Input label="Account Number" {...register('bankAccountNumber')} />
                  <Input label="IFSC" placeholder="HDFC0001234" className="uppercase" {...register('ifscCode')} />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" loading={isSubmitting || mutation.isPending}>
                {status === 'rejected' ? 'Resubmit for Review' : 'Submit for Verification'}
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  )
}

type BankItem = {
  id: string
  bankName: string
  accountHolderName?: string
  accountNumberMasked: string
  ifscCode: string
  isPrimary: boolean
  verificationStatus?: string
}

export function BanksPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading } = useQuery({ queryKey: ['banks'], queryFn: fetchBanks })
  const banks = (data || []) as BankItem[]
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      isPrimary: true,
    },
  })
  const addMutation = useMutation({
    mutationFn: addBank,
    onSuccess: async () => {
      toast.success('Bank added')
      reset()
      setShowForm(false)
      await qc.invalidateQueries({ queryKey: ['banks'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const delMutation = useMutation({
    mutationFn: deleteBank,
    onSuccess: async () => {
      toast.success('Bank removed')
      await qc.invalidateQueries({ queryKey: ['banks'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const primary = banks.find((b) => b.isPrimary)

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-40 rounded-[18px]" />
        <Skeleton className="h-28 rounded-[18px]" />
      </div>
    )
  }

  return (
    <div className="pb-2">
      {/* Hero */}
      <div className="brand-gradient relative overflow-hidden px-4 pb-8 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-gold/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10">
          <Link to="/profile" className="text-sm font-semibold text-white/80">
            ← Profile
          </Link>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                AlgoKing Payouts
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Bank Accounts</h1>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
              <Landmark className="h-6 w-6 text-brand-gold" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-[10px] text-white/70">Saved</p>
              <p className="mt-0.5 text-xl font-bold">{banks.length}</p>
            </div>
            <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-[10px] text-white/70">Primary</p>
              <p className="mt-0.5 truncate text-sm font-bold leading-tight text-brand-gold">
                {primary?.bankName || 'Not set'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-4 space-y-4 px-4">
        {/* Accounts list */}
        <div>
          <div className="mb-2 flex items-center justify-between px-0.5">
            <h2 className="text-sm font-bold text-brand-text">Saved Accounts</h2>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              {showForm ? 'Close' : 'Add'}
            </button>
          </div>

          {banks.length ? (
            <div className="space-y-3">
              {banks.map((b) => (
                <div
                  key={b.id}
                  className={cn(
                    'ak-card overflow-hidden transition hover:-translate-y-0.5',
                    b.isPrimary && 'ring-1 ring-brand-gold/40'
                  )}
                >
                  <div
                    className={cn(
                      'h-1.5 w-full',
                      b.isPrimary
                        ? 'bg-gradient-to-r from-brand-gold to-[#E7A23B]'
                        : 'bg-gradient-to-r from-brand-secondary to-brand-deep'
                    )}
                  />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-secondary to-brand-deep shadow-[0_8px_18px_rgba(0,102,255,0.2)]">
                        <Building2 className="h-5 w-5 text-brand-gold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-bold text-brand-text">{b.bankName}</p>
                            {b.accountHolderName ? (
                              <p className="mt-0.5 truncate text-xs text-brand-muted">{b.accountHolderName}</p>
                            ) : null}
                          </div>
                          {b.isPrimary ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4D6] px-2 py-0.5 text-[10px] font-bold text-[#B8860B]">
                              <Star className="h-3 w-3 fill-current" /> Primary
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-brand-bg px-3 py-2.5">
                            <p className="text-[10px] text-brand-muted">Account</p>
                            <p className="mt-0.5 text-sm font-bold tracking-wide">{b.accountNumberMasked}</p>
                          </div>
                          <div className="rounded-2xl bg-brand-bg px-3 py-2.5">
                            <p className="text-[10px] text-brand-muted">IFSC</p>
                            <p className="mt-0.5 text-sm font-bold tracking-wide">{b.ifscCode}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          {b.verificationStatus ? (
                            <StatusBadge status={b.verificationStatus} />
                          ) : (
                            <span />
                          )}
                          <button
                            onClick={() => delMutation.mutate(b.id)}
                            disabled={delMutation.isPending}
                            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-danger transition hover:bg-brand-danger/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No bank accounts yet"
              description="Add a payout account to withdraw earnings."
            />
          )}
        </div>

        {/* Add form */}
        {(showForm || banks.length === 0) && (
          <div className="ak-card p-4 shadow-[0_12px_28px_rgba(0,27,61,0.08)]">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <Plus className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-brand-text">Add Bank Account</h2>
                <p className="text-[11px] text-brand-muted">Used for withdrawal payouts</p>
              </div>
            </div>
            <form
              className="space-y-3"
              onSubmit={handleSubmit((v) =>
                addMutation.mutate({
                  ...v,
                  ifscCode: v.ifscCode.toUpperCase(),
                })
              )}
            >
              <Input
                label="Account Holder"
                placeholder="Name as per bank"
                {...register('accountHolderName', { required: true })}
              />
              <Input
                label="Account Number"
                placeholder="9–18 digit account no."
                inputMode="numeric"
                {...register('accountNumber', { required: true })}
              />
              <Input
                label="IFSC"
                placeholder="HDFC0001234"
                className="uppercase"
                {...register('ifscCode', { required: true })}
              />
              <Input
                label="Bank Name"
                placeholder="HDFC Bank"
                {...register('bankName', { required: true })}
              />
              <label className="flex items-center gap-2 rounded-2xl bg-brand-bg px-3 py-3 text-sm text-brand-text">
                <input type="checkbox" className="h-4 w-4 accent-brand-primary" {...register('isPrimary')} />
                Set as primary payout account
              </label>
              <Button type="submit" className="w-full" size="lg" loading={addMutation.isPending}>
                Save Bank Account
              </Button>
            </form>
          </div>
        )}

        <Link
          to="/wallet/withdraw"
          className="ak-card flex items-center justify-between p-4 transition hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E6F7EF] text-brand-success">
              <CreditCard className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-text">Withdraw Funds</p>
              <p className="text-[11px] text-brand-muted">Send to your bank account</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-brand-primary">Go →</span>
        </Link>
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => fetchNotifications() })
  if (isLoading) return <div className="p-4">Loading…</div>
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Notifications</h1>
        <button
          className="text-sm font-medium text-brand-accent"
          onClick={async () => {
            await markAllNotificationsRead()
            await qc.invalidateQueries({ queryKey: ['notifications'] })
            await qc.invalidateQueries({ queryKey: ['dashboard'] })
          }}
        >
          Mark all read
        </button>
      </div>
      {(data?.data || []).length ? (
        data.data.map((n: { _id: string; title: string; message: string; isRead: boolean; createdAt: string }) => (
          <Card
            key={n._id}
            className={`cursor-pointer ${n.isRead ? '' : 'border border-brand-accent/30'}`}
            onClick={async () => {
              if (!n.isRead) {
                await markNotificationRead(n._id)
                await qc.invalidateQueries({ queryKey: ['notifications'] })
                await qc.invalidateQueries({ queryKey: ['dashboard'] })
              }
            }}
          >
            <p className="font-semibold">{n.title}</p>
            <p className="mt-1 text-sm text-brand-muted">{n.message}</p>
            <p className="mt-2 text-xs text-brand-muted">{formatDate(n.createdAt)}</p>
          </Card>
        ))
      ) : (
        <EmptyState title="No notifications" />
      )}
    </div>
  )
}

function buildContactChannels(settings?: {
  supportEmail?: string
  whatsappSupport?: string
  telegramSupport?: string
}) {
  const waRaw = (settings?.whatsappSupport || '').trim()
  const tgRaw = (settings?.telegramSupport || '').trim()
  const email = (settings?.supportEmail || 'support@algoking.local').trim()

  const waHref = waRaw
    ? waRaw.startsWith('http')
      ? waRaw
      : `https://wa.me/${waRaw.replace(/[^\d]/g, '')}`
    : ''
  const tgHref = tgRaw
    ? tgRaw.startsWith('http')
      ? tgRaw
      : `https://t.me/${tgRaw.replace(/^@/, '')}`
    : ''

  return [
    waHref
      ? {
          label: 'WhatsApp',
          href: waHref,
          icon: MessageCircle,
          tone: 'bg-[#E6F7EF] text-[#0F8A56]',
        }
      : null,
    tgHref
      ? {
          label: 'Telegram',
          href: tgHref,
          icon: Send,
          tone: 'bg-[#E7F3FF] text-[#2563EB]',
        }
      : null,
    {
      label: 'Email',
      href: `mailto:${email}`,
      icon: Mail,
      tone: 'bg-[#E7F1FF] text-brand-primary',
    },
  ].filter(Boolean) as Array<{
    label: string
    href: string
    icon: typeof Mail
    tone: string
  }>
}

const ticketCategories = [
  { value: 'general', label: 'General' },
  { value: 'recharge', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'kyc', label: 'KYC' },
  { value: 'investment', label: 'Investment' },
]

export function SupportPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading } = useQuery({ queryKey: ['tickets'], queryFn: () => fetchTickets() })
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: fetchPublicSettings,
    staleTime: 60_000,
  })
  const contactChannels = buildContactChannels(settings)
  const tickets = data?.data || []
  const openCount = tickets.filter((t: { status: string }) =>
    ['open', 'pending', 'in_progress'].includes(t.status)
  ).length

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { subject: '', category: 'general', message: '' },
  })
  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: async () => {
      toast.success('Ticket created')
      reset()
      setShowForm(false)
      await qc.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  return (
    <div className="pb-2">
      {/* Hero */}
      <div className="brand-gradient relative overflow-hidden px-4 pb-8 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-gold/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10">
          <Link to="/profile" className="text-sm font-semibold text-white/80">
            ← Profile
          </Link>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                {settings?.platformName || 'AlgoKing'} Support
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Help Center</h1>
              {settings?.supportPhone ? (
                <p className="mt-1 text-xs text-white/75">{settings.supportPhone}</p>
              ) : null}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
              <LifeBuoy className="h-6 w-6 text-brand-gold" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-[10px] text-white/70">Tickets</p>
              <p className="mt-0.5 text-xl font-bold">{isLoading ? '—' : tickets.length}</p>
            </div>
            <div className="rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-[10px] text-white/70">Open</p>
              <p className="mt-0.5 text-xl font-bold text-brand-gold">
                {isLoading ? '—' : openCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-4 space-y-4 px-4">
        {/* Contact channels */}
        <div className="grid grid-cols-3 gap-2.5">
          {contactChannels.map(({ label, href, icon: Icon, tone }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="ak-card flex flex-col items-center gap-2 p-3 text-center transition hover:-translate-y-0.5"
            >
              <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', tone)}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-semibold text-brand-text">{label}</span>
            </a>
          ))}
        </div>

        {/* Quick actions */}
        <div className="ak-card divide-y divide-brand-bg/80 overflow-hidden p-0">
          <button
            className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left transition hover:bg-brand-bg/50"
            onClick={() => setShowForm((s) => !s)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              <Plus className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-brand-text">
                {showForm ? 'Close Form' : 'Raise a Ticket'}
              </span>
              <span className="block text-[11px] text-brand-muted">Create a support request</span>
            </span>
            <ChevronRight className="h-4 w-4 text-brand-muted" />
          </button>
          <a
            href="#my-tickets"
            className="flex items-center gap-3 px-3.5 py-3.5 transition hover:bg-brand-bg/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF4D6] text-[#B8860B]">
              <Ticket className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-brand-text">My Tickets</span>
              <span className="block text-[11px] text-brand-muted">Track previous requests</span>
            </span>
            <ChevronRight className="h-4 w-4 text-brand-muted" />
          </a>
          <div className="flex items-center gap-3 px-3.5 py-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E0F2FE] text-[#0284C7]">
              <Headset className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-brand-text">Live Support</span>
              <span className="block text-[11px] text-brand-muted">Chat with our team</span>
            </span>
            <span className="rounded-full bg-brand-bg px-2 py-0.5 text-[10px] font-semibold text-brand-muted">
              Soon
            </span>
          </div>
        </div>

        {/* Ticket form */}
        {showForm ? (
          <div className="ak-card p-4 shadow-[0_12px_28px_rgba(0,27,61,0.08)]">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-brand-text">New Support Ticket</h2>
              <p className="text-[11px] text-brand-muted">Describe your issue clearly</p>
            </div>
            <form className="space-y-3" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
              <Input
                label="Subject"
                placeholder="Brief summary of the issue"
                {...register('subject', { required: true })}
              />
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-brand-text">Category</span>
                <select
                  className="h-12 w-full rounded-2xl border border-brand-primary/10 bg-brand-bg/60 px-4 text-sm outline-none focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/15"
                  {...register('category')}
                >
                  {ticketCategories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-brand-text">Message</span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-brand-primary/10 bg-brand-bg/60 p-3 text-sm outline-none focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/15"
                  placeholder="Share details so we can help faster…"
                  {...register('message', { required: true })}
                />
              </label>
              <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>
                Submit Ticket
              </Button>
            </form>
          </div>
        ) : null}

        {/* Tickets list */}
        <div id="my-tickets">
          <div className="mb-2 flex items-center justify-between px-0.5">
            <h2 className="text-sm font-bold text-brand-text">My Tickets</h2>
            <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
              {tickets.length} total
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 rounded-[18px]" />
              <Skeleton className="h-20 rounded-[18px]" />
            </div>
          ) : tickets.length ? (
            <div className="space-y-2">
              {tickets.map(
                (t: {
                  _id: string
                  ticketNumber: string
                  subject: string
                  status: string
                  category?: string
                  updatedAt?: string
                  createdAt?: string
                }) => (
                  <Link
                    key={t._id}
                    to={`/support/${t._id}`}
                    className="ak-card flex items-center gap-3 p-3.5 transition hover:-translate-y-0.5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                      <Ticket className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-brand-text">{t.subject}</p>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-brand-muted">
                        {t.ticketNumber}
                        {t.category ? ` · ${t.category}` : ''}
                      </p>
                      {(t.updatedAt || t.createdAt) && (
                        <p className="mt-0.5 text-[10px] text-brand-muted">
                          {formatDate(t.updatedAt || t.createdAt)}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-brand-muted" />
                  </Link>
                )
              )}
            </div>
          ) : (
            <EmptyState title="No tickets yet" description="Raise a ticket if you need help." />
          )}
        </div>
      </div>
    </div>
  )
}

export function SupportDetailPage() {
  const { id } = useParams()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicket(id!),
    enabled: !!id,
  })

  const ticket = data?.ticket
  const messages = data?.messages || []

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-36 rounded-[18px]" />
        <Skeleton className="h-24 rounded-[18px]" />
      </div>
    )
  }

  return (
    <div className="pb-2">
      <div className="brand-gradient relative overflow-hidden px-4 pb-8 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-gold/20 blur-2xl" />
        <Link to="/support" className="relative z-10 text-sm font-semibold text-white/80">
          ← Support
        </Link>
        <div className="relative z-10 mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
            Ticket Details
          </p>
          <h1 className="mt-1 text-xl font-extrabold leading-snug">{ticket?.subject || '—'}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket?.status || 'open'} className="bg-white/15 text-white" />
            <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] text-white/80">
              {ticket?.ticketNumber}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-4 space-y-3 px-4">
        <div className="ak-card space-y-3 p-3.5 shadow-[0_12px_28px_rgba(0,27,61,0.08)]">
          {messages.length ? (
            messages.map(
              (m: { _id: string; message: string; senderRole: string; createdAt: string }) => {
                const isUser = m.senderRole === 'user'
                return (
                  <div
                    key={m._id}
                    className={cn(
                      'rounded-2xl p-3',
                      isUser ? 'ml-4 bg-brand-primary/10' : 'mr-4 bg-brand-bg'
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                        {isUser ? 'You' : 'Support'}
                      </span>
                      <span className="text-[10px] text-brand-muted">{formatDate(m.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-brand-text">{m.message}</p>
                  </div>
                )
              }
            )
          ) : (
            <p className="py-4 text-center text-sm text-brand-muted">No messages yet</p>
          )}
        </div>

        <div className="ak-card space-y-2.5 p-3.5">
          <textarea
            className="min-h-24 w-full rounded-2xl border border-brand-primary/10 bg-brand-bg/60 p-3 text-sm outline-none focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/15"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a reply…"
          />
          <Button
            className="w-full"
            size="lg"
            loading={sending}
            disabled={!message.trim()}
            onClick={async () => {
              try {
                setSending(true)
                await replyTicket(id!, message)
                setMessage('')
                await qc.invalidateQueries({ queryKey: ['ticket', id] })
              } catch (e) {
                toast.error(getErrorMessage(e))
              } finally {
                setSending(false)
              }
            }}
          >
            <Send className="h-4 w-4" /> Send Reply
          </Button>
        </div>
      </div>
    </div>
  )
}

export function EditProfilePage() {
  const { user, refreshMe } = useAuth()
  const { register, handleSubmit } = useForm({ defaultValues: { fullName: user?.fullName || '' } })
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Edit Profile</h1>
      <Card>
        <form
          className="space-y-3"
          onSubmit={handleSubmit(async (values) => {
            try {
              const { api } = await import('@/services/api')
              await api.put('/users/profile', values)
              await refreshMe()
              toast.success('Profile updated')
            } catch (e) {
              toast.error(getErrorMessage(e))
            }
          })}
        >
          <Input label="Full Name" {...register('fullName', { required: true })} />
          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </Card>
    </div>
  )
}
