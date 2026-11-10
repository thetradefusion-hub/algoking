import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Gift, Lock, Mail, Phone, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { getErrorMessage, useAuth } from '@/context/AuthContext'
import { fetchPublicSettings } from '@/services/userService'
import { cn } from '@/lib/utils'

const schema = z
  .object({
    fullName: z.string().min(2, 'Enter full name'),
    mobile: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit mobile required'),
    email: z.string().email('Enter valid email'),
    password: z.string().min(8, 'Min 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password'),
    referralCode: z.string().optional(),
    acceptTerms: z.boolean().refine((v) => v === true, 'Accept terms to continue'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

function Field({
  label,
  icon: Icon,
  error,
  children,
}: {
  label: string
  icon: typeof User
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-brand-text">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-primary/70" />
        {children}
      </div>
      {error ? <span className="text-xs text-brand-danger">{error}</span> : null}
    </label>
  )
}

const inputClass = (hasError?: boolean) =>
  cn(
    'h-12 w-full rounded-2xl border border-brand-primary/10 bg-brand-bg/70 pl-10 pr-4 text-sm outline-none transition focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/15',
    hasError && 'border-brand-danger'
  )

export function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: fetchPublicSettings,
    staleTime: 60_000,
  })
  const registrationClosed = settings?.registrationOpen === false
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      referralCode: params.get('ref') || '',
      acceptTerms: false,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    if (registrationClosed) {
      toast.error('New registrations are temporarily closed')
      return
    }
    try {
      await registerUser({
        ...values,
        acceptTerms: true as const,
        referralCode: values.referralCode || undefined,
      })
      toast.success('Account created')
      navigate('/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'))
    }
  })

  if (registrationClosed) {
    return (
      <div className="relative z-10 rounded-[28px] bg-white p-5 text-center shadow-[0_20px_50px_rgba(0,27,61,0.12)] ring-1 ring-brand-primary/5">
        <h2 className="text-2xl font-extrabold text-brand-text">Registrations Closed</h2>
        <p className="mt-2 text-sm text-brand-muted">
          New signups are temporarily unavailable. Please check back later
          {settings?.supportEmail ? ` or contact ${settings.supportEmail}` : ''}.
        </p>
        <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-brand-primary">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="relative z-10 rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(0,27,61,0.12)] ring-1 ring-brand-primary/5">
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-extrabold text-brand-text">Create Account</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Join {settings?.platformName || 'AlgoKing'} in a few easy steps
        </p>
      </div>

      <form className="space-y-3.5" onSubmit={onSubmit}>
        <Field label="Full Name" icon={User} error={errors.fullName?.message}>
          <input className={inputClass(!!errors.fullName)} placeholder="Your full name" {...register('fullName')} />
        </Field>

        <Field label="Mobile Number" icon={Phone} error={errors.mobile?.message}>
          <input className={inputClass(!!errors.mobile)} placeholder="10-digit mobile" {...register('mobile')} />
        </Field>

        <Field label="Email Address" icon={Mail} error={errors.email?.message}>
          <input
            type="email"
            className={inputClass(!!errors.email)}
            placeholder="you@email.com"
            {...register('email')}
          />
        </Field>

        <Field label="Password" icon={Lock} error={errors.password?.message}>
          <input
            type={showPassword ? 'text' : 'password'}
            className={cn(inputClass(!!errors.password), 'pr-11')}
            placeholder="Min 8 characters"
            {...register('password')}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted"
            onClick={() => setShowPassword((s) => !s)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Field>

        <Field label="Confirm Password" icon={Lock} error={errors.confirmPassword?.message}>
          <input
            type={showConfirm ? 'text' : 'password'}
            className={cn(inputClass(!!errors.confirmPassword), 'pr-11')}
            placeholder="Re-enter password"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted"
            onClick={() => setShowConfirm((s) => !s)}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Field>

        <Field label="Referral Code (optional)" icon={Gift} error={errors.referralCode?.message}>
          <input
            className={inputClass(!!errors.referralCode)}
            placeholder="Enter referral code"
            {...register('referralCode')}
          />
        </Field>

        <label className="flex items-start gap-2 rounded-2xl bg-brand-bg/80 px-3 py-3 text-sm text-brand-muted">
          <input type="checkbox" className="mt-0.5 accent-brand-primary" {...register('acceptTerms')} />
          <span>
            I accept the{' '}
            <Link to="/terms" className="font-semibold text-brand-primary">
              Terms
            </Link>{' '}
            &{' '}
            <Link to="/privacy" className="font-semibold text-brand-primary">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.acceptTerms ? <p className="text-xs text-brand-danger">{errors.acceptTerms.message}</p> : null}

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Create Account
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-brand-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-primary">
          Login
        </Link>
      </p>
    </div>
  )
}
