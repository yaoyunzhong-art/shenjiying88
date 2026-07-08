/**
 * 库存调拨详情页 — Stock Transfer Detail (Next.js App Router)
 * 展示调拨单基本信息、状态流转按钮、生命周期时间线
 */
import StockTransferDetailClient from '../__details__/stock-transfer-detail-client';

export default async function StockTransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StockTransferDetailClient transferId={id} />;
}
