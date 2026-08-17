import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { TextField, type TextFieldProps } from '@/components/forms/TextField'

export type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'endAdornment'>

/**
 * Password input with a visibility toggle.
 *
 * The toggle is a real button so it is reachable by keyboard, but it is skipped
 * in the tab order (`tabIndex={-1}`) so tabbing runs label → field → submit
 * without a detour. It stays operable via click and screen-reader controls.
 */
export function PasswordField({ ...props }: PasswordFieldProps): ReactNode {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <TextField
      type={isVisible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          tabIndex={-1}
          disabled={props.disabled}
        >
          {isVisible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      }
      {...props}
    />
  )
}
