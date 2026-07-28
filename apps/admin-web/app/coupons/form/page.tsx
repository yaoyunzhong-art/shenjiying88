import CouponFormClient from './coupon-form-client'
import { loadCouponFormSnapshot } from './coupon-form-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CouponFormPage() {
  const snapshot = await loadCouponFormSnapshot()

  return <CouponFormClient snapshot={snapshot} />
}
