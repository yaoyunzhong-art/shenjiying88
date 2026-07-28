import StoreFormClient from './store-form-client'
import { loadStoreFormSnapshot } from './store-form-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export default async function StoreFormPage() {
  const snapshot = await loadStoreFormSnapshot()

  return <StoreFormClient snapshot={snapshot} />
}
