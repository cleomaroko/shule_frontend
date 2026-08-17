import { CheckCircle2, LogOut, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { ReactNode } from 'react'

import { formatRoleLabel } from '@/auth/user-display'
import { useAuth } from '@/auth/useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getTokenExpiryMs } from '@/lib/jwt'

function formatExpiry(expiresAtMs: number | null): string {
  if (expiresAtMs === null) return 'No expiry in token'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(expiresAtMs))
}

/**
 * Post-authentication landing page.
 *
 * Deliberately not a dashboard: authentication is the only implemented backend
 * module, so this confirms the session and offers sign-out and nothing more.
 */
export function AppPlaceholderPage(): ReactNode {
  useDocumentTitle('Workspace')

  const { user, token, logout } = useAuth()
  if (!user || !token) return null

  const handleSignOut = () => {
    logout('user')
    toast.success('Signed out', { description: 'You have been signed out of Dira.' })
  }

  const details = [
    { label: 'Username', value: user.username },
    { label: 'Role', value: formatRoleLabel(user.role) },
    { label: 'Session expires', value: formatExpiry(getTokenExpiryMs(token)) },
  ]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-7 flex flex-col gap-3">
        <Badge variant="success" className="w-fit">
          <CheckCircle2 aria-hidden="true" />
          Signed in
        </Badge>
        <h1 className="type-page-title">You are authenticated</h1>
        <p className="type-body max-w-xl text-muted-foreground">
          Your credentials were verified by the Dira backend and a session token is active in this browser.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-0 p-0">
          <dl className="divide-y divide-border">
            {details.map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:gap-6">
                <dt className="type-label w-48 shrink-0 text-muted-foreground">{label}</dt>
                <dd className="type-body min-w-0 break-words font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <Separator />

          <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="type-caption flex items-start gap-2 text-muted-foreground sm:items-center">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 sm:mt-0" aria-hidden="true" />
              ERP modules are not built yet — only authentication is available.
            </p>
            <Button variant="secondary" onClick={handleSignOut} className="sm:shrink-0">
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
