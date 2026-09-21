import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
import { FormSection } from '@/components/forms/FormSection'
import {
  GoogleDriveDocumentField,
  type GoogleDriveDocumentFieldHandle,
} from '@/components/forms/GoogleDriveDocumentField'
import { SelectField } from '@/components/forms/SelectField'
import { TextareaField } from '@/components/forms/TextareaField'
import { TextField } from '@/components/forms/TextField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFinanceMutations, useFinanceSummary } from '@/features/finance/hooks/useFinance'
import {
  invoiceBadgeVariant,
  invoiceStatusLabel,
  PO_PAYMENT_METHODS,
  poBadgeVariant,
  poStatusLabel,
  type CaptureInvoicePayload,
  type CreatePurchaseOrderPayload,
  type Invoice,
  type PurchaseOrder,
} from '@/features/finance/types/finance.types'
import { BreakdownCard, ReportSection, StatGrid } from '@/features/reports/components/ReportPrimitives'
import { useRequisitionList } from '@/features/requisitions/hooks/useRequisitions'
import { asMoney, formatKes, requisitionStatusLabel } from '@/features/requisitions/types/requisition.types'
import { useSupplierList } from '@/features/suppliers/hooks/useSuppliers'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { displayValue, todayIso } from '@/lib/format'
import { paths } from '@/routes/paths'

const TABS = ['summary', 'orders', 'invoices'] as const
type FinanceTab = (typeof TABS)[number]

function isTab(value: string | null): value is FinanceTab {
  return TABS.some((tab) => tab === value)
}

export function FinancePage(): ReactNode {
  useDocumentTitle('Finance')
  const { user } = useAuth()
  const canFinance = can(user?.role, 'finance:access')
  const canProcurement = can(user?.role, 'procurement:access')
  const [params, setParams] = useSearchParams()
  const rawTab = params.get('tab')
  const tab: FinanceTab = isTab(rawTab) ? rawTab : 'summary'

  const [sessionPos, setSessionPos] = useState<PurchaseOrder[]>([])
  const [sessionInvoices, setSessionInvoices] = useState<Invoice[]>([])

  const upsertPo = (row: PurchaseOrder) => {
    setSessionPos((current) => {
      const without = current.filter((item) => item.id !== row.id)
      return [row, ...without]
    })
  }
  const upsertInvoice = (row: Invoice) => {
    setSessionInvoices((current) => {
      const without = current.filter((item) => item.id !== row.id)
      return [row, ...without]
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Finance"
        description="Create purchase orders, approve them, capture supplier invoices, and record payments. There is no list endpoint for POs or invoices."
      />
      <Alert variant="info">
        <AlertTitle>Controller limits</AlertTitle>
        <AlertDescription>
          Create PO requires procurement access and is saved as Pending finance approval (not Draft). Approve, invoice
          capture, invoice payment, and the summary report require finance access. After a successful create you keep
          that record on this page; reload and you will need the PO or invoice id.
        </AlertDescription>
      </Alert>
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="orders">Purchase orders</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <SummaryPanel canFinance={canFinance} />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersPanel
            canProcurement={canProcurement}
            canFinance={canFinance}
            sessionPos={sessionPos}
            onPo={upsertPo}
          />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesPanel
            canFinance={canFinance}
            sessionPos={sessionPos}
            sessionInvoices={sessionInvoices}
            onInvoice={upsertInvoice}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryPanel({ canFinance }: { canFinance: boolean }): ReactNode {
  const summary = useFinanceSummary(canFinance)

  if (!canFinance) {
    return (
      <EmptyState
        title="Finance access required"
        description="The summary endpoint checks users.role for SUPER_ADMIN, FINANCE_ADMIN, FINANCE_OFFICER, or HEAD_OF_ADMINS_AND_FINANCE."
      />
    )
  }

  if (summary.isError) {
    return <ErrorState message={toUserMessage(summary.error)} onRetry={() => void summary.refetch()} />
  }

  return (
    <ReportSection
      title="Commitments versus cash"
      note="Approved PO requisition amounts minus invoice amountPaid. Open a GRN from Stores when goods arrive."
    >
      <StatGrid
        loading={summary.isLoading}
        items={[
          {
            label: 'Approved commitments',
            value: formatKes(summary.data?.totalApprovedCommitments),
            hint: 'Sum of approvedAmount on POs with status APPROVED',
          },
          {
            label: 'Cash outflow',
            value: formatKes(summary.data?.totalCashOutflow),
            hint: 'Sum of amountPaid on captured invoices',
          },
          {
            label: 'Pending payments',
            value: formatKes(summary.data?.pendingPayments),
            hint: 'Commitments minus cash already paid',
          },
        ]}
      />
    </ReportSection>
  )
}

function OrdersPanel({
  canProcurement,
  canFinance,
  sessionPos,
  onPo,
}: {
  canProcurement: boolean
  canFinance: boolean
  sessionPos: PurchaseOrder[]
  onPo: (row: PurchaseOrder) => void
}): ReactNode {
  const requisitions = useRequisitionList()
  const suppliers = useSupplierList()
  const { createPo, approvePo } = useFinanceMutations()
  const [requisitionId, setRequisitionId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [comments, setComments] = useState('')
  const [approveId, setApproveId] = useState('')

  const selectedReq = (requisitions.data ?? []).find((item) => String(item.id) === requisitionId)

  const handleCreate = (event: FormEvent) => {
    event.preventDefault()
    if (!canProcurement) return
    const reqId = Number(requisitionId)
    const supId = Number(supplierId)
    if (!reqId || !supId) {
      toast.error('Requisition and supplier are required.')
      return
    }
    const body: CreatePurchaseOrderPayload = {
      requisition: { id: reqId },
      supplier: { id: supId },
    }
    if (comments.trim()) body.comments = comments.trim()
    if (paymentMethod) body.paymentMethod = paymentMethod
    createPo.mutate(body, {
      onSuccess: (saved) => {
        onPo(saved)
        setComments('')
      },
    })
  }

  const handleApprove = (event: FormEvent) => {
    event.preventDefault()
    if (!canFinance) return
    const id = Number(approveId)
    if (!id) {
      toast.error('Enter the purchase order id to approve.')
      return
    }
    approvePo.mutate(id, {
      onSuccess: (saved) => {
        onPo(saved)
        setApproveId('')
      },
    })
  }

  const columns: Array<DataColumn<PurchaseOrder>> = [
    {
      id: 'po',
      header: 'PO',
      cell: (row) => row.poNumber || `PO #${row.id}`,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <Badge variant={poBadgeVariant(row.status)}>{poStatusLabel(row.status)}</Badge>,
    },
    {
      id: 'req',
      header: 'Requisition',
      cell: (row) => row.requisition?.requisitionNumber || (row.requisition?.id ? `#${row.requisition.id}` : '—'),
      hideOnMobile: true,
    },
    {
      id: 'amount',
      header: 'Approved amount',
      cell: (row) => formatKes(row.requisition?.approvedAmount),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreate}>
        <FormSection
          title="Create purchase order"
          description="Posted to POST /api/finance. The controller assigns the PO number and sets PENDING_FINANCE_APPROVAL."
        >
          <SelectField
            label="Requisition"
            value={requisitionId}
            onChange={(value) => {
              setRequisitionId(value)
              const next = (requisitions.data ?? []).find((item) => String(item.id) === value)
              if (next?.supplier?.id && !supplierId) setSupplierId(String(next.supplier.id))
            }}
            options={(requisitions.data ?? []).map((item) => ({
              value: String(item.id),
              label: `${item.requisitionNumber || `REQ #${item.id}`} · ${requisitionStatusLabel(item.status)}`,
            }))}
            allowEmpty={false}
            placeholder="Select requisition"
            emptyMessage="No requisitions loaded."
          />
          <SelectField
            label="Supplier"
            value={supplierId}
            onChange={setSupplierId}
            options={(suppliers.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
            allowEmpty={false}
            placeholder="Select supplier"
          />
          <SelectField
            label="Payment method"
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={PO_PAYMENT_METHODS.map((item) => ({ value: item, label: item }))}
            emptyLabel="Not set"
          />
          <TextareaField
            label="Comments"
            value={comments}
            onChange={(event) => setComments(event.target.value)}
            containerClassName="sm:col-span-2"
            rows={3}
          />
          {selectedReq ? (
            <p className="type-caption text-muted-foreground sm:col-span-2">
              Requisition estimated {formatKes(selectedReq.totalEstimatedAmount)} · approved{' '}
              {formatKes(selectedReq.approvedAmount)}.
            </p>
          ) : null}
          <div className="sm:col-span-2">
            {canProcurement ? (
              <Button type="submit" isLoading={createPo.isPending} loadingLabel="Creating">
                Create purchase order
              </Button>
            ) : (
              <p className="type-caption text-muted-foreground">Procurement access is required to create a PO.</p>
            )}
          </div>
        </FormSection>
      </form>

      <form onSubmit={handleApprove}>
        <FormSection
          title="Approve purchase order"
          description="PATCH /api/finance/{id}/approve. There is no list of pending POs — use an id from this session or from the create response."
        >
          <SelectField
            label="PO from this session"
            value={approveId && sessionPos.some((item) => String(item.id) === approveId) ? approveId : ''}
            onChange={setApproveId}
            options={sessionPos.map((item) => ({
              value: String(item.id),
              label: `${item.poNumber || `PO #${item.id}`} · ${poStatusLabel(item.status)}`,
            }))}
            emptyLabel="Or type an id"
          />
          <TextField
            label="Purchase order id"
            type="number"
            min="1"
            value={approveId}
            onChange={(event) => setApproveId(event.target.value)}
            hint="Required by the approve path."
          />
          <div className="sm:col-span-2">
            {canFinance ? (
              <Button type="submit" isLoading={approvePo.isPending} loadingLabel="Approving">
                Approve PO
              </Button>
            ) : (
              <p className="type-caption text-muted-foreground">Finance access is required to approve.</p>
            )}
          </div>
        </FormSection>
      </form>

      {sessionPos.length === 0 ? (
        <EmptyState
          title="No POs on this page yet"
          description="Create a purchase order above. The backend has no GET /api/finance list."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={sessionPos}
          getRowId={(row) => row.id}
          page={1}
          pageSize={sessionPos.length}
          total={sessionPos.length}
          onPageChange={() => undefined}
          mobileCard={(row) => (
            <div className="flex flex-col gap-1">
              <p className="type-heading">{row.poNumber || `PO #${row.id}`}</p>
              <p className="type-caption text-muted-foreground">
                {poStatusLabel(row.status)} · {formatKes(row.requisition?.approvedAmount)}
              </p>
            </div>
          )}
        />
      )}
    </div>
  )
}

function InvoicesPanel({
  canFinance,
  sessionPos,
  sessionInvoices,
  onInvoice,
}: {
  canFinance: boolean
  sessionPos: PurchaseOrder[]
  sessionInvoices: Invoice[]
  onInvoice: (row: Invoice) => void
}): ReactNode {
  const requisitions = useRequisitionList()
  const { captureInvoice, recordPayment } = useFinanceMutations()
  const driveRef = useRef<GoogleDriveDocumentFieldHandle>(null)
  const [poId, setPoId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [dueDate, setDueDate] = useState(todayIso())
  const [documentLink, setDocumentLink] = useState('')
  const [payInvoiceId, setPayInvoiceId] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [page, setPage] = useState(1)

  const selectedPo = sessionPos.find((item) => String(item.id) === poId)
  const matchedReq = selectedPo?.requisition?.id
    ? (requisitions.data ?? []).find((item) => item.id === selectedPo.requisition?.id)
    : undefined
  const reqAmount = asMoney(matchedReq?.approvedAmount ?? selectedPo?.requisition?.approvedAmount)
  const invoiceAmount = asMoney(totalAmount)
  const mismatch = Boolean(poId && reqAmount > 0 && invoiceAmount > 0 && Math.abs(reqAmount - invoiceAmount) > 0.009)

  const handleCapture = async (event: FormEvent) => {
    event.preventDefault()
    if (!canFinance) return
    const parsedPo = Number(poId)
    const parsedTotal = Number(totalAmount)
    if (!parsedPo || !invoiceNumber.trim() || !Number.isFinite(parsedTotal) || parsedTotal <= 0) {
      toast.error('PO id, invoice number, and total amount are required.')
      return
    }
    let link = documentLink
    try {
      link = (await driveRef.current?.commit()) ?? documentLink
    } catch {
      return
    }
    const body: CaptureInvoicePayload = {
      purchaseOrder: { id: parsedPo },
      invoiceNumber: invoiceNumber.trim(),
      totalAmount: parsedTotal,
    }
    if (dueDate) body.dueDate = dueDate
    if (link.trim()) body.documentLink = link.trim()
    captureInvoice.mutate(body, {
      onSuccess: (saved) => {
        onInvoice(saved)
        setInvoiceNumber('')
        setTotalAmount('')
        setDocumentLink('')
      },
    })
  }

  const handlePay = (event: FormEvent) => {
    event.preventDefault()
    if (!canFinance) return
    const id = Number(payInvoiceId)
    const amount = Number(payAmount)
    if (!id || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Invoice id and a payment amount are required.')
      return
    }
    recordPayment.mutate(
      { id, amount },
      {
        onSuccess: (saved) => {
          onInvoice(saved)
          setPayAmount('')
        },
      },
    )
  }

  const columns: Array<DataColumn<Invoice>> = [
    { id: 'no', header: 'Invoice', cell: (row) => row.invoiceNumber || `#${row.id}` },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <Badge variant={invoiceBadgeVariant(row.status)}>{invoiceStatusLabel(row.status)}</Badge>,
    },
    { id: 'total', header: 'Total', cell: (row) => formatKes(row.totalAmount) },
    { id: 'paid', header: 'Paid', cell: (row) => formatKes(row.amountPaid), hideOnMobile: true },
    { id: 'due', header: 'Due', cell: (row) => displayValue(row.dueDate), hideOnMobile: true },
  ]

  const matchingRows = useMemo(
    () => [
      { label: 'Requisition approved', count: reqAmount },
      { label: 'Invoice total', count: invoiceAmount },
    ],
    [invoiceAmount, reqAmount],
  )

  if (!canFinance) {
    return (
      <EmptyState
        title="Finance access required"
        description="Capturing invoices and recording payments is declined without finance access."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={(event) => void handleCapture(event)}>
        <FormSection
          title="Capture invoice"
          description="POST /api/finance/invoices. Status is forced to UNPAID. Upload the supplier PDF to Drive if you have a document."
        >
          <SelectField
            label="PO from this session"
            value={poId && sessionPos.some((item) => String(item.id) === poId) ? poId : ''}
            onChange={setPoId}
            options={sessionPos.map((item) => ({
              value: String(item.id),
              label: item.poNumber || `PO #${item.id}`,
            }))}
            emptyLabel="Or type an id"
          />
          <TextField
            label="Purchase order id"
            type="number"
            min="1"
            value={poId}
            onChange={(event) => setPoId(event.target.value)}
          />
          <TextField
            label="Invoice number"
            value={invoiceNumber}
            onChange={(event) => setInvoiceNumber(event.target.value)}
            required
          />
          <TextField
            label="Total amount (KES)"
            type="number"
            min="0"
            step="0.01"
            value={totalAmount}
            onChange={(event) => setTotalAmount(event.target.value)}
            required
          />
          <TextField label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          <div className="sm:col-span-2">
            <GoogleDriveDocumentField
              ref={driveRef}
              label="Invoice PDF"
              value={documentLink}
              onChange={setDocumentLink}
              hint="Optional. Stored as documentLink on the invoice."
            />
          </div>
          {mismatch ? (
            <div className="sm:col-span-2">
              <Alert variant="warning">
                <AlertTitle>Three-way match warning</AlertTitle>
                <AlertDescription>
                  Invoice total {formatKes(invoiceAmount)} does not match requisition approved amount{' '}
                  {formatKes(reqAmount)}. Capture still proceeds — the controller does not block this.
                </AlertDescription>
              </Alert>
            </div>
          ) : reqAmount > 0 && invoiceAmount > 0 ? (
            <div className="sm:col-span-2">
              <BreakdownCard title="Amounts" rows={matchingRows} empty="No amounts yet" />
            </div>
          ) : null}
          <p className="type-caption text-muted-foreground sm:col-span-2">
            Goods received notes live under Stores. The GRN controller does not change PO status to RECEIVED.
          </p>
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={captureInvoice.isPending} loadingLabel="Capturing">
              Capture invoice
            </Button>
          </div>
        </FormSection>
      </form>

      <form onSubmit={handlePay}>
        <FormSection
          title="Record invoice payment"
          description="POST /api/finance/invoices/{id}/payment?amount=. Status becomes PARTIALLY_PAID or PAID."
        >
          <SelectField
            label="Invoice from this session"
            value={payInvoiceId && sessionInvoices.some((item) => String(item.id) === payInvoiceId) ? payInvoiceId : ''}
            onChange={setPayInvoiceId}
            options={sessionInvoices.map((item) => ({
              value: String(item.id),
              label: `${item.invoiceNumber || `INV #${item.id}`} · ${invoiceStatusLabel(item.status)}`,
            }))}
            emptyLabel="Or type an id"
          />
          <TextField
            label="Invoice id"
            type="number"
            min="1"
            value={payInvoiceId}
            onChange={(event) => setPayInvoiceId(event.target.value)}
          />
          <TextField
            label="Amount (KES)"
            type="number"
            min="0"
            step="0.01"
            value={payAmount}
            onChange={(event) => setPayAmount(event.target.value)}
            required
          />
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={recordPayment.isPending} loadingLabel="Recording">
              Record payment
            </Button>
          </div>
        </FormSection>
      </form>

      {sessionInvoices.length === 0 ? (
        <EmptyState
          title="No invoices on this page yet"
          description="Capture an invoice above. There is no GET /api/finance/invoices list."
          actionLabel="Record a GRN"
          actionTo={`${paths.store}?tab=grn`}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={sessionInvoices}
          getRowId={(row) => row.id}
          page={page}
          pageSize={10}
          total={sessionInvoices.length}
          onPageChange={setPage}
          mobileCard={(row) => (
            <div>
              <p className="type-heading">{row.invoiceNumber || `Invoice #${row.id}`}</p>
              <p className="type-caption text-muted-foreground">
                {invoiceStatusLabel(row.status)} · {formatKes(row.amountPaid)} of {formatKes(row.totalAmount)}
              </p>
            </div>
          )}
        />
      )}
    </div>
  )
}
