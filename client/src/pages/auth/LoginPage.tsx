import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { getErrorMessage, useAuth } from '@/context/AuthContext'
import { baseURL } from '@/services/api'
import { cn } from '@/lib/utils'

const apiMisconfigured =
  import.meta.env.PROD && (/localhost|127\.0\.0\.1/i.test(baseURL) || baseURL === '/api/v1')

const schema = z.object({
  identifier: z.string().min(3, 'Enter email or mobile'),
  password: z.string().min(1, 'Password required'),
  rememberMe: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '', rememberMe: true },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const user = await login(values.identifier, values.password)
      toast.success('Welcome back')
      navigate(user.role === 'user' ? '/dashboard' : '/admin/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed'))
    }
  })

  return (
    <div className="relative z-10 rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(0,27,61,0.12)] ring-1 ring-brand-primary/5">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-brand-text">Sign In</h2>
        <p className="mt-1.5 text-sm text-brand-muted">Access your AlgoKing account</p>
      </div>

      {apiMisconfigured ? (
        <div className="mb-4 rounded-2xl border border-brand-danger/30 bg-brand-danger/10 px-3 py-2.5 text-left text-xs text-brand-danger">
          API URL not configured for production. In Vercel set{' '}
          <span className="font-semibold">VITE_API_BASE_URL</span> to your Railway/Render API
          (…/api/v1), then Redeploy. Current: {baseURL}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-text">Mobile / Email</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-primary/70" />
            <input
              className={cn(
                'h-12 w-full rounded-2xl border border-brand-primary/10 bg-brand-bg/70 pl-10 pr-4 text-sm outline-none transition focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/15',
                errors.identifier && 'border-brand-danger'
              )}
              placeholder="you@email.com / 98xxxxxxxx"
              autoComplete="username"
              {...register('identifier')}
            />
          </div>
          {errors.identifier ? (
            <span className="text-xs text-brand-danger">{errors.identifier.message}</span>
          ) : null}
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-text">Password</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-primary/70" />
            <input
              type={show ? 'text' : 'password'}
              className={cn(
                'h-12 w-full rounded-2xl border border-brand-primary/10 bg-brand-bg/70 pl-10 pr-11 text-sm outline-none transition focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/15',
                errors.password && 'border-brand-danger'
              )}
              placeholder="Enter your password"
              autoComplete="current-password"
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <span className="text-xs text-brand-danger">{errors.password.message}</span>
          ) : null}
        </label>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-brand-muted">
            <input type="checkbox" className="rounded accent-brand-primary" {...register('rememberMe')} />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-brand-primary">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Login
        </Button>
      </form>

      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-brand-bg px-3 py-2.5 text-[11px] text-brand-muted">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-success" />
        Your login is protected with secure encryption
      </div>

      <p className="mt-5 text-center text-sm text-brand-muted">
        New to AlgoKing?{' '}
        <Link to="/register" className="font-semibold text-brand-primary">
          Create account
        </Link>
      </p>
    </div>
  )
}
