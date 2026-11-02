import { useEffect, useRef, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'

const ACCEPT = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export function SpreadsheetFileField({
  file,
  onChange,
}: {
  file: File | null
  onChange: (file: File | null) => void
}): ReactNode {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file && inputRef.current) inputRef.current.value = ''
  }, [file])

  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:flex-1 sm:flex-row sm:items-center sm:gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <Button type="button" variant="outline" className="w-full sm:w-auto sm:shrink-0" onClick={() => inputRef.current?.click()}>
        Choose file
      </Button>
      <p className="type-caption min-w-0 truncate text-muted-foreground">{file ? file.name : 'No file selected'}</p>
    </div>
  )
}
