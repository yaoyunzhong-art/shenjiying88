import StoreNewClient from './store-new-client'
import { loadStoreNewSnapshot } from './store-new-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export default async function StoreNewPage() {
  const snapshot = await loadStoreNewSnapshot()

  return <StoreNewClient snapshot={snapshot} />
}
