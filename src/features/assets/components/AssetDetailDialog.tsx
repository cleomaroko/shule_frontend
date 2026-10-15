import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { assetDescriptionLabel, assetIsDepreciable, formatAssetMoney, type Asset } from '@/features/assets/types/asset.types'
import { displayValue, formatDate, formatPersonName } from '@/lib/format'

export interface AssetDetailDialogProps {
  asset: Asset | null
  onOpenChange: (open: boolean) => void
}

export function AssetDetailDialog({ asset, onOpenChange }: AssetDetailDialogProps): ReactNode {
  const photo = asset?.googleDrivePhotoLink?.trim() ?? ''
  const photoIsLink = /^https?:\/\//i.test(photo)

  return (
    <Dialog open={asset !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-lg flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-6 sm:px-6">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {asset ? displayValue(asset.assetTagId) : 'Asset'}
            {asset?.status?.name ? <Badge variant="neutral">{asset.status.name}</Badge> : null}
          </DialogTitle>
          <DialogDescription>{asset ? assetDescriptionLabel(asset) : 'Asset details'}</DialogDescription>
        </DialogHeader>
        {asset ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 type-caption text-muted-foreground">
              <Detail label="Description" value={assetDescriptionLabel(asset)} />
              <Detail label="Category" value={displayValue(asset.category?.name)} />
              <Detail label="Brand" value={displayValue(asset.brand)} />
              <Detail label="Model" value={displayValue(asset.model)} />
              <Detail label="Serial number" value={displayValue(asset.serialNumber)} />
              <Detail label="Condition" value={displayValue(asset.assetCondition?.name)} />
              <Detail label="Campus" value={displayValue(asset.campus?.name)} />
              <Detail label="Department" value={displayValue(asset.department?.name)} />
              <Detail label="Assigned to" value={asset.assignedTo ? formatPersonName(asset.assignedTo) : '—'} />
              <Detail label="Supplier" value={displayValue(asset.supplierName ?? asset.supplier?.name)} />
              <Detail label="Purchased" value={formatDate(asset.purchaseDate)} />
              <Detail label="Cost" value={formatAssetMoney(asset.costPrice)} />
              <Detail label="Depreciable" value={assetIsDepreciable(asset) ? 'Yes' : 'No'} />
              <Detail label="Life (months)" value={displayValue(asset.assetLifeMonths)} />
              <Detail label="Salvage value" value={formatAssetMoney(asset.salvageValue)} />
            </dl>
            <div className="mt-4">
              <p className="type-caption font-medium text-muted-foreground">Comments</p>
              <p className="type-body mt-1 whitespace-pre-wrap">{displayValue(asset.comments)}</p>
            </div>
            {photo ? (
              <p className="type-caption mt-4 break-all">
                Photo:{' '}
                {photoIsLink ? (
                  <a href={photo} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
                    {photo}
                  </a>
                ) : (
                  photo
                )}
              </p>
            ) : null}
          </div>
        ) : null}
        <DialogFooter className="border-t border-border px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Detail({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="min-w-0">
      <dt>{label}</dt>
      <dd className="font-medium break-words text-foreground">{value}</dd>
    </div>
  )
}
