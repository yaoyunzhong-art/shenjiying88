'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import CustomerNewLegacy from './customer-new-legacy'
import type { CustomerNewSnapshot } from './customer-new-data'

export default function CustomerNewShellClient({
  snapshot,
}: {
  snapshot: CustomerNewSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  void snapshot

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh snapshot'}
        </button>
      </div>
      <CustomerNewLegacy />
    </div>
  )
}
