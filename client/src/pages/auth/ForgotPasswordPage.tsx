import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import * as authService from '@/services/authService'
import { getErrorMessage } from '@/services/api'

const schema = z.object({ email: z.string().email() })

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await authService.forgotPassword(values.email)
      toast.success(res.message || 'If the account exists, instructions were sent')
      if (res.data?.resetToken) {
        toast.message(`Reset token: ${res.data.resetToken}`)
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  })

  return (
    <div className="rounded-[24px] bg-white p-5">
      <h2 className="text-2xl font-bold">Forgot password</h2>
      <p className="mt-1 text-sm text-brand-muted">Enter your registered email to reset password.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>
      <Link to="/login" className="mt-4 block text-center text-sm text-brand-accent">
        Back to login
      </Link>
    </div>
  )
}
