import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { ThemeContext, type ThemeContextValue } from '@/theme/theme.context'
import {
  applyTheme,
  readStoredTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from '@/theme/theme'

const CYCLE: Theme[] = ['light', 'dark', 'system']

export function ThemeProvider({ children }: { children: ReactNode }): ReactNode {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof window === 'undefined' ? 'system' : readStoredTheme(),
  )
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    typeof window === 'undefined' ? 'light' : applyTheme(readStoredTheme()),
  )

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* private mode */
    }
    setResolved(applyTheme(next))
  }, [])

  const cycleTheme = useCallback(() => {
    const index = CYCLE.indexOf(theme)
    setTheme(CYCLE[(index + 1) % CYCLE.length] ?? 'system')
  }, [setTheme, theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (readStoredTheme() === 'system') {
        setResolved(applyTheme('system'))
      }
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolved, setTheme, cycleTheme }),
    [theme, resolved, setTheme, cycleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
