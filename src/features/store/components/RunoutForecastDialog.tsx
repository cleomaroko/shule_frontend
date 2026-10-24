import { useEffect, useState, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { ErrorState } from '@/components/feedback/PageStates'
import { SelectField } from '@/components/forms/SelectField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useRunoutForecast } from '@/features/store/hooks/useStore'
import {
  formatStoreQty,
  storeIsMain,
  type RunoutForecast,
  type StoreItem,
  type StoreLocation,
} from '@/features/store/types/store.types'

function urgencyLabel(urgency: string | null | undefined): string {
  switch (urgency) {
    case 'CRITICAL_REORDER':
      return 'Critical reorder'
    case 'WARNING_LOW':
      return 'Low stock warning'
    case 'HEALTHY':
      return 'Healthy'
    case 'CRITICAL':
      return 'Out of stock'
    default:
      return urgency?.replaceAll('_', ' ') || 'Not available'
  }
}

function urgencyVariant(urgency: string | null | undefined) {
  if (urgency === 'HEALTHY') return 'success' as const
  if (urgency === 'WARNING_LOW') return 'warning' as const
  if (urgency === 'CRITICAL_REORDER' || urgency === 'CRITICAL') return 'destructive' as const
  return 'neutral' as const
}

function scenarioLabel(key: string): string {
  if (key.startsWith('scenario_low')) return 'Low usage'
  if (key.startsWith('scenario_moderate')) return 'Moderate usage'
  if (key.startsWith('scenario_high')) return 'High usage'
  return key.replace(/^scenario_/, '').replaceAll('_', ' ')
}

function ForecastSummary({ forecast }: { forecast: RunoutForecast }): ReactNode {
  if (forecast.status === 'OUT_OF_STOCK') {
    return (
      <Alert variant="error">
        <AlertTitle>Out of stock</AlertTitle>
        <AlertDescription>{forecast.notice || 'No stock is available at the selected store.'}</AlertDescription>
      </Alert>
    )
  }

  if (forecast.has_historical_data === false && forecast.simulated_scenarios) {
    return (
      <div className="space-y-4">
        <Alert variant="warning">
          <AlertTitle>Hypothetical scenarios, not a prediction</AlertTitle>
          <AlertDescription>{forecast.notice}</AlertDescription>
        </Alert>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(forecast.simulated_scenarios).map(([key, scenario]) => (
            <div key={key} className="rounded-lg border border-border p-3">
              <p className="type-label capitalize">{scenarioLabel(key)}</p>
              <p className="type-heading mt-2">{scenario.projected_days_left} days</p>
              <p className="type-caption mt-1 text-muted-foreground">At {formatStoreQty(scenario.assumed_daily_burn)} {forecast.unit || 'units'}/day</p>
              <p className="type-caption mt-1 text-muted-foreground">Runout date · {scenario.projected_runout_date}</p>
            </div>
          ))}
        </div>
        {forecast.advice ? <p className="type-caption text-muted-foreground">{forecast.advice}</p> : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
        <div>
          <p className="type-caption text-muted-foreground">Forecast urgency</p>
          <Badge variant={urgencyVariant(forecast.urgency)} className="mt-1">{urgencyLabel(forecast.urgency)}</Badge>
        </div>
        <div className="text-right">
          <p className="type-caption text-muted-foreground">Current stock</p>
          <p className="type-heading">{formatStoreQty(forecast.current_stock)} {forecast.unit || ''}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-muted/50 p-3"><dt className="type-caption text-muted-foreground">Estimated time left</dt><dd className="type-heading mt-1">{forecast.days_left ?? '—'} days</dd></div>
        <div className="rounded-lg bg-muted/50 p-3"><dt className="type-caption text-muted-foreground">Projected runout</dt><dd className="type-label mt-1">{forecast.depletion_date || '—'}</dd></div>
        {forecast.burn_rate_per_day != null ? <div className="rounded-lg bg-muted/50 p-3"><dt className="type-caption text-muted-foreground">Average usage</dt><dd className="type-label mt-1">{formatStoreQty(forecast.burn_rate_per_day)} {forecast.unit || 'units'}/day</dd></div> : null}
      </dl>
      <p className="type-caption text-muted-foreground">
        {forecast.data_points_analyzed != null ? `${forecast.data_points_analyzed} recent consumption records analyzed.` : 'Based on recorded consumption history.'}
        {forecast.engine ? ` Forecast source: ${forecast.engine}.` : ''}
      </p>
    </div>
  )
}

export function RunoutForecastDialog({
  item,
  stores,
  onOpenChange,
}: {
  item: StoreItem | null
  stores: StoreLocation[]
  onOpenChange: (open: boolean) => void
}): ReactNode {
  const [storeId, setStoreId] = useState('')
  const open = item !== null
  const selectedStoreId = Number(storeId) || null
  const forecast = useRunoutForecast(item?.id ?? null, selectedStoreId)

  useEffect(() => {
    if (!item) {
      setStoreId('')
      return
    }
    const preferred = stores.find(storeIsMain) ?? stores[0]
    setStoreId(preferred ? String(preferred.id) : '')
  }, [item, stores])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock runout forecast</DialogTitle>
          <DialogDescription>{item?.name || 'Select an item'} · Forecast is calculated for a specific store.</DialogDescription>
        </DialogHeader>
        <div className="mt-5 space-y-5">
          <SelectField
            label="Store"
            value={storeId}
            onChange={setStoreId}
            options={stores.map((store) => ({ value: String(store.id), label: storeIsMain(store) ? `${store.name} (main)` : store.name }))}
            placeholder={stores.length ? 'Select store' : 'No stores available'}
            emptyMessage="Add a store location to request a forecast."
            allowEmpty={false}
          />
          {!selectedStoreId ? <p className="type-caption text-muted-foreground">Choose a store to calculate its current stock outlook.</p> : null}
          {forecast.isError ? <ErrorState message={toUserMessage(forecast.error)} onRetry={() => void forecast.refetch()} /> : null}
          {forecast.isLoading ? <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-28 w-full" /></div> : null}
          {forecast.data ? <ForecastSummary forecast={forecast.data} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
