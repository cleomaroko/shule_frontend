import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { SelectField } from '@/components/forms/SelectField'
import { ReportSection } from '@/features/reports/components/ReportPrimitives'
import { ItemMovementsDialog } from '@/features/store/components/ItemMovementsDialog'
import { WeeklyStockReportPanel } from '@/features/store/components/WeeklyStockReportPanel'
import { useStoreItems } from '@/features/store/hooks/useStore'
import type { StoreItem } from '@/features/store/types/store.types'

export function StoreReportsPanel(): ReactNode {
  const items = useStoreItems()
  const [itemId, setItemId] = useState('')
  const [historyItem, setHistoryItem] = useState<StoreItem | null>(null)
  const selected = (items.data ?? []).find((item) => String(item.id) === itemId) ?? null

  return (
    <div className="flex flex-col gap-8">
      <ReportSection title="Weekly stock-take">
        <WeeklyStockReportPanel />
      </ReportSection>
      <ReportSection
        title="Item movement history"
        note="Chronological receipts, transfers, and issues from GET /api/store/items/{id}/movements."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <SelectField
            label="Item"
            value={itemId}
            onChange={setItemId}
            options={(items.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
            placeholder={items.isLoading ? 'Loading items…' : 'Select item'}
            allowEmpty={false}
            containerClassName="sm:max-w-sm sm:flex-1"
          />
          <Button type="button" disabled={!selected} onClick={() => setHistoryItem(selected)}>
            View history
          </Button>
        </div>
      </ReportSection>
      <ItemMovementsDialog item={historyItem} onOpenChange={(open) => !open && setHistoryItem(null)} />
    </div>
  )
}
