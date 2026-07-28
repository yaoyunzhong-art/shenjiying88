import BrandsClient from './brands-client'
import { loadBrandsSnapshot } from './brands-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BrandsPage() {
  const snapshot = await loadBrandsSnapshot()
  return <BrandsClient snapshot={snapshot} />
}
