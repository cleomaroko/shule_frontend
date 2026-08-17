import { ChevronDown, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'

import type { AuthenticatedUser } from '@/auth/auth.types'
import { formatRoleLabel, getUserInitials } from '@/auth/user-display'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface UserMenuProps {
  user: AuthenticatedUser
  onSignOut: () => void
}

export function UserMenu({ user, onSignOut }: UserMenuProps): ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-lg border border-transparent p-1 pr-2 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=open]:bg-accent"
        aria-label={`Account menu for ${user.username}`}
      >
        <Avatar>
          <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
        </Avatar>
        <span className="type-label hidden max-w-36 truncate sm:block">{user.username}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="type-heading block truncate">{user.username}</span>
          <span className="type-caption block text-muted-foreground">{formatRoleLabel(user.role)}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onSelect={onSignOut}>
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
