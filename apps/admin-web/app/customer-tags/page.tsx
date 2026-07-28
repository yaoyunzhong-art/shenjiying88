import CustomerTagsClient from './customer-tags-client'
import { loadCustomerTagsSnapshot } from './customer-tags-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CustomerTagsPage() {
  const snapshot = await loadCustomerTagsSnapshot()
  return <CustomerTagsClient snapshot={snapshot} />
}
