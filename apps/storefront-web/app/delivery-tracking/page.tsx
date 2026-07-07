/**
 * 物流配送追踪页 — Delivery Tracking Page (Next.js App Router)
 * 收银台/店长/客户均可访问, 按订单查看物流进度
 */
import React from 'react';
import { DeliveryTrackingClient } from './components/DeliveryTrackingClient';

/* ── Props (server-side 可传递默认数据) ── */
export interface DeliveryTrackingPageProps {
  searchParams?: Promise<{ orderId?: string }>;
}

export default async function DeliveryTrackingPage({ searchParams }: DeliveryTrackingPageProps) {
  const params = await searchParams;
  const initialOrderId = params?.orderId;

  return (
    <DeliveryTrackingClient initialOrderId={initialOrderId} />
  );
}
