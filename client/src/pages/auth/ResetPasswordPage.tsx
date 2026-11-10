import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import * as authService from '@/services/authService'
import { getErrorMessage } from '@/services/api'

const schema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: params.get('token') || '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await authService.resetPassword(values)
      toast.success('Password reset successful')
      navigate('/login')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  })

  return (
    <div className="rounded-[24px] bg-white p-5">
      <h2 className="text-2xl font-bold">Reset password</h2>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Input label="Reset Token" error={errors.token?.message} {...register('token')} />
        <Input label="New Password" type="password" error={errors.password?.message} {...register('password')} />
        <Input
          label="Confirm Password"
          type="password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Reset password
        </Button>
      </form>
      <Link to="/login" className="mt-4 block text-center text-sm text-brand-accent">
        Back to login
      </Link>
    </div>
  )
}
