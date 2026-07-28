import StoreReportsClient from './store-reports-client'
import { loadStoreReportsSnapshot } from './store-reports-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StoreReportsPage() {
  const snapshot = await loadStoreReportsSnapshot()
  return <StoreReportsClient snapshot={snapshot} />
}
