import { useEffect } from 'react'

import { env } from '@/lib/env'

/** Sets the document title, suffixed with the product name. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · ${env.appName}`

    return () => {
      document.title = previous
    }
  }, [title])
}
