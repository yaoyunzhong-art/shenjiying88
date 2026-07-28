import CustomersClient from './customers-client'
import { loadCustomersSnapshot } from './customers-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CustomersPage() {
  const snapshot = await loadCustomersSnapshot()

  return <CustomersClient snapshot={snapshot} />
}
