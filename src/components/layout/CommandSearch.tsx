import { Search } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { navigation } from '@/components/layout/navigation'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useLearningAreaList } from '@/features/academic/hooks/useAcademic'
import { useLearnerList } from '@/features/learners/hooks/useLearners'
import { useStaffList } from '@/features/staff/hooks/useStaff'
import { formatPersonName } from '@/lib/format'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

interface SearchHit {
  id: string
  label: string
  hint: string
  to: string
}

function matches(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle)
}

export function CommandSearch(): ReactNode {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const staff = useStaffList()
  const learners = useLearnerList()
  const learningAreas = useLearningAreaList()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const needle = query.trim().toLowerCase()

  const pages = useMemo<SearchHit[]>(() => {
    const items = navigation.flatMap((section) =>
      section.items.map((item) => ({
        id: `page-${item.to}`,
        label: item.label,
        hint: section.title,
        to: item.to,
      })),
    )
    if (!needle) return items
    return items.filter((item) => matches(`${item.label} ${item.hint}`, needle))
  }, [needle])

  const staffHits = useMemo<SearchHit[]>(() => {
    if (!needle) return []
    return (staff.data ?? [])
      .filter((item) =>
        matches(
          [item.firstName, item.secondName, item.lastName, item.staffNumber, item.workEmail, item.department].join(' '),
          needle,
        ),
      )
      .slice(0, 6)
      .map((item) => ({
        id: `staff-${item.id}`,
        label: formatPersonName(item),
        hint: [item.staffNumber, item.department].filter(Boolean).join(' · ') || 'Staff',
        to: paths.staffDetail(item.id),
      }))
  }, [needle, staff.data])

  const learnerHits = useMemo<SearchHit[]>(() => {
    if (!needle) return []
    return (learners.data ?? [])
      .filter((item) =>
        matches(
          [item.firstName, item.middleName, item.lastName, item.admissionNumber, item.currentClass].join(' '),
          needle,
        ),
      )
      .slice(0, 6)
      .map((item) => ({
        id: `learner-${item.id}`,
        label: formatPersonName(item),
        hint: [item.admissionNumber, item.currentClass].filter(Boolean).join(' · ') || 'Learner',
        to: paths.learnerDetail(item.id),
      }))
  }, [learners.data, needle])

  const learningAreaHits = useMemo<SearchHit[]>(() => {
    if (!needle) return []
    return (learningAreas.data ?? [])
      .filter((item) => matches([item.name, item.shortName, item.knecCode].join(' '), needle))
      .slice(0, 6)
      .map((item) => ({
        id: `subject-${item.id}`,
        label: item.name,
        hint: [item.shortName, item.knecCode].filter(Boolean).join(' · ') || 'Learning area',
        to: `${paths.academics}?tab=learning-areas`,
      }))
  }, [learningAreas.data, needle])

  const go = (to: string) => {
    setOpen(false)
    void navigate(to)
  }

  const hasResults =
    pages.length > 0 || staffHits.length > 0 || learnerHits.length > 0 || learningAreaHits.length > 0

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'hidden h-10 min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/70 px-3 text-left text-muted-foreground',
          'transition-colors hover:bg-muted md:flex md:w-[min(28rem,42vw)]',
        )}
        aria-label="Search learners and staff"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="type-body flex-1 truncate">Search learners or staff…</span>
        <kbd className="type-caption hidden rounded-md border border-border bg-card px-1.5 py-0.5 font-medium text-muted-foreground lg:inline">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-accent md:hidden"
        aria-label="Search learners and staff"
      >
        <Search className="size-4" aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent hideClose className="top-[18%] max-w-lg translate-y-0 gap-0 p-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="border-b border-border p-3">
            <Input
              autoFocus
              startIcon={<Search aria-hidden="true" />}
              placeholder="Search pages, learners, or staff"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search query"
            />
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto p-2">
            {!hasResults ? (
              <p className="type-caption px-3 py-8 text-center text-muted-foreground">No matches for that search.</p>
            ) : (
              <>
                <ResultGroup title="Pages" items={pages} onSelect={go} />
                <ResultGroup title="Learners" items={learnerHits} onSelect={go} />
                <ResultGroup title="Staff" items={staffHits} onSelect={go} />
                <ResultGroup title="Learning areas" items={learningAreaHits} onSelect={go} />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ResultGroup({
  title,
  items,
  onSelect,
}: {
  title: string
  items: SearchHit[]
  onSelect: (to: string) => void
}): ReactNode {
  if (items.length === 0) return null

  return (
    <div className="mb-2">
      <p className="type-caption px-2 py-1.5 font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.to)}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-accent"
            >
              <span className="type-label text-foreground">{item.label}</span>
              <span className="type-caption truncate text-muted-foreground">{item.hint}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
