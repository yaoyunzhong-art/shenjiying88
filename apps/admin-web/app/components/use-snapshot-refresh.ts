import { useRouter } from 'next/navigation'
import { useCallback, useTransition } from 'react'

export function useSnapshotRefresh() {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()

  const handleRefresh = useCallback(() => {
    startRefresh(() => router.refresh())
  }, [router])

  return {
    isRefreshing,
    handleRefresh,
  }
}
