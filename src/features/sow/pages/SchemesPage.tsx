import { ExternalLink, Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { SearchField } from '@/components/data/FilterBar'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  academicTermLabel,
  formatAcademicYearDisplay,
  resolveCurrentAcademicYear,
  resolveCurrentTerm,
} from '@/features/academic/types/academic.types'
import { useAcademicTermList, useAcademicYearList, useClassList, useLearningAreaList } from '@/features/academic/hooks/useAcademic'
import { useCampuses } from '@/features/lookups/useLookups'
import { useTeacherList } from '@/features/staff/hooks/useStaff'
import { useSowMutations, useSowReport } from '@/features/sow/hooks/useSow'
import {
  SOW_FILTER_ORDER,
  type SchemeOfWork,
  type SchemeOfWorkPayload,
  type SowFilterDimension,
  type SowReportQuery,
} from '@/features/sow/types/sow.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, formatClassLabel, formatPersonName } from '@/lib/format'

const PAGE_SIZE = 10

const FILTER_LABELS: Record<SowFilterDimension, string> = {
  teacherId: 'Teacher',
  classId: 'Class',
  termId: 'Term',
  campusId: 'Campus',
  subjectId: 'Learning area',
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function SchemesPage(): ReactNode {
  useDocumentTitle('Schemes of work')
  const { user } = useAuth()
  const canUpload = can(user?.role, 'sow:upload')
  const [dimension, setDimension] = useState<SowFilterDimension | ''>('')
  const [filterValue, setFilterValue] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)

  const reportQuery: SowReportQuery | undefined =
    dimension && filterValue ? { [dimension]: Number(filterValue) } : undefined
  const list = useSowReport(reportQuery)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (list.data ?? []).filter((row) => {
      if (!needle) return true
      return [
        row.teacher ? formatPersonName(row.teacher) : '',
        row.campus?.name,
        row.schoolClass ? formatClassLabel(row.schoolClass) : '',
        row.subject?.name,
        row.term?.name,
        row.academicYear?.name,
        row.remarks,
        row.documentLink,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [list.data, query])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: Array<DataColumn<SchemeOfWork>> = [
    {
      id: 'teacher',
      header: 'Teacher',
      cell: (row) => (row.teacher ? formatPersonName(row.teacher) : '—'),
    },
    {
      id: 'class',
      header: 'Class',
      cell: (row) => (row.schoolClass ? formatClassLabel(row.schoolClass) : '—'),
    },
    { id: 'subject', header: 'Learning area', cell: (row) => displayValue(row.subject?.name) },
    { id: 'term', header: 'Term', hideOnMobile: true, cell: (row) => displayValue(row.term?.name) },
    { id: 'campus', header: 'Campus', hideOnMobile: true, cell: (row) => displayValue(row.campus?.name) },
    {
      id: 'link',
      header: 'Document',
      cell: (row) =>
        row.documentLink ? (
          <a
            href={row.documentLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Open
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ) : (
          '—'
        ),
    },
  ]

  if (list.isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Schemes of work" description="Teacher schemes stored as document links." />
        <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Schemes of work"
        description="Upload a Google Drive, Dropbox, or other HTTPS link. The report API applies only one filter at a time (teacher, class, term, campus, or subject)."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="Filter by"
          value={dimension}
          onChange={(value) => {
            setDimension(value as SowFilterDimension | '')
            setFilterValue('')
            setPage(1)
          }}
          options={SOW_FILTER_ORDER.map((item) => ({ value: item, label: FILTER_LABELS[item] }))}
          emptyLabel="All schemes"
        />
        {dimension ? (
          <SowFilterValueSelect
            dimension={dimension}
            value={filterValue}
            onChange={(value) => {
              setFilterValue(value)
              setPage(1)
            }}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search teacher, class, or subject" />
        {canUpload ? (
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" />
            Upload scheme
          </Button>
        ) : (
          <p className="type-caption text-muted-foreground">Only teacher, admin, or head roles can upload.</p>
        )}
      </div>

      {filtered.length === 0 && !list.isLoading ? (
        <EmptyState
          title="No schemes of work"
          description="GET /api/sow/report returns all rows when no filter is set. Upload a document link to add one."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="type-heading truncate">{row.subject?.name ?? 'Scheme of work'}</p>
                <p className="type-caption text-muted-foreground">
                  {row.teacher ? formatPersonName(row.teacher) : '—'}
                  {row.schoolClass ? ` · ${formatClassLabel(row.schoolClass)}` : ''}
                </p>
              </div>
              {row.documentLink ? (
                <a href={row.documentLink} target="_blank" rel="noreferrer" className="type-caption text-primary">
                  Open
                </a>
              ) : null}
            </div>
          )}
        />
      )}

      <UploadDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

function SowFilterValueSelect({
  dimension,
  value,
  onChange,
}: {
  dimension: SowFilterDimension
  value: string
  onChange: (value: string) => void
}): ReactNode {
  const teachers = useTeacherList()
  const classes = useClassList()
  const terms = useAcademicTermList()
  const campuses = useCampuses()
  const subjects = useLearningAreaList()

  const options =
    dimension === 'teacherId'
      ? (teachers.data ?? []).map((item) => ({
          value: String(item.id),
          label: `${formatPersonName(item)}${item.staffNumber ? ` · ${item.staffNumber}` : ''}`,
        }))
      : dimension === 'classId'
        ? (classes.data ?? []).map((item) => ({ value: String(item.id), label: formatClassLabel(item) }))
        : dimension === 'termId'
          ? (terms.data ?? []).map((item) => ({ value: String(item.id), label: academicTermLabel(item) }))
          : dimension === 'campusId'
            ? (campuses.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))
            : (subjects.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))

  return (
    <SelectField
      label={FILTER_LABELS[dimension]}
      value={value}
      onChange={onChange}
      options={options}
      allowEmpty={false}
      placeholder={`Select ${FILTER_LABELS[dimension].toLowerCase()}`}
    />
  )
}

function UploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }): ReactNode {
  const teachers = useTeacherList()
  const campuses = useCampuses()
  const classes = useClassList()
  const subjects = useLearningAreaList()
  const years = useAcademicYearList()
  const terms = useAcademicTermList()
  const { upload } = useSowMutations()

  const currentTerm = resolveCurrentTerm(terms.data ?? [])
  const currentYear = resolveCurrentAcademicYear(years.data ?? [], currentTerm)

  const [teacherId, setTeacherId] = useState('')
  const [campusId, setCampusId] = useState('')
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [yearId, setYearId] = useState('')
  const [termId, setTermId] = useState('')
  const [documentLink, setDocumentLink] = useState('')
  const [remarks, setRemarks] = useState('')
  const [linkError, setLinkError] = useState('')

  const reset = () => {
    setTeacherId('')
    setCampusId('')
    setClassId('')
    setSubjectId('')
    setYearId(currentYear ? String(currentYear.id) : '')
    setTermId(currentTerm ? String(currentTerm.id) : '')
    setDocumentLink('')
    setRemarks('')
    setLinkError('')
  }

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setYearId(currentYear ? String(currentYear.id) : '')
      setTermId(currentTerm ? String(currentTerm.id) : '')
    } else {
      reset()
    }
    onOpenChange(next)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!isHttpUrl(documentLink.trim())) {
      setLinkError('Enter a full http or https link.')
      return
    }
    const teacher = Number(teacherId)
    const campus = Number(campusId)
    const schoolClass = Number(classId)
    const subject = Number(subjectId)
    const academicYear = Number(yearId)
    const term = Number(termId)
    if (!teacher || !campus || !schoolClass || !subject || !academicYear || !term) return

    const body: SchemeOfWorkPayload = {
      teacher: { id: teacher },
      campus: { id: campus },
      schoolClass: { id: schoolClass },
      subject: { id: subject },
      academicYear: { id: academicYear },
      term: { id: term },
      documentLink: documentLink.trim(),
    }
    if (remarks.trim()) body.remarks = remarks.trim()
    upload.mutate(body, { onSuccess: () => handleOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload scheme of work</DialogTitle>
            <DialogDescription>
              The file itself stays in Drive or another host. Only the URL is stored.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Teacher"
              value={teacherId}
              onChange={setTeacherId}
              options={(teachers.data ?? []).map((item) => ({
                value: String(item.id),
                label: formatPersonName(item),
              }))}
              allowEmpty={false}
              placeholder="Select teacher"
            />
            <SelectField
              label="Campus"
              value={campusId}
              onChange={setCampusId}
              options={(campuses.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
              allowEmpty={false}
              placeholder="Select campus"
            />
            <SelectField
              label="Class"
              value={classId}
              onChange={setClassId}
              options={(classes.data ?? []).map((item) => ({ value: String(item.id), label: formatClassLabel(item) }))}
              allowEmpty={false}
              placeholder="Select class"
            />
            <SelectField
              label="Learning area"
              value={subjectId}
              onChange={setSubjectId}
              options={(subjects.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
              allowEmpty={false}
              placeholder="Select subject"
            />
            <SelectField
              label="Academic year"
              value={yearId}
              onChange={setYearId}
              options={(years.data ?? []).map((item) => ({
                value: String(item.id),
                label: formatAcademicYearDisplay(item.name) ?? item.name,
              }))}
              allowEmpty={false}
              placeholder="Select year"
            />
            <SelectField
              label="Term"
              value={termId}
              onChange={setTermId}
              options={(terms.data ?? []).map((item) => ({ value: String(item.id), label: academicTermLabel(item) }))}
              allowEmpty={false}
              placeholder="Select term"
            />
            <TextField
              label="Document link"
              value={documentLink}
              onChange={(event) => {
                setDocumentLink(event.target.value)
                setLinkError('')
              }}
              placeholder="https://"
              containerClassName="sm:col-span-2"
              required
              {...(linkError ? { error: linkError } : {})}
            />
            <TextareaField
              label="Remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={3}
              containerClassName="sm:col-span-2"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={upload.isPending} loadingLabel="Saving">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
