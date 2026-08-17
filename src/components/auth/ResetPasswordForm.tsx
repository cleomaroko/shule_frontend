import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Hash, KeyRound, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { authService } from '@/auth/auth.service'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/auth/auth.schemas'
import { PasswordField } from '@/components/forms/PasswordField'
import { TextField } from '@/components/forms/TextField'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { paths } from '@/routes/paths'

/** Email handed over by the forgot-password step. */
interface ResetLocationState {
  email?: string
}

/**
 * Step two of the reset flow: exchanges the emailed code for a new password.
 * Backed by `POST /api/auth/reset-password`.
 */
export function ResetPasswordForm(): ReactNode {
  const navigate = useNavigate()
  const location = useLocation()

  const presetEmail = (location.state as ResetLocationState | null)?.email ?? ''

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: presetEmail, code: '', newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
  })

  const resetMutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      authService.resetPassword({
        email: values.email,
        code: values.code,
        newPassword: values.newPassword,
        // Required by the controller, which compares the two server-side.
        confirmPassword: values.confirmPassword,
      }),
    onSuccess: () => {
      toast.success('Password updated', { description: 'Sign in with your new password.' })
      navigate(paths.login, { replace: true })
    },
    onError: (error: unknown) => logger.error('Password reset failed', error),
  })

  const isSubmitting = resetMutation.isPending

  const onSubmit = form.handleSubmit((values) => {
    if (resetMutation.isPending) return
    resetMutation.mutate(values)
  })

  return (
    <section aria-labelledby="reset-heading">
      <header className="mb-7">
        <h1 id="reset-heading" className="type-page-title">
          Choose a new password
        </h1>
        <p className="type-body mt-1.5 text-muted-foreground">
          Enter the 6-digit code we emailed you, then set a new password. The code expires 10 minutes after it was
          sent.
        </p>
      </header>

      <div aria-live="polite">
        {resetMutation.isError ? (
          <Alert variant="error" className="mb-5">
            {toUserMessage(resetMutation.error)}
          </Alert>
        ) : null}
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <TextField
          label="Email address"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@school.ac.ke"
          startIcon={<Mail />}
          disabled={isSubmitting}
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />

        <TextField
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          startIcon={<Hash />}
          className="tracking-[0.35em]"
          disabled={isSubmitting}
          error={form.formState.errors.code?.message}
          {...form.register('code')}
        />

        <PasswordField
          label="New password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          startIcon={<KeyRound />}
          disabled={isSubmitting}
          error={form.formState.errors.newPassword?.message}
          {...form.register('newPassword')}
        />

        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          enterKeyHint="go"
          placeholder="Re-enter your new password"
          startIcon={<KeyRound />}
          disabled={isSubmitting}
          error={form.formState.errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />

        <Button type="submit" size="lg" block isLoading={isSubmitting} loadingLabel="Updating password" className="mt-1">
          Update password
        </Button>
      </form>

      <div className="mt-7 flex flex-col items-center gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link to={paths.forgotPassword}>
            <ArrowLeft aria-hidden="true" />
            Request a new code
          </Link>
        </Button>
      </div>
    </section>
  )
}
