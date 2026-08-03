import CouponTemplatesClient from './coupon-templates-client'
import { loadCouponTemplatesSnapshot } from './coupon-templates-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CouponTemplatesPage() {
  const snapshot = await loadCouponTemplatesSnapshot()
  return <CouponTemplatesClient snapshot={snapshot} />
}
