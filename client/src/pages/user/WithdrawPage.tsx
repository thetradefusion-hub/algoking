import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { HandCoins, UsersRound, Wallet, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  fetchBanks,
  fetchPaymentMethods,
  fetchWallets,
  fetchWithdrawals,
  requestWithdrawal,
  type PaymentMethod,
} from '@/services/userService'
import { formatAlternateCurrency, formatDate, formatINR, formatUSDT, getUsdtInrRate } from '@/lib/format'
import { inrToUsdt } from '@/lib/currencyStore'
import { useCurrency } from '@/context/CurrencyContext'
import { getErrorMessage } from '@/services/api'
import { cn, idempotencyKey } from '@/lib/utils'
import type { Wallet as WalletType } from '@/types'

type WalletKey = 'main' | 'income' | 'referral'

const WALLET_OPTIONS: Array<{
  key: WalletKey
  label: string
  hint: string
  icon: typeof Wallet
}> = [
  { key: 'main', label: 'Main Wallet', hint: 'Deposit / invest balance', icon: WalletCards },
  { key: 'income', label: 'Income Wallet', hint: 'ROI / earnings', icon: HandCoins },
  { key: 'referral', label: 'Referral Wallet', hint: 'Team commissions', icon: UsersRound },
]

function resolveWalletParam(value: string | null): WalletKey {
  if (value === 'main' || value === 'income' || value === 'referral') return value
  return 'income'
}

export function WithdrawPage() {
  const [searchParams] = useSearchParams()
  const [walletType, setWalletType] = useState<WalletKey>(() =>
    resolveWalletParam(searchParams.get('wallet'))
  )
  const [amount, setAmount] = useState('2000')
  const [methodId, setMethodId] = useState('')
  const [bankAccountId, setBankAccountId] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [destinationUpi, setDestinationUpi] = useState('')
  const qc = useQueryClient()
  const { usdtInrRate } = useCurrency()

  const wallets = useQuery({ queryKey: ['wallets'], queryFn: fetchWallets })
  const banks = useQuery({ queryKey: ['banks'], queryFn: fetchBanks })
  const methodsQuery = useQuery({
    queryKey: ['payment-methods', 'withdraw'],
    queryFn: () => fetchPaymentMethods('withdraw'),
  })
  const history = useQuery({ queryKey: ['withdrawals'], queryFn: () => fetchWithdrawals() })

  const walletList = (wallets.data?.wallets || []) as WalletType[]
  const selectedWallet = walletList.find((w) => w.walletType === walletType)
  const balance = Number(selectedWallet?.balance || 0)

  const methods = methodsQuery.data || []
  const selected = useMemo(
    () => methods.find((m) => m.id === methodId) || methods[0],
    [methods, methodId]
  )
  const activeMethodId = methodId || selected?.id || ''

  const fee = Number(selected?.withdrawFee ?? wallets.data?.limits?.withdrawalFee ?? 0)
  const minWithdrawal = Number(selected?.minWithdraw ?? wallets.data?.limits?.minWithdrawal ?? 500)
  const amountNum = Number(amount || 0)
  const net = Math.max(amountNum - fee, 0)
  const isUsdtMethod = selected?.currency === 'USDT'
  const payoutUsdt = inrToUsdt(net, usdtInrRate)
  const insufficient = amountNum > 0 && amountNum > balance

  const canSubmit = (() => {
    if (!amount || !activeMethodId || insufficient) return false
    if (amountNum < minWithdrawal) return false
    if (selected?.code === 'bep20' || selected?.code === 'trc20') return !!destinationAddress.trim()
    if (selected?.code === 'inr_upi') return !!destinationUpi.trim()
    if (selected?.code === 'inr_bank') return !!bankAccountId
    return false
  })()

  const mutation = useMutation({
    mutationFn: () =>
      requestWithdrawal({
        amount: amountNum,
        walletType,
        paymentMethodId: activeMethodId,
        bankAccountId: selected?.code === 'inr_bank' ? bankAccountId : undefined,
        destinationAddress:
          selected?.code === 'bep20' || selected?.code === 'trc20' ? destinationAddress : undefined,
        destinationUpi: selected?.code === 'inr_upi' ? destinationUpi : undefined,
        idempotencyKey: idempotencyKey('withdraw'),
      }),
    onSuccess: async () => {
      toast.success('Withdrawal submitted — waiting for admin approval')
      setDestinationAddress('')
      setDestinationUpi('')
      await qc.invalidateQueries({ queryKey: ['wallets'] })
      await qc.invalidateQueries({ queryKey: ['withdrawals'] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div className="pb-4">
      <div className="brand-gradient relative overflow-hidden px-4 pb-14 pt-5 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand-gold/20 blur-2xl" />
        <Link to="/wallet" className="relative z-10 text-sm font-semibold text-white/80">
          ← Wallet
        </Link>
        <div className="relative z-10 mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">Payout</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Withdraw Funds</h1>
            <p className="mt-3 text-[11px] uppercase tracking-wide text-white/65">
              {WALLET_OPTIONS.find((w) => w.key === walletType)?.label || 'Wallet'}
            </p>
            <p className="mt-0.5 text-3xl font-extrabold">{formatINR(balance)}</p>
            <p className="mt-1 text-[11px] text-white/70">{formatAlternateCurrency(balance)}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
            <Wallet className="h-6 w-6 text-brand-gold" />
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-10 space-y-4 px-4">
        <div className="ak-card space-y-4 p-4 shadow-[0_14px_32px_rgba(0,27,61,0.12)]">
          <div>
            <p className="mb-2 text-sm font-semibold text-brand-text">Withdraw from</p>
            <div className="grid gap-2">
              {WALLET_OPTIONS.map(({ key, label, hint, icon: Icon }) => {
                const bal = Number(walletList.find((w) => w.walletType === key)?.balance || 0)
                const active = walletType === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setWalletType(key)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition',
                      active
                        ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/20'
                        : 'border-brand-primary/10 hover:bg-brand-bg'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl',
                        active ? 'bg-brand-primary text-white' : 'bg-brand-bg text-brand-primary'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-text">{label}</p>
                      <p className="text-[11px] text-brand-muted">{hint}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-text">{formatINR(bal)}</p>
                      <p className="text-[10px] text-brand-muted">{formatAlternateCurrency(bal)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-brand-primary/10 px-3 py-2.5 text-sm font-medium text-brand-primary">
            Minimum Withdrawal: {formatINR(minWithdrawal)}
            {wallets.data?.limits?.withdrawalProcessingTime
              ? ` · ${wallets.data.limits.withdrawalProcessingTime}`
              : ''}
          </div>

          <Input
            label="Enter Withdrawal Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {insufficient ? (
            <p className="text-xs font-medium text-brand-danger">
              Insufficient {WALLET_OPTIONS.find((w) => w.key === walletType)?.label} balance
            </p>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-semibold text-brand-text">Withdraw Method</p>
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
                      activeMethodId === m.id
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-brand-primary/10 hover:bg-brand-bg'
                    )}
                  >
                    <img src={m.iconUrl} alt="" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-text">{m.name}</p>
                      <p className="text-[11px] text-brand-muted">
                        {m.network || m.currency}
                        {m.withdrawFee ? ` · Fee ${m.withdrawFee}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected?.withdrawInstructions ? (
            <p className="rounded-2xl bg-brand-bg px-3 py-2 text-[11px] text-brand-muted">
              {selected.withdrawInstructions}
            </p>
          ) : null}

          {(selected?.code === 'bep20' || selected?.code === 'trc20') && (
            <Input
              label={`${selected.network} Wallet Address`}
              placeholder="Paste your USDT address"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
            />
          )}

          {selected?.code === 'inr_upi' && (
            <Input
              label="Your UPI ID"
              placeholder="name@upi"
              value={destinationUpi}
              onChange={(e) => setDestinationUpi(e.target.value)}
            />
          )}

          {selected?.code === 'inr_bank' && (
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold">Withdraw To Bank</span>
              <select
                className="h-12 w-full rounded-2xl border border-brand-primary/10 bg-white px-3"
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
              >
                <option value="">Select account</option>
                {(banks.data || []).map(
                  (b: { id: string; bankName: string; accountNumberMasked: string; isPrimary: boolean }) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} · {b.accountNumberMasked}
                      {b.isPrimary ? ' (Primary)' : ''}
                    </option>
                  )
                )}
              </select>
              {!banks.data?.length ? (
                <Link to="/profile/banks" className="text-sm font-medium text-brand-primary">
                  Add a bank account first →
                </Link>
              ) : null}
            </label>
          )}

          <div className="rounded-2xl bg-brand-bg p-3 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-brand-muted">From wallet</span>
              <span className="capitalize font-medium">{walletType}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-brand-muted">Withdrawal Amount</span>
              <span>{formatINR(amountNum)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-brand-muted">Processing Fee</span>
              <span className="text-brand-danger">-{formatINR(fee)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-white py-2 font-bold">
              <span>Net Payout</span>
              <span className="text-brand-success">{formatINR(net)}</span>
            </div>
            {isUsdtMethod ? (
              <div className="flex justify-between py-1 text-xs">
                <span className="text-brand-muted">≈ USDT payout (rate Rs. {getUsdtInrRate()})</span>
                <span className="font-semibold text-brand-primary">{formatUSDT(payoutUsdt)}</span>
              </div>
            ) : (
              <div className="flex justify-between py-1 text-xs text-brand-muted">
                <span>≈ USDT</span>
                <span>{formatUSDT(payoutUsdt)}</span>
              </div>
            )}
          </div>

          <Button
            className="w-full"
            size="lg"
            loading={mutation.isPending}
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
          >
            Request Withdrawal
          </Button>
          <p className="text-center text-[11px] text-brand-muted">
            Amount is reserved from the selected wallet until admin approval
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold text-brand-text">Withdrawal History</h2>
          <div className="space-y-2">
            {(history.data?.data || []).map(
              (item: {
                _id: string
                amount: number
                netAmount: number
                status: string
                createdAt: string
                methodCode?: string
                walletType?: string
              }) => (
                <div key={item._id} className="ak-card flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{formatINR(item.amount)}</p>
                    <p className="text-xs text-brand-muted">
                      Net {formatINR(item.netAmount)} · {(item.walletType || 'income').toUpperCase()} ·{' '}
                      {(item.methodCode || 'bank').toUpperCase()} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              )
            )}
            {!history.data?.data?.length ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-brand-muted">No withdrawals yet</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
