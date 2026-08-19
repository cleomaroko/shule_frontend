import { Plus } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { toUserMessage } from '@/api/errors'
import { can } from '@/auth/permissions'
import { useAuth } from '@/auth/useAuth'
import { DataTable, type DataColumn } from '@/components/data/DataTable'
import { EmptyState, ErrorState, PageHeader } from '@/components/feedback/PageStates'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHouseList, useLogisticsMutations, useZoneList } from '@/features/logistics/hooks/useLogistics'
import type { House, TransportZone } from '@/features/logistics/types/logistics.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const PAGE_SIZE = 10

export function LogisticsPage(): ReactNode {
  useDocumentTitle('Logistics')
  const { user } = useAuth()
  const canWrite = can(user?.role, 'academic:setup')
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'houses' ? 'houses' : 'zones'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Logistics"
        description="Transport zones and boarding houses used on learner records."
      />
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="zones">Transport zones</TabsTrigger>
          <TabsTrigger value="houses">Houses</TabsTrigger>
        </TabsList>
        <TabsContent value="zones">
          <ZonesPanel canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="houses">
          <HousesPanel canWrite={canWrite} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ZonesPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useZoneList()
  const { createZone } = useLogisticsMutations()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [zoneName, setZoneName] = useState('')

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const columns: Array<DataColumn<TransportZone>> = [
    { id: 'name', header: 'Zone', cell: (row) => row.zoneName },
  ]

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = zoneName.trim()
    if (!trimmed) return
    createZone.mutate(
      { zoneName: trimmed },
      {
        onSuccess: () => {
          setOpen(false)
          setZoneName('')
        },
      },
    )
  }

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <p className="type-caption text-muted-foreground">
          Zones populate the learner transport field. The backend can add zones but does not expose edit or delete.
        </p>
        {canWrite ? (
          <Button onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" />
            Add zone
          </Button>
        ) : null}
      </div>
      {!list.isLoading && rows.length === 0 ? (
        <EmptyState
          title="No transport zones yet"
          description="Add a zone such as Kasarani or Mwiki."
          {...(canWrite ? { actionLabel: 'Add zone', onAction: () => setOpen(true) } : {})}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
          mobileCard={(row) => <p className="type-heading">{row.zoneName}</p>}
        />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add transport zone</DialogTitle>
              <DialogDescription>Zone names must be unique.</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <TextField
                label="Zone name"
                value={zoneName}
                onChange={(event) => setZoneName(event.target.value)}
                placeholder="Kasarani"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createZone.isPending} loadingLabel="Saving">
                Save zone
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function HousesPanel({ canWrite }: { canWrite: boolean }): ReactNode {
  const list = useHouseList()
  const { createHouse } = useLogisticsMutations()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [houseName, setHouseName] = useState('')

  const rows = list.data ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const columns: Array<DataColumn<House>> = [
    { id: 'name', header: 'House', cell: (row) => row.houseName },
  ]

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = houseName.trim()
    if (!trimmed) return
    createHouse.mutate(
      { houseName: trimmed },
      {
        onSuccess: () => {
          setOpen(false)
          setHouseName('')
        },
      },
    )
  }

  if (list.isError) {
    return <ErrorState message={toUserMessage(list.error)} onRetry={() => void list.refetch()} />
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <p className="type-caption text-muted-foreground">
          Houses populate boarding options on learner records. The backend can add houses but does not expose edit or
          delete.
        </p>
        {canWrite ? (
          <Button onClick={() => setOpen(true)}>
            <Plus aria-hidden="true" />
            Add house
          </Button>
        ) : null}
      </div>
      {!list.isLoading && rows.length === 0 ? (
        <EmptyState
          title="No houses yet"
          description="Add a boarding house such as Kilimanjaro."
          {...(canWrite ? { actionLabel: 'Add house', onAction: () => setOpen(true) } : {})}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(row) => row.id}
          isLoading={list.isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
          mobileCard={(row) => <p className="type-heading">{row.houseName}</p>}
        />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add house</DialogTitle>
              <DialogDescription>Used for boarders on the learner profile.</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <TextField
                label="House name"
                value={houseName}
                onChange={(event) => setHouseName(event.target.value)}
                placeholder="Kilimanjaro"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createHouse.isPending} loadingLabel="Saving">
                Save house
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
