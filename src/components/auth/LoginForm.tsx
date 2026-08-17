import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, KeyRound, User } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { loginSchema, type LoginFormValues } from '@/auth/auth.schemas'
import { useAuth } from '@/auth/useAuth'
import { PasswordField } from '@/components/forms/PasswordField'
import { TextField } from '@/components/forms/TextField'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { logger } from '@/lib/logger'
import { DEFAULT_AUTHENTICATED_PATH, paths } from '@/routes/paths'

/** Route state written by `ProtectedRoute` when it deflects an unauthenticated visit. */
interface LocationState {
  from?: { pathname?: string }
}

export function LoginForm(): ReactNode {
  const { login, logoutReason, acknowledgeLogoutReason } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const rememberMeId = useId()

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? DEFAULT_AUTHENTICATED_PATH

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', rememberMe: true },
    mode: 'onSubmit',
  })

  // Captured on first render and owned locally, so the notice survives the
  // acknowledgement below and is not tied to how often effects run.
  const [showExpiryNotice] = useState(() => logoutReason === 'expired')

  // Consume the reason immediately: it explains this visit only, and must not
  // reappear if the user navigates back to this screen later.
  useEffect(() => {
    if (logoutReason !== null) acknowledgeLogoutReason()
  }, [logoutReason, acknowledgeLogoutReason])

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      login({
        username: values.username,
        password: values.password,
        rememberMe: values.rememberMe,
      }),
    onSuccess: (session) => {
      toast.success(`Welcome back, ${session.user.username}`)
      navigate(redirectTo, { replace: true })
    },
    onError: (error: unknown) => {
      // Users see normalised copy; the technical cause stays in the dev console.
      logger.error('Sign-in failed', error)
      form.setValue('password', '', { shouldValidate: false })
      form.setFocus('password')
    },
  })

  const isSubmitting = loginMutation.isPending

  const onSubmit = form.handleSubmit((values) => {
    // Guards against a second submission while the first is still in flight.
    if (loginMutation.isPending) return
    loginMutation.mutate(values)
  })

  return (
    <section aria-labelledby="login-heading">
      <header className="mb-7">
        <h1 id="login-heading" className="type-page-title">
          Welcome back
        </h1>
        <p className="type-body mt-1.5 text-muted-foreground">Sign in to continue to your Dira workspace.</p>
      </header>

      {/* Announces asynchronous outcomes without stealing focus from the form. */}
      <div aria-live="polite" className="empty:hidden">
        {showExpiryNotice && !loginMutation.isError ? (
          <Alert variant="warning" className="mb-5">
            Your session has expired for security. Please sign in again.
          </Alert>
        ) : null}

        {loginMutation.isError ? (
          <Alert variant="error" className="mb-5">
            {toUserMessage(loginMutation.error)}
          </Alert>
        ) : null}
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <TextField
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="next"
          placeholder="Your Dira username"
          startIcon={<User />}
          disabled={isSubmitting}
          error={form.formState.errors.username?.message}
          {...form.register('username')}
        />

        <PasswordField
          label="Password"
          autoComplete="current-password"
          enterKeyHint="go"
          placeholder="Enter your password"
          startIcon={<KeyRound />}
          disabled={isSubmitting}
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />

        {/*
          The reset link sits after the password field in the DOM so tabbing runs
          username → password → remember → reset → submit, rather than diverting
          out of the form between the two credential fields.
        */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Controller
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <Checkbox
                  id={rememberMeId}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  onBlur={field.onBlur}
                  disabled={isSubmitting}
                />
              )}
            />
            <Label htmlFor={rememberMeId} className="text-muted-foreground">
              Keep me signed in
            </Label>
          </div>

          <Link
            to={paths.forgotPassword}
            className="type-caption rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          block
          isLoading={isSubmitting}
          loadingLabel="Signing in"
          className="mt-1"
        >
          Sign in
          {/* Absolute so the label stays optically centred in the button. */}
          <ArrowRight className="absolute right-4 opacity-70" aria-hidden="true" />
        </Button>
      </form>

      <p className="type-caption mt-7 text-center text-muted-foreground">
        Accounts are issued by your school.{' '}
        <span className="text-foreground">Contact your administrator</span> for access.
      </p>
    </section>
  )
}
