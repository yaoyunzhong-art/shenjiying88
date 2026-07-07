import CouponDetailClient from './coupon-detail-client';

export default async function CouponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CouponDetailClient couponId={id} />;
}
