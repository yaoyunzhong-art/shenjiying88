import OrderReviewsClient from './order-reviews-client'
import { loadOrderReviewsSnapshot } from './order-reviews-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrderReviewsPage() {
  const snapshot = await loadOrderReviewsSnapshot()

  return <OrderReviewsClient snapshot={snapshot} />
}
