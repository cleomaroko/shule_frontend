import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { authService } from '@/auth/auth.service'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/auth/auth.schemas'
import { TextField } from '@/components/forms/TextField'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { paths } from '@/routes/paths'

/**
 * Step one of the reset flow: asks the backend to email a 6-digit code.
 * Backed by `POST /api/auth/forgot-password`.
 */
export function ForgotPasswordForm(): ReactNode {
  const navigate = useNavigate()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  })

  const requestMutation = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) => authService.requestPasswordReset({ email: values.email }),
    onSuccess: (_message, values) => {
      // Carry the address forward so it does not have to be retyped.
      navigate(paths.resetPassword, { state: { email: values.email } })
    },
    onError: (error: unknown) => logger.error('Password reset request failed', error),
  })

  const isSubmitting = requestMutation.isPending

  const onSubmit = form.handleSubmit((values) => {
    if (requestMutation.isPending) return
    requestMutation.mutate(values)
  })

  return (
    <section aria-labelledby="forgot-heading">
      <header className="mb-7">
        <h1 id="forgot-heading" className="type-page-title">
          Reset your password
        </h1>
        <p className="type-body mt-1.5 text-muted-foreground">
          Enter the email address on your Dira account and we will send you a 6-digit verification code.
        </p>
      </header>

      <div aria-live="polite">
        {requestMutation.isError ? (
          <Alert variant="error" className="mb-5">
            {toUserMessage(requestMutation.error)}
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
          enterKeyHint="send"
          placeholder="you@school.ac.ke"
          startIcon={<Mail />}
          disabled={isSubmitting}
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />

        <Button type="submit" size="lg" block isLoading={isSubmitting} loadingLabel="Sending code" className="mt-1">
          Send verification code
        </Button>
      </form>

      <div className="mt-7 flex justify-center">
        <Button asChild variant="ghost" size="sm">
          <Link to={paths.login}>
            <ArrowLeft aria-hidden="true" />
            Back to sign in
          </Link>
        </Button>
      </div>
    </section>
  )
}
