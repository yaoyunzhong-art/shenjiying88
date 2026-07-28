import CustomerNewShellClient from './customer-new-client'
import { loadCustomerNewSnapshot } from './customer-new-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewCustomerPage() {
  const snapshot = await loadCustomerNewSnapshot()
  return <CustomerNewShellClient snapshot={snapshot} />
}
