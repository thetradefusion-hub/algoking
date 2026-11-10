import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Archive,
  Copy,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  archivePlan,
  createPlan,
  duplicatePlan,
  fetchAdminPlans,
  updatePlan,
} from '@/services/adminService'
import { formatINR } from '@/lib/format'
import { getErrorMessage } from '@/services/api'
import { cn } from '@/lib/utils'

type PlanRow = {
  _id: string
  name: string
  slug?: string
  description: string
  image?: string
  iconEmoji?: string
  badgeLabel?: string
  isFeatured?: boolean
  isPopular?: boolean
  investmentAmount: number
  durationDays: number
  projectedDailyIncome: number
  projectedTotalIncome: number
  status: 'active' | 'inactive' | 'archived'
  purchaseLimit?: number
  sortOrder?: number
  riskDisclosure?: string
}

type PlanForm = {
  name: string
  description: string
  image: string
  iconEmoji: string
  badgeLabel: string
  isFeatured: boolean
  isPopular: boolean
  investmentAmount: number
  durationDays: number
  projectedDailyIncome: number
  projectedTotalIncome: number
  status: 'active' | 'inactive' | 'archived'
  purchaseLimit: number
  sortOrder: number
  riskDisclosure: string
}

const EMPTY: PlanForm = {
  name: '',
  description: '',
  image: '',
  iconEmoji: '📈',
  badgeLabel: '',
  isFeatured: false,
  isPopular: false,
  investmentAmount: 1000,
  durationDays: 30,
  projectedDailyIncome: 20,
  projectedTotalIncome: 600,
  status: 'active',
  purchaseLimit: 0,
  sortOrder: 0,
  riskDisclosure: '',
}

const EMOJIS = ['📈', '💎', '👑', '🚀', '🔥', '💰', '⭐', '🏆', '🪙', '📊', '⚡', '🌟']

function toForm(p?: PlanRow | null): PlanForm {
  if (!p) return { ...EMPTY }
  return {
    name: p.name || '',
    description: p.description || '',
    image: p.image || '',
    iconEmoji: p.iconEmoji || '📈',
    badgeLabel: p.badgeLabel || '',
    isFeatured: !!p.isFeatured,
    isPopular: !!p.isPopular,
    investmentAmount: Number(p.investmentAmount || 0),
    durationDays: Number(p.durationDays || 0),
    projectedDailyIncome: Number(p.projectedDailyIncome || 0),
    projectedTotalIncome: Number(p.projectedTotalIncome || 0),
    status: p.status || 'active',
    purchaseLimit: Number(p.purchaseLimit || 0),
    sortOrder: Number(p.sortOrder || 0),
    riskDisclosure: p.riskDisclosure || '',
  }
}

export function AdminPlansPage() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')
  const [editing, setEditing] = useState<PlanRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PlanForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['admin-plans'], queryFn: fetchAdminPlans })
  const plans = (data || []) as PlanRow[]

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      const term = q.trim().toLowerCase()
      if (!term) return true
      return (
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.slug?.toLowerCase().includes(term)
      )
    })
  }, [plans, q, statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY })
    setCreating(true)
  }

  const openEdit = (p: PlanRow) => {
    setCreating(false)
    setEditing(p)
    setForm(toForm(p))
  }

  const closeDrawer = () => {
    setCreating(false)
    setEditing(null)
  }

  const setField = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'projectedDailyIncome' || key === 'durationDays') {
        const daily = Number(key === 'projectedDailyIncome' ? value : next.projectedDailyIncome)
        const days = Number(key === 'durationDays' ? value : next.durationDays)
        next.projectedTotalIncome = Number((daily * days).toFixed(2))
      }
      return next
    })
  }

  const save = async () => {
    if (!form.name.trim() || form.description.trim().length < 5) {
      toast.error('Name and description (min 5 chars) required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        image: form.image.trim(),
        badgeLabel: form.badgeLabel.trim(),
        investmentAmount: Number(form.investmentAmount),
        durationDays: Number(form.durationDays),
        projectedDailyIncome: Number(form.projectedDailyIncome),
        projectedTotalIncome: Number(form.projectedTotalIncome),
        purchaseLimit: Number(form.purchaseLimit),
        sortOrder: Number(form.sortOrder),
      }
      if (editing) {
        await updatePlan(editing._id, payload)
        toast.success('Plan updated')
      } else {
        await createPlan(payload)
        toast.success('Plan created')
      }
      closeDrawer()
      await qc.invalidateQueries({ queryKey: ['admin-plans'] })
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const drawerOpen = creating || !!editing
  const roi =
    form.investmentAmount > 0
      ? Math.round((Number(form.projectedTotalIncome) / Number(form.investmentAmount)) * 100)
      : 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary">Catalog</p>
          <h1 className="text-2xl font-bold">Investment Plans</h1>
          <p className="text-sm text-brand-muted">Create, edit, feature, duplicate or archive plans</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          New Plan
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plans…"
            className="h-11 w-full rounded-2xl border border-brand-primary/10 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
          />
        </div>
        {(['all', 'active', 'inactive', 'archived'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={cn(
              'rounded-full px-3 py-2 text-xs font-semibold capitalize',
              statusFilter === s ? 'brand-gradient text-white' : 'bg-white text-brand-muted'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const planRoi =
              p.investmentAmount > 0
                ? Math.round((p.projectedTotalIncome / p.investmentAmount) * 100)
                : 0
            return (
              <Card key={p._id} className="relative overflow-hidden p-0">
                <div className="brand-gradient h-1.5 w-full" />
                <div className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-primary/10 text-2xl">
                      {p.image ? (
                        <img src={p.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>{p.iconEmoji || '📈'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={p.status} />
                        {p.isFeatured ? (
                          <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 text-[10px] font-bold text-brand-accent">
                            Featured
                          </span>
                        ) : null}
                        {p.isPopular ? (
                          <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold text-brand-primary">
                            Popular
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-1 truncate font-bold text-brand-text">{p.name}</h3>
                      <p className="line-clamp-2 text-xs text-brand-muted">{p.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-brand-bg p-2">
                      <p className="text-[10px] text-brand-muted">Invest</p>
                      <p className="text-xs font-bold">{formatINR(p.investmentAmount)}</p>
                    </div>
                    <div className="rounded-xl bg-brand-bg p-2">
                      <p className="text-[10px] text-brand-muted">Daily</p>
                      <p className="text-xs font-bold">{formatINR(p.projectedDailyIncome)}</p>
                    </div>
                    <div className="rounded-xl bg-brand-bg p-2">
                      <p className="text-[10px] text-brand-muted">ROI</p>
                      <p className="text-xs font-bold text-brand-primary">{planRoi}%</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px] text-brand-muted">
                    <span>{p.durationDays} days</span>
                    <span>·</span>
                    <span>Sort {p.sortOrder ?? 0}</span>
                    <span>·</span>
                    <span>{p.purchaseLimit ? `Limit ${p.purchaseLimit}` : 'Unlimited'}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="soft"
                      onClick={async () => {
                        try {
                          await duplicatePlan(p._id)
                          toast.success('Plan duplicated')
                          await qc.invalidateQueries({ queryKey: ['admin-plans'] })
                        } catch (e) {
                          toast.error(getErrorMessage(e))
                        }
                      }}
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      Copy
                    </Button>
                    {p.status !== 'active' ? (
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await updatePlan(p._id, { status: 'active' })
                            toast.success('Plan activated')
                            await qc.invalidateQueries({ queryKey: ['admin-plans'] })
                          } catch (e) {
                            toast.error(getErrorMessage(e))
                          }
                        }}
                      >
                        Activate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await updatePlan(p._id, { status: 'inactive' })
                            toast.success('Plan deactivated')
                            await qc.invalidateQueries({ queryKey: ['admin-plans'] })
                          } catch (e) {
                            toast.error(getErrorMessage(e))
                          }
                        }}
                      >
                        Deactivate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        if (!confirm(`Archive/delete “${p.name}”?`)) return
                        try {
                          const result = await archivePlan(p._id)
                          toast.success(result?.archived ? 'Plan archived' : 'Plan deleted')
                          await qc.invalidateQueries({ queryKey: ['admin-plans'] })
                        } catch (e) {
                          toast.error(getErrorMessage(e))
                        }
                      }}
                    >
                      {p.status === 'archived' ? (
                        <Trash2 className="h-3.5 w-3.5" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState title="No plans found" description="Create your first investment plan" />
      )}

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 p-0 sm:p-4">
          <div className="flex h-full w-full max-w-xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-brand-primary/10 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                  {editing ? 'Edit plan' : 'Create plan'}
                </p>
                <h2 className="text-lg font-bold">{editing ? editing.name : 'New investment plan'}</h2>
              </div>
              <button type="button" className="rounded-xl p-2 hover:bg-brand-bg" onClick={closeDrawer}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="admin-scroll flex-1 space-y-4 overflow-y-auto p-4">
              <div className="flex items-center gap-3 rounded-2xl bg-brand-bg p-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white text-3xl shadow">
                  {form.image ? (
                    <img src={form.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{form.iconEmoji}</span>
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-semibold">{form.name || 'Plan preview'}</p>
                  <p className="text-brand-muted">ROI ~ {roi}%</p>
                </div>
              </div>

              <Input label="Plan name" value={form.name} onChange={(e) => setField('name', e.target.value)} />
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold">Description</span>
                <textarea
                  className="min-h-24 w-full rounded-2xl border border-brand-primary/10 bg-white p-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                />
              </label>

              <Input
                label="Image URL (optional)"
                placeholder="https://…/plan.png"
                value={form.image}
                onChange={(e) => setField('image', e.target.value)}
              />

              <div>
                <p className="mb-2 text-sm font-semibold">Icon emoji</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setField('iconEmoji', e)}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl text-lg',
                        form.iconEmoji === e ? 'bg-brand-primary/15 ring-2 ring-brand-primary' : 'bg-brand-bg'
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Badge label"
                  placeholder="Starter / Popular / Premium"
                  value={form.badgeLabel}
                  onChange={(e) => setField('badgeLabel', e.target.value)}
                />
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold">Status</span>
                  <select
                    className="h-12 w-full rounded-2xl border border-brand-primary/10 bg-white px-3"
                    value={form.status}
                    onChange={(e) => setField('status', e.target.value as PlanForm['status'])}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Investment amount"
                  type="number"
                  value={String(form.investmentAmount)}
                  onChange={(e) => setField('investmentAmount', Number(e.target.value))}
                />
                <Input
                  label="Duration (days)"
                  type="number"
                  value={String(form.durationDays)}
                  onChange={(e) => setField('durationDays', Number(e.target.value))}
                />
                <Input
                  label="Projected daily income"
                  type="number"
                  value={String(form.projectedDailyIncome)}
                  onChange={(e) => setField('projectedDailyIncome', Number(e.target.value))}
                />
                <Input
                  label="Projected total income"
                  type="number"
                  value={String(form.projectedTotalIncome)}
                  onChange={(e) => setField('projectedTotalIncome', Number(e.target.value))}
                />
                <Input
                  label="Purchase limit (0 = unlimited)"
                  type="number"
                  value={String(form.purchaseLimit)}
                  onChange={(e) => setField('purchaseLimit', Number(e.target.value))}
                />
                <Input
                  label="Sort order"
                  type="number"
                  value={String(form.sortOrder)}
                  onChange={(e) => setField('sortOrder', Number(e.target.value))}
                />
              </div>

              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold">Risk disclosure</span>
                <textarea
                  className="min-h-20 w-full rounded-2xl border border-brand-primary/10 bg-white p-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                  value={form.riskDisclosure}
                  onChange={(e) => setField('riskDisclosure', e.target.value)}
                  placeholder="Income is projected / non-guaranteed…"
                />
              </label>

              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="accent-brand-primary"
                    checked={form.isFeatured}
                    onChange={(e) => setField('isFeatured', e.target.checked)}
                  />
                  <Star className="h-4 w-4 text-brand-accent" />
                  Featured
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="accent-brand-primary"
                    checked={form.isPopular}
                    onChange={(e) => setField('isPopular', e.target.checked)}
                  />
                  Popular
                </label>
              </div>
            </div>

            <div className="flex gap-2 border-t border-brand-primary/10 p-4">
              <Button variant="outline" className="flex-1" onClick={closeDrawer}>
                Cancel
              </Button>
              <Button className="flex-1" loading={saving} onClick={() => void save()}>
                {editing ? 'Save changes' : 'Create plan'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
