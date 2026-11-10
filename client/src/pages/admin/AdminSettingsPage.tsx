import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  BadgeIndianRupee,
  FileText,
  Globe2,
  LifeBuoy,
  ShieldAlert,
  Wallet,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchAdminSettings, updateAdminSettings } from '@/services/adminService'
import { formatINR } from '@/lib/format'
import { getErrorMessage } from '@/services/api'
import { cn } from '@/lib/utils'

type TabId = 'brand' | 'currency' | 'wallet' | 'content' | 'system'

const TABS: Array<{ id: TabId; label: string; icon: typeof Globe2 }> = [
  { id: 'brand', label: 'Brand & Support', icon: LifeBuoy },
  { id: 'currency', label: 'Currency', icon: BadgeIndianRupee },
  { id: 'wallet', label: 'Wallet Limits', icon: Wallet },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'system', label: 'System', icon: ShieldAlert },
]

type FormState = {
  platformName: string
  tagline: string
  supportEmail: string
  supportPhone: string
  whatsappSupport: string
  telegramSupport: string
  projectCurrency: 'INR' | 'USDT'
  usdtInrRate: string
  timezone: string
  maintenanceMode: boolean
  registrationOpen: boolean
  minRecharge: string
  maxRecharge: string
  minWithdrawal: string
  maxWithdrawal: string
  withdrawalFee: string
  withdrawalProcessingTime: string
  paymentGatewayMode: string
  terms: string
  privacy: string
  dashboardBanner: string
  riskDisclaimer: string
}

const EMPTY: FormState = {
  platformName: 'AlgoKing',
  tagline: 'Grow Your Future.',
  supportEmail: '',
  supportPhone: '',
  whatsappSupport: '',
  telegramSupport: '',
  projectCurrency: 'INR',
  usdtInrRate: '90',
  timezone: 'Asia/Kolkata',
  maintenanceMode: false,
  registrationOpen: true,
  minRecharge: '100',
  maxRecharge: '100000',
  minWithdrawal: '500',
  maxWithdrawal: '50000',
  withdrawalFee: '0',
  withdrawalProcessingTime: '1-3 business days',
  paymentGatewayMode: 'DEMO',
  terms: '',
  privacy: '',
  dashboardBanner: '',
  riskDisclaimer: '',
}

function fromSettings(data?: Record<string, unknown> | null): FormState {
  if (!data) return { ...EMPTY }
  return {
    platformName: String(data.platformName || EMPTY.platformName),
    tagline: String(data.tagline || EMPTY.tagline),
    supportEmail: String(data.supportEmail || ''),
    supportPhone: String(data.supportPhone || ''),
    whatsappSupport: String(data.whatsappSupport || ''),
    telegramSupport: String(data.telegramSupport || ''),
    projectCurrency: data.projectCurrency === 'USDT' ? 'USDT' : 'INR',
    usdtInrRate: String(data.usdtInrRate ?? 90),
    timezone: String(data.timezone || 'Asia/Kolkata'),
    maintenanceMode: !!data.maintenanceMode,
    registrationOpen: data.registrationOpen !== false,
    minRecharge: String(data.minRecharge ?? 100),
    maxRecharge: String(data.maxRecharge ?? 100000),
    minWithdrawal: String(data.minWithdrawal ?? 500),
    maxWithdrawal: String(data.maxWithdrawal ?? 50000),
    withdrawalFee: String(data.withdrawalFee ?? 0),
    withdrawalProcessingTime: String(data.withdrawalProcessingTime || '1-3 business days'),
    paymentGatewayMode: String(data.paymentGatewayMode || 'DEMO'),
    terms: String(data.terms || ''),
    privacy: String(data.privacy || ''),
    dashboardBanner: String(data.dashboardBanner || ''),
    riskDisclaimer: String(data.riskDisclaimer || ''),
  }
}

function TextArea({
  label,
  value,
  onChange,
  rows = 5,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  hint?: string
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-semibold text-brand-text">{label}</span>
      <textarea
        rows={rows}
        className="w-full rounded-2xl border border-brand-primary/10 bg-white p-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="block text-xs text-brand-muted">{hint}</span> : null}
    </label>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition',
        checked ? 'border-brand-primary/30 bg-brand-primary/5' : 'border-brand-primary/10 bg-white'
      )}
    >
      <div>
        <p className="text-sm font-semibold text-brand-text">{label}</p>
        <p className="mt-0.5 text-xs text-brand-muted">{description}</p>
      </div>
      <span
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition',
          checked ? 'bg-brand-primary' : 'bg-brand-bg'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition',
            checked ? 'left-5' : 'left-0.5'
          )}
        />
      </span>
    </button>
  )
}

export function AdminSettingsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: fetchAdminSettings })
  const [tab, setTab] = useState<TabId>('brand')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(fromSettings(data as Record<string, unknown>))
  }, [data])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const rate = Number(form.usdtInrRate) > 0 ? Number(form.usdtInrRate) : 90

  const impact = useMemo(
    () => [
      { label: 'User money display', value: form.projectCurrency },
      { label: 'Min deposit', value: formatINR(Number(form.minRecharge) || 0) },
      { label: 'Min withdraw', value: formatINR(Number(form.minWithdrawal) || 0) },
      { label: 'Withdraw fee', value: formatINR(Number(form.withdrawalFee) || 0) },
      { label: 'Maintenance', value: form.maintenanceMode ? 'ON' : 'OFF' },
      { label: 'Registration', value: form.registrationOpen ? 'Open' : 'Closed' },
    ],
    [form]
  )

  const save = async () => {
    if (!(rate > 0)) {
      toast.error('USDT/INR rate must be greater than 0')
      return
    }
    if (Number(form.minRecharge) > Number(form.maxRecharge)) {
      toast.error('Min deposit cannot exceed max deposit')
      return
    }
    if (Number(form.minWithdrawal) > Number(form.maxWithdrawal)) {
      toast.error('Min withdrawal cannot exceed max withdrawal')
      return
    }
    setSaving(true)
    try {
      await updateAdminSettings([
        { key: 'platformName', value: form.platformName.trim() || 'AlgoKing', category: 'general' },
        { key: 'tagline', value: form.tagline.trim(), category: 'general' },
        { key: 'supportEmail', value: form.supportEmail.trim(), category: 'general' },
        { key: 'supportPhone', value: form.supportPhone.trim(), category: 'general' },
        { key: 'whatsappSupport', value: form.whatsappSupport.trim(), category: 'general' },
        { key: 'telegramSupport', value: form.telegramSupport.trim(), category: 'general' },
        { key: 'projectCurrency', value: form.projectCurrency, category: 'general' },
        { key: 'currency', value: form.projectCurrency, category: 'general' },
        { key: 'usdtInrRate', value: rate, category: 'general' },
        { key: 'timezone', value: form.timezone.trim() || 'Asia/Kolkata', category: 'general' },
        { key: 'maintenanceMode', value: form.maintenanceMode, category: 'general' },
        { key: 'registrationOpen', value: form.registrationOpen, category: 'general' },
        { key: 'minRecharge', value: Number(form.minRecharge) || 0, category: 'wallet' },
        { key: 'maxRecharge', value: Number(form.maxRecharge) || 0, category: 'wallet' },
        { key: 'minWithdrawal', value: Number(form.minWithdrawal) || 0, category: 'wallet' },
        { key: 'maxWithdrawal', value: Number(form.maxWithdrawal) || 0, category: 'wallet' },
        { key: 'withdrawalFee', value: Number(form.withdrawalFee) || 0, category: 'wallet' },
        {
          key: 'withdrawalProcessingTime',
          value: form.withdrawalProcessingTime.trim(),
          category: 'wallet',
        },
        { key: 'paymentGatewayMode', value: form.paymentGatewayMode, category: 'payment' },
        { key: 'terms', value: form.terms, category: 'content' },
        { key: 'privacy', value: form.privacy, category: 'content' },
        { key: 'dashboardBanner', value: form.dashboardBanner, category: 'content' },
        { key: 'riskDisclaimer', value: form.riskDisclaimer, category: 'content' },
      ])
      toast.success('Settings saved — user app will pick them up live')
      await qc.invalidateQueries({ queryKey: ['admin-settings'] })
      await qc.invalidateQueries({ queryKey: ['public-settings'] })
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Configuration
          </p>
          <h1 className="text-2xl font-bold text-brand-text">App Settings</h1>
          <p className="text-sm text-brand-muted">
            Dynamically controls currency, limits, content & user-facing notices
          </p>
        </div>
        <Button loading={saving} onClick={() => void save()}>
          Save all settings
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {impact.map((item) => (
          <Card key={item.label} className="py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
              {item.label}
            </p>
            <p className="mt-1 text-lg font-bold text-brand-text">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition',
              tab === id ? 'brand-gradient text-white' : 'bg-white text-brand-muted'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'brand' ? (
        <Card className="space-y-4">
          <div>
            <h2 className="font-semibold text-brand-text">Brand & Support</h2>
            <p className="text-xs text-brand-muted">
              Shows on auth screens, support page contacts, and public branding
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Platform name" value={form.platformName} onChange={(e) => set('platformName', e.target.value)} />
            <Input label="Tagline" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
            <Input label="Support email" value={form.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} />
            <Input label="Support phone" value={form.supportPhone} onChange={(e) => set('supportPhone', e.target.value)} />
            <Input
              label="WhatsApp number / link"
              placeholder="9198xxxxxxx or full wa.me link"
              value={form.whatsappSupport}
              onChange={(e) => set('whatsappSupport', e.target.value)}
            />
            <Input
              label="Telegram username / link"
              placeholder="@algoking or t.me link"
              value={form.telegramSupport}
              onChange={(e) => set('telegramSupport', e.target.value)}
            />
          </div>
        </Card>
      ) : null}

      {tab === 'currency' ? (
        <Card className="space-y-4">
          <div>
            <h2 className="font-semibold text-brand-text">Project Currency</h2>
            <p className="text-xs text-brand-muted">
              Ledger stays in INR. User app display + USDT conversion use these values
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-brand-text">Display currency</span>
              <select
                className="h-12 w-full rounded-2xl border border-brand-primary/10 bg-white px-3 text-sm"
                value={form.projectCurrency}
                onChange={(e) => set('projectCurrency', e.target.value as 'INR' | 'USDT')}
              >
                <option value="INR">INR (₹)</option>
                <option value="USDT">USDT</option>
              </select>
            </label>
            <Input
              label="1 USDT = INR rate"
              type="number"
              value={form.usdtInrRate}
              onChange={(e) => set('usdtInrRate', e.target.value)}
              min={1}
              step="0.01"
            />
          </div>
          <div className="rounded-2xl bg-brand-bg p-3 text-sm text-brand-muted">
            <p>
              Rate preview: <span className="font-semibold text-brand-text">1 USDT = ₹{rate}</span>
            </p>
            <p className="mt-1">
              100 USDT = ₹{(100 * rate).toLocaleString('en-IN')} · ₹9,000 = {(9000 / rate).toFixed(4)}{' '}
              USDT
            </p>
            <p className="mt-1">
              Affects: wallet balances, deposit/withdraw screens, USDT method conversion
            </p>
          </div>
        </Card>
      ) : null}

      {tab === 'wallet' ? (
        <Card className="space-y-4">
          <div>
            <h2 className="font-semibold text-brand-text">Wallet Limits</h2>
            <p className="text-xs text-brand-muted">
              Enforced on deposit/withdraw APIs and shown on user wallet pages (INR ledger units)
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Min deposit (INR)" type="number" value={form.minRecharge} onChange={(e) => set('minRecharge', e.target.value)} />
            <Input label="Max deposit (INR)" type="number" value={form.maxRecharge} onChange={(e) => set('maxRecharge', e.target.value)} />
            <Input label="Min withdrawal (INR)" type="number" value={form.minWithdrawal} onChange={(e) => set('minWithdrawal', e.target.value)} />
            <Input label="Max withdrawal (INR)" type="number" value={form.maxWithdrawal} onChange={(e) => set('maxWithdrawal', e.target.value)} />
            <Input label="Default withdrawal fee (INR)" type="number" value={form.withdrawalFee} onChange={(e) => set('withdrawalFee', e.target.value)} />
            <Input
              label="Withdrawal processing time"
              value={form.withdrawalProcessingTime}
              onChange={(e) => set('withdrawalProcessingTime', e.target.value)}
            />
          </div>
          <p className="text-xs text-brand-muted">
            Note: payment-method-specific fees/limits (BEP20/TRC20/UPI/Bank) still override these defaults when set on Payment Methods.
          </p>
        </Card>
      ) : null}

      {tab === 'content' ? (
        <Card className="space-y-4">
          <div>
            <h2 className="font-semibold text-brand-text">Public Content</h2>
            <p className="text-xs text-brand-muted">
              Terms/Privacy pages, dashboard banner, and investment risk note
            </p>
          </div>
          <Input
            label="Dashboard banner"
            value={form.dashboardBanner}
            onChange={(e) => set('dashboardBanner', e.target.value)}
          />
          <TextArea
            label="Risk disclaimer"
            value={form.riskDisclaimer}
            onChange={(v) => set('riskDisclaimer', v)}
            rows={3}
            hint="Shown near plans / investments"
          />
          <TextArea label="Terms & Conditions" value={form.terms} onChange={(v) => set('terms', v)} rows={8} />
          <TextArea label="Privacy Policy" value={form.privacy} onChange={(v) => set('privacy', v)} rows={8} />
        </Card>
      ) : null}

      {tab === 'system' ? (
        <Card className="space-y-4">
          <div>
            <h2 className="font-semibold text-brand-text">System Controls</h2>
            <p className="text-xs text-brand-muted">Maintenance, registration and operational mode</p>
          </div>
          <Toggle
            label="Maintenance mode"
            description="Shows a notice on the user app while admin panel stays available"
            checked={form.maintenanceMode}
            onChange={(v) => set('maintenanceMode', v)}
          />
          <Toggle
            label="Registration open"
            description="When off, new users cannot create accounts"
            checked={form.registrationOpen}
            onChange={(v) => set('registrationOpen', v)}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Timezone" value={form.timezone} onChange={(e) => set('timezone', e.target.value)} />
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-brand-text">Payment gateway mode</span>
              <select
                className="h-12 w-full rounded-2xl border border-brand-primary/10 bg-white px-3 text-sm"
                value={form.paymentGatewayMode}
                onChange={(e) => set('paymentGatewayMode', e.target.value)}
              >
                <option value="DEMO">DEMO</option>
                <option value="LIVE">LIVE</option>
              </select>
            </label>
          </div>
          <div className="rounded-2xl border border-brand-warning/30 bg-brand-warning/10 px-4 py-3 text-sm text-[#9a6510]">
            LIVE mode does not enable real bank payouts by itself — withdrawals still require compliance-safe flows.
          </div>
        </Card>
      ) : null}

      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-brand-primary" />
          <h3 className="font-semibold text-brand-text">User-side impact map</h3>
        </div>
        <ul className="grid gap-1.5 text-sm text-brand-muted md:grid-cols-2">
          <li>• Currency + rate → all amount displays & USDT conversion</li>
          <li>• Wallet limits → deposit/withdraw validation</li>
          <li>• Withdraw fee/time → withdraw summary</li>
          <li>• Banner / disclaimer → dashboard & plans</li>
          <li>• Terms / Privacy → /terms & /privacy</li>
          <li>• Support contacts → Help Center channels</li>
          <li>• Maintenance → user app notice banner</li>
          <li>• Registration open → /register gate</li>
        </ul>
      </Card>

      <div className="sticky bottom-4 z-10">
        <Button className="w-full shadow-lg md:w-auto" loading={saving} onClick={() => void save()}>
          Save all settings
        </Button>
      </div>
    </div>
  )
}
