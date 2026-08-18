import { createContext } from 'react'

import type { Theme } from '@/theme/theme'

export interface ThemeContextValue {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  cycleTheme: () => void
}

/**
 * Appearance context. Kept apart from `ThemeProvider` so the provider module
 * only exports components, which keeps React Fast Refresh working.
 *
 * Consume it through `useTheme()` rather than directly.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null)
