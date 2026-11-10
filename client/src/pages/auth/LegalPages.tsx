import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchPublicSettings } from '@/services/userService'
import { Card } from '@/components/ui/Card'

export function TermsPage() {
  const { data } = useQuery({ queryKey: ['public-settings'], queryFn: fetchPublicSettings })
  return (
    <Card className="space-y-3">
      <h2 className="text-xl font-bold">Terms & Conditions</h2>
      <p className="text-sm leading-relaxed text-brand-muted whitespace-pre-wrap">
        {data?.terms || 'Loading…'}
      </p>
      <Link to="/register" className="text-sm font-semibold text-brand-accent">
        Back
      </Link>
    </Card>
  )
}

export function PrivacyPage() {
  const { data } = useQuery({ queryKey: ['public-settings'], queryFn: fetchPublicSettings })
  return (
    <Card className="space-y-3">
      <h2 className="text-xl font-bold">Privacy Policy</h2>
      <p className="text-sm leading-relaxed text-brand-muted whitespace-pre-wrap">
        {data?.privacy || 'Loading…'}
      </p>
      <Link to="/register" className="text-sm font-semibold text-brand-accent">
        Back
      </Link>
    </Card>
  )
}
