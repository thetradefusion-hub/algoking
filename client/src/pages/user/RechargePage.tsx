import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Copy, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  fetchPaymentMethods,
  fetchRecharges,
  fetchWallets,
  submitManualDeposit,
  type PaymentMethod,
} from '@/services/userService'
import { formatAlternateCurrency, formatDate, formatINR, formatUSDT, getUsdtInrRate } from '@/lib/format'
import { usdtToInr } from '@/lib/currencyStore'
import { useCurrency } from '@/context/CurrencyContext'
import { getErrorMessage } from '@/services/api'
import { cn, idempotencyKey } from '@/lib/utils'

const quick = [500, 1000, 2000, 5000]

export function RechargePage() {
  const [amount, setAmount] = useState('1000')
  const [methodId, setMethodId] = useState('')
  const [proof, setProof] = useState('')
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)
  const qc = useQueryClient()
  const { usdtInrRate, projectCurrency } = useCurrency()

  const wallets = useQuery({ queryKey: ['wallets'], queryFn: fetchWallets })
  const methodsQuery = useQuery({
    queryKey: ['payment-methods', 'deposit'],
    queryFn: () => fetchPaymentMethods('deposit'),
  })
  const history = useQuery({ queryKey: ['recharges'], queryFn: () => fetchRecharges() })
  const main = wallets.data?.wallets?.find((w) => w.walletType === 'main')
  const methods = methodsQuery.data || []
  const limits = wallets.data?.limits || {}

  const selected = useMemo(
    () => methods.find((m) => m.id === methodId) || methods[0],
    [methods, methodId]
  )

  const minDeposit = Number(selected?.minDeposit ?? limits.minRecharge ?? 100)
  const maxDeposit = Number(selected?.maxDeposit ?? limits.maxRecharge ?? 100000)
  const activeMethodId = methodId || selected?.id || ''
  const isUsdtMethod = selected?.currency === 'USDT'
  const amountNum = Number(amount || 0)
  const creditInr = isUsdtMethod ? usdtToInr(amountNum, usdtInrRate) : amountNum

  const mutation = useMutation({
    mutationFn: async () => {
      if (!activeMethodId) throw new Error('Select a payment method')
      return submitManualDeposit({
        amount: Number(amount),
        paymentMethodId: activeMethodId,
        proofReference: proof,
        userNote: note || undefined,
        idempotencyKey: idempotencyKey('deposit'),
      })
    },
    onSuccess: async () => {
      toast.success('Deposit submitted — waiting for admin approval')
      setProof('')
      setNote('')
      await qc.invalidateQueries({ queryKey: ['recharges'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const copyText = async (value?: string) => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success('Copied')
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="pb-4">
      <div className="brand-gradient relative overflow-hidden px-4 pb-14 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-gold/20 blur-2xl" />
        <Link to="/wallet" className="relative z-10 text-sm font-semibold text-white/80">
          ← Wallet
        </Link>
        <div className="relative z-10 mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">Deposit</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Deposit Wallet</h1>
            <p className="mt-3 text-[11px] uppercase tracking-wide text-white/65">Main Wallet</p>
            <p className="mt-0.5 text-3xl font-extrabold">{formatINR(main?.balance)}</p>
            <p className="mt-1 text-[11px] text-white/70">{formatAlternateCurrency(main?.balance)}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
            <Wallet className="h-6 w-6 text-brand-gold" />
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-10 space-y-4 px-4">
        <div className="ak-card space-y-4 p-4 shadow-[0_14px_32px_rgba(0,27,61,0.12)]">
          <div className="rounded-2xl bg-brand-primary/10 px-3 py-2.5 text-sm font-medium text-brand-primary">
            Limits: {formatINR(minDeposit)} – {formatINR(maxDeposit)}
          </div>
          <Input
            label={isUsdtMethod ? 'Enter Amount (USDT)' : 'Enter Amount (INR)'}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={minDeposit}
          />
          <div className="flex flex-wrap gap-2">
            {quick.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String(q))}
                className={cn(
                  'ak-chip',
                  Number(amount) === q ? 'brand-gradient text-white' : 'bg-brand-bg text-brand-muted'
                )}
              >
                {isUsdtMethod ? `${q} USDT` : `Rs. ${q.toLocaleString('en-IN')}`}
              </button>
            ))}
          </div>
          {amountNum > 0 ? (
            <div className="rounded-2xl bg-brand-bg px-3 py-2.5 text-sm text-brand-muted">
              {isUsdtMethod ? (
                <p>
                  You send <span className="font-semibold text-brand-text">{formatUSDT(amountNum)}</span>
                  {' · '}Wallet credit ≈{' '}
                  <span className="font-semibold text-brand-text">{formatINR(creditInr)}</span>
                  <span className="mt-0.5 block text-[11px]">
                    Rate: 1 USDT = Rs. {getUsdtInrRate()} · Display: {projectCurrency}
                  </span>
                </p>
              ) : (
                <p>
                  Wallet credit: <span className="font-semibold text-brand-text">{formatINR(creditInr)}</span>
                  {' · '}≈ {formatUSDT(creditInr / (usdtInrRate || 90))}
                </p>
              )}
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-semibold text-brand-text">Deposit Method</p>
            {methodsQuery.isLoading ? (
              <Skeleton className="h-28 rounded-2xl" />
            ) : (
              <div className="space-y-2">
                {methods.map((m: PaymentMethod) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethodId(m.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition',
                      (activeMethodId === m.id)
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-brand-primary/10 hover:bg-brand-bg'
                    )}
                  >
                    <img src={m.iconUrl} alt="" className="h-10 w-10 rounded-xl object-contain bg-white p-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-text">{m.name}</p>
                      <p className="text-[11px] text-brand-muted">
                        {m.network || m.currency}
                        {m.minDeposit ? ` · Min ${m.minDeposit}` : ''}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'h-4 w-4 rounded-full border-2',
                        activeMethodId === m.id
                          ? 'border-brand-primary bg-brand-primary'
                          : 'border-brand-muted/40'
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected ? (
            <div className="space-y-3 rounded-2xl border border-dashed border-brand-primary/20 bg-brand-bg/60 p-3">
              <p className="text-xs font-semibold text-brand-text">Pay to this account</p>
              {selected.qrCodeUrl ? (
                <div className="rounded-2xl bg-white p-4 text-center">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                    Scan QR / Barcode
                  </p>
                  <img
                    src={selected.qrCodeUrl}
                    alt={`${selected.name} QR`}
                    className="mx-auto h-44 w-44 rounded-2xl object-contain ring-1 ring-brand-primary/10"
                  />
                  <p className="mt-2 text-[11px] text-brand-muted">
                    Scan with your {selected.code === 'inr_upi' ? 'UPI' : 'USDT'} app
                  </p>
                </div>
              ) : null}
              {selected.depositAddress ? (
                <div className="rounded-2xl bg-white p-3">
                  <p className="text-[10px] text-brand-muted">{selected.network} Address</p>
                  <div className="mt-1 flex items-start gap-2">
                    <p className="flex-1 break-all text-xs font-semibold text-brand-text">
                      {selected.depositAddress}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyText(selected.depositAddress)}
                      className="rounded-xl bg-brand-primary/10 p-2 text-brand-primary"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ) : null}
              {selected.upiId ? (
                <div className="rounded-2xl bg-white p-3">
                  <p className="text-[10px] text-brand-muted">UPI ID</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="flex-1 text-sm font-semibold">{selected.upiId}</p>
                    <button
                      type="button"
                      onClick={() => copyText(selected.upiId)}
                      className="rounded-xl bg-brand-primary/10 p-2 text-brand-primary"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
              {selected.bankDetails?.accountNumber ? (
                <div className="rounded-2xl bg-white p-3 text-sm">
                  <p className="font-semibold">{selected.bankDetails.bankName}</p>
                  <p className="text-brand-muted">{selected.bankDetails.accountHolderName}</p>
                  <p className="mt-1 font-medium">A/C: {selected.bankDetails.accountNumber}</p>
                  <p className="font-medium">IFSC: {selected.bankDetails.ifscCode}</p>
                </div>
              ) : null}
              {selected.depositInstructions ? (
                <p className="text-[11px] leading-relaxed text-brand-muted">{selected.depositInstructions}</p>
              ) : null}
            </div>
          ) : null}

          <Input
            label={selected?.kind === 'crypto' ? 'Transaction Hash' : 'UTR / Reference ID'}
            placeholder={selected?.kind === 'crypto' ? '0x... / TxID' : 'Enter UTR'}
            value={proof}
            onChange={(e) => setProof(e.target.value)}
          />
          <Input
            label="Note (optional)"
            placeholder="Any extra detail for admin"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Button
            className="w-full"
            size="lg"
            loading={mutation.isPending}
            disabled={!amount || !proof || !activeMethodId}
            onClick={() => mutation.mutate()}
          >
            Submit Deposit
          </Button>
          <p className="text-center text-[11px] text-brand-muted">
            Funds credit after admin approval
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold text-brand-text">Deposit History</h2>
          <div className="space-y-2">
            {(history.data?.data || []).map(
              (item: {
                _id: string
                amount: number
                status: string
                createdAt: string
                methodCode?: string
                proofReference?: string
              }) => (
                <div key={item._id} className="ak-card flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{formatINR(item.amount)}</p>
                    <p className="text-xs text-brand-muted">
                      {(item.methodCode || 'deposit').toUpperCase()} · {formatDate(item.createdAt)}
                    </p>
                    {item.proofReference ? (
                      <p className="mt-0.5 truncate text-[10px] text-brand-muted">{item.proofReference}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              )
            )}
            {!history.data?.data?.length ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-brand-muted">No deposits yet</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
