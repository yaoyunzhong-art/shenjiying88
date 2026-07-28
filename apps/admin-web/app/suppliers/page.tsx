import SuppliersClient from './suppliers-client'
import { loadSuppliersSnapshot } from './suppliers-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SuppliersPage() {
  const snapshot = await loadSuppliersSnapshot()

  return <SuppliersClient snapshot={snapshot} />
}
