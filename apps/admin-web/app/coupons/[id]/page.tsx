import CouponDetailShellClient from './coupon-detail-shell-client'
import { loadCouponDetailSnapshot } from './coupon-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}
export default async function CouponDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadCouponDetailSnapshot(id)
  return <CouponDetailShellClient snapshot={snapshot} />
}
