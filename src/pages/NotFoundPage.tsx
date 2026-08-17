import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { DiraWordmark } from '@/components/branding/DiraWordmark'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { DEFAULT_AUTHENTICATED_PATH, paths } from '@/routes/paths'

export function NotFoundPage(): ReactNode {
  useDocumentTitle('Page not found')

  const { isAuthenticated } = useAuth()
  const destination = isAuthenticated ? DEFAULT_AUTHENTICATED_PATH : paths.login

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-5 text-center">
      <DiraWordmark size="sm" />

      <div className="flex flex-col gap-2">
        <p className="type-caption font-semibold uppercase tracking-widest text-muted-foreground">Error 404</p>
        <h1 className="type-page-title">We can’t find that page</h1>
        <p className="type-body max-w-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
      </div>

      <Button asChild variant="secondary">
        <Link to={destination}>{isAuthenticated ? 'Back to workspace' : 'Back to sign in'}</Link>
      </Button>
    </div>
  )
}
