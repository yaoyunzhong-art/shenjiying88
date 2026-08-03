import CrmClient from './crm-client'
import { loadCrmSnapshot } from './crm-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CrmPage() {
  const snapshot = await loadCrmSnapshot()
  return <CrmClient snapshot={snapshot} />
}
