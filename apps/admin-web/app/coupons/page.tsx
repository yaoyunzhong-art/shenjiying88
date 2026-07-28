import CouponsClient from './coupons-client'
import { loadCouponsPageSnapshot } from './coupons-page-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CouponsPage() {
  const snapshot = await loadCouponsPageSnapshot()

  return <CouponsClient snapshot={snapshot} />
}
