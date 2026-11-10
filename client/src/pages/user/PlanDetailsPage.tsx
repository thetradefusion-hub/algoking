import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchPlan, fetchWallets, purchasePlan } from '@/services/userService'
import { formatINR } from '@/lib/format'
import { getErrorMessage } from '@/services/api'
import { idempotencyKey } from '@/lib/utils'

export function PlanDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const planQuery = useQuery({
    queryKey: ['plan', id],
    queryFn: () => fetchPlan(id!),
    enabled: !!id,
  })
  const walletsQuery = useQuery({ queryKey: ['wallets'], queryFn: fetchWallets })

  const mutation = useMutation({
    mutationFn: () => purchasePlan(id!, idempotencyKey('purchase')),
    onSuccess: async () => {
      toast.success('Investment purchased')
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      await qc.invalidateQueries({ queryKey: ['orders'] })
      await qc.invalidateQueries({ queryKey: ['wallets'] })
      navigate('/orders')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (planQuery.isLoading) return <div className="p-4"><Skeleton className="h-80" /></div>
  const plan = planQuery.data
  if (!plan) return <div className="p-4">Plan not found</div>

  const mainBalance = walletsQuery.data?.wallets?.find((w) => w.walletType === 'main')?.balance || 0

  return (
    <div className="space-y-4 p-4">
      <button onClick={() => navigate(-1)} className="text-sm text-brand-accent">
        ← Back
      </button>
      <Card className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{plan.name}</h1>
          <p className="mt-2 text-sm text-brand-muted">{plan.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-brand-bg p-3">
            <p className="text-brand-muted">Investment</p>
            <p className="text-lg font-bold">{formatINR(plan.investmentAmount)}</p>
          </div>
          <div className="rounded-2xl bg-brand-bg p-3">
            <p className="text-brand-muted">Duration</p>
            <p className="text-lg font-bold">{plan.durationDays} days</p>
          </div>
          <div className="rounded-2xl bg-brand-bg p-3">
            <p className="text-brand-muted">Daily Income</p>
            <p className="font-bold">{formatINR(plan.projectedDailyIncome)}</p>
          </div>
          <div className="rounded-2xl bg-brand-bg p-3">
            <p className="text-brand-muted">Total Return</p>
            <p className="font-bold">{formatINR(plan.projectedTotalIncome)}</p>
          </div>
        </div>
        {plan.riskDisclosure ? (
          <div className="rounded-2xl border border-brand-primary/15 bg-brand-primary/5 p-3 text-sm text-brand-text">
            {plan.riskDisclosure}
          </div>
        ) : null}
        <div className="brand-gradient rounded-2xl p-3 text-white">
          <p className="text-xs text-white/70">Main wallet available</p>
          <p className="text-xl font-bold">{formatINR(mainBalance)}</p>
        </div>
        {!confirming ? (
          <Button className="w-full" size="lg" onClick={() => setConfirming(true)}>
            Invest Now →
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-brand-muted">
              Confirm debit of {formatINR(plan.investmentAmount)} from Main Wallet?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
                disabled={mainBalance < plan.investmentAmount}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
