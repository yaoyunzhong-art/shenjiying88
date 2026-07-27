'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import DeviceFormLegacy from './device-form-legacy'
import type { DeviceFormSnapshot } from './device-form-data'

export default function DeviceFormShellClient({
  snapshot,
}: {
  snapshot: DeviceFormSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{
            borderRadius: 10,
            border: '1px solid rgba(148, 163, 184, 0.24)',
            background: 'rgba(15, 23, 42, 0.72)',
            color: '#e2e8f0',
            padding: '8px 14px',
            fontSize: 13,
            cursor: isRefreshing ? 'wait' : 'pointer',
          }}
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>
      <DeviceFormLegacy />
    </div>
  )
}
