import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { SearchField } from '@/components/data/FilterBar'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { FormSection } from '@/components/forms/FormSection'
import { SelectField } from '@/components/forms/SelectField'
import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { academicTermLabel, calendarIsCurrent } from '@/features/academic/types/academic.types'
import { useAcademicTermList } from '@/features/academic/hooks/useAcademic'
import { useFeeBalance, useFeeMutations } from '@/features/fees/hooks/useFees'
import { FEE_PAYMENT_METHODS, type FeePaymentPayload } from '@/features/fees/types/fee.types'
import { useLearnerList } from '@/features/learners/hooks/useLearners'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatKes, formatPersonName } from '@/lib/format'

export function FeesPage(): ReactNode {
  useDocumentTitle('Fees')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'fees:write')
  const learners = useLearnerList()
  const terms = useAcademicTermList()
  const { pay } = useFeeMutations()

  const [learnerQuery, setLearnerQuery] = useState('')
  const [learnerId, setLearnerId] = useState('')
  const [termId, setTermId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Mpesa')
  const [reference, setReference] = useState('')
  const [remarks, setRemarks] = useState('')

  const selectedLearner = (learners.data ?? []).find((item) => String(item.id) === learnerId) ?? null
  const selectedId = selectedLearner?.id ?? null
  const balance = useFeeBalance(selectedId)

  const currentTerm = (terms.data ?? []).find(calendarIsCurrent) ?? null

  const filteredLearners = useMemo(() => {
    const needle = learnerQuery.trim().toLowerCase()
    const all = learners.data ?? []
    if (!needle) return all.slice(0, 40)
    return all
      .filter((item) =>
        [formatPersonName(item), item.admissionNumber, item.currentClass, item.stream]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 40)
  }, [learnerQuery, learners.data])

  const handlePay = (event: FormEvent) => {
    event.preventDefault()
    if (!canWrite) return
    if (!selectedLearner) {
      toast.error('Select a learner first.')
      return
    }
    const paid = Number(amount)
    if (!Number.isFinite(paid) || paid <= 0) {
      toast.error('Enter a payment amount greater than zero.')
      return
    }

    const body: FeePaymentPayload = {
      learner: { id: selectedLearner.id },
      amountPaid: paid,
      paymentMethod: method,
    }
    if (reference.trim()) body.referenceNumber = reference.trim()
    if (remarks.trim()) body.remarks = remarks.trim()
    const parsedTerm = Number(termId)
    if (parsedTerm) body.term = { id: parsedTerm }

    pay.mutate(
      parsedTerm ? { body, termId: parsedTerm } : { body },
      {
        onSuccess: () => {
          setAmount('')
          setReference('')
          setRemarks('')
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fees"
        description="Look up a learner balance and record a payment. Parent receipt notifications are simulated on the server."
      />

      <Alert variant="info">
        <AlertTitle>What this controller supports</AlertTitle>
        <AlertDescription>
          Payments go to <code className="type-caption">POST /api/finance/fees/pay</code>. Balance is{' '}
          <code className="type-caption">GET /api/finance/fees/balance/{'{learnerId}'}</code> and currently always
          uses term 1. There is no fee-structure endpoint in the Java controller, so structures cannot be created from
          this screen.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <FormSection
          title="Learner"
          description="Search by name or admission number, then check the outstanding balance."
        >
          <SearchField
            value={learnerQuery}
            onChange={setLearnerQuery}
            placeholder="Search learners"
            className="max-w-none sm:col-span-2"
          />
          {learners.isError ? (
            <div className="sm:col-span-2">
              <ErrorState message={toUserMessage(learners.error)} onRetry={() => void learners.refetch()} />
            </div>
          ) : (
            <SelectField
              label="Learner"
              value={learnerId}
              onChange={setLearnerId}
              options={filteredLearners.map((item) => ({
                value: String(item.id),
                label: `${formatPersonName(item)}${item.admissionNumber ? ` · ${item.admissionNumber}` : ''}`,
              }))}
              allowEmpty={false}
              placeholder="Select learner"
              emptyMessage="No learners match that search."
              containerClassName="sm:col-span-2"
            />
          )}
          {selectedLearner ? (
            <Card className="sm:col-span-2">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="type-heading truncate">{formatPersonName(selectedLearner)}</p>
                  <p className="type-caption text-muted-foreground">
                    {[selectedLearner.admissionNumber, selectedLearner.currentClass, selectedLearner.stream]
                      .filter(Boolean)
                      .join(' · ') || 'No class on file'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="type-caption text-muted-foreground">Balance (term 1)</p>
                  {balance.isLoading ? (
                    <p className="type-heading">Loading…</p>
                  ) : balance.isError ? (
                    <p className="type-caption text-destructive">{toUserMessage(balance.error)}</p>
                  ) : (
                    <p className="type-page-title">{formatKes(balance.data)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="sm:col-span-2">
              <EmptyState
                title="Select a learner"
                description="The balance endpoint has no term query, so the figure shown is always for term 1."
              />
            </div>
          )}
        </FormSection>

        <form onSubmit={handlePay}>
          <FormSection
            title="Record payment"
            description="termId is sent on pay so the receipt and stored transaction use the term you pick."
          >
            <SelectField
              label="Term for this payment"
              value={termId}
              onChange={setTermId}
              options={(terms.data ?? []).map((item) => ({
                value: String(item.id),
                label: academicTermLabel(item),
              }))}
              emptyLabel={currentTerm ? `Current · ${academicTermLabel(currentTerm)}` : 'Let the service pick current'}
              hint="Optional. Used as ?termId= on POST /pay."
            />
            <TextField
              label="Amount (KES)"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
            <SelectField
              label="Payment method"
              value={method}
              onChange={setMethod}
              options={FEE_PAYMENT_METHODS.map((item) => ({ value: item, label: item }))}
              allowEmpty={false}
            />
            <TextField
              label="Reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="MPESA or bank reference"
            />
            <TextareaField
              label="Remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              containerClassName="sm:col-span-2"
              rows={3}
            />
            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              {pay.data ? (
                <Badge variant="success">Last saved: {formatKes(pay.data.amountPaid)}</Badge>
              ) : (
                <span />
              )}
              {canWrite ? (
                <Button type="submit" isLoading={pay.isPending} loadingLabel="Recording" disabled={!selectedLearner}>
                  Record payment
                </Button>
              ) : (
                <p className="type-caption text-muted-foreground">You can look up balances but not record payments.</p>
              )}
            </div>
          </FormSection>
        </form>
      </div>
    </div>
  )
}
