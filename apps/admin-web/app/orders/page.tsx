import OrdersClient from './orders-client'
import { loadOrdersSnapshot } from '../orders-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrdersPage() {
  const snapshot = await loadOrdersSnapshot()

  return <OrdersClient snapshot={snapshot} />
}
