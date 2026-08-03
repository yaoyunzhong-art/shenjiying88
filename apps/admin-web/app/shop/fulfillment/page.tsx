import FulfillmentClient from './fulfillment-client'
import { loadFulfillmentSnapshot } from './fulfillment-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FulfillmentPage() {
  const snapshot = await loadFulfillmentSnapshot()

  return <FulfillmentClient snapshot={snapshot} />
}
