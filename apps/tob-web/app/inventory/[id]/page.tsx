import InventoryDetailClient from './inventory-detail-client';
import { loadInventoryDetailSnapshot } from '../inventory-detail-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snapshot = await loadInventoryDetailSnapshot(id);
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadInventoryDetailSnapshot -> inventory-data.ts local detail snapshot',
    businessDataSource: 'local inventory detail relations for product, sku, purchase order, check and transfer',
    refreshPath: 'InventoryDetailPage -> loadInventoryDetailSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.product === null
        ? '当前请求未命中本地样本产品，详情页仅返回占位告警。'
        : '当前详情页处于 fallback 样本态，页面刷新只会重取本地快照。',
  } as const;

  return (
    <div style={{ color: '#e2e8f0' }}>
      <div
        style={{
          margin: '24px 32px 0',
          padding: 12,
          borderRadius: 12,
          border: '1px solid rgba(148,163,184,0.2)',
          background: 'rgba(15,23,42,0.45)',
          color: '#cbd5e1',
          fontSize: 12,
          lineHeight: 1.7,
        }}
      >
        <div>
          Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
        </div>
        <div>
          业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
        </div>
        <div>
          generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
        </div>
      </div>
      <InventoryDetailClient snapshot={snapshot} />
    </div>
  );
}
