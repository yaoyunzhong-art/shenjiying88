import BrandOperationsClient from './brand-operations-client'
import { loadBrandOperationsSnapshot } from './brand-operations-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BrandOperationsPage() {
  const snapshot = await loadBrandOperationsSnapshot()
  return <BrandOperationsClient snapshot={snapshot} />
}
