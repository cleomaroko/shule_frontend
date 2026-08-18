import { Menu } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import type { AuthenticatedUser } from '@/auth/auth.types'
import { formatRoleLabel, getGreetingName } from '@/auth/user-display'
import { DiraMark } from '@/components/branding/DiraMark'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { CommandSearch } from '@/components/layout/CommandSearch'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { UserMenu } from '@/components/layout/UserMenu'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { env } from '@/lib/env'

export interface AppHeaderProps {
  user: AuthenticatedUser
  onSignOut: () => void
}

export function AppHeader({ user, onSignOut }: AppHeaderProps): ReactNode {
  const [open, setOpen] = useState(false)
  const greetingName = getGreetingName(user)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md dark:bg-background/90">
      <div className="flex h-[4.25rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu aria-hidden="true" />
            </Button>
            <SheetContent side="left" className="border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <AppSidebar user={user} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden min-w-0 flex-1 lg:block">
          <p className="type-heading truncate">Welcome back, {greetingName}</p>
          <p className="type-caption truncate text-muted-foreground">
            Signed in as {formatRoleLabel(user.role)}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2 lg:flex-none">
          <CommandSearch />
          <ThemeToggle />
          <UserMenu user={user} onSignOut={onSignOut} />

          <div className="ml-1 hidden items-center gap-2.5 border-l border-border pl-3 xl:flex">
            <DiraMark className="size-8" tone="brand" />
            <div className="min-w-0">
              <p className="type-label truncate">{env.appName}</p>
              <p className="type-caption truncate text-muted-foreground">School Management System</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
