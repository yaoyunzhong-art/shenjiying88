import ProcurementClient from './procurement-client'
import { loadProcurementSnapshot } from './procurement-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProcurementPage() {
  const snapshot = await loadProcurementSnapshot()
  return <ProcurementClient snapshot={snapshot} />
}
