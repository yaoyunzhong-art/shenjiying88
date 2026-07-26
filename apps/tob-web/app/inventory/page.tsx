import InventoryClient from './inventory-client';
import { loadInventorySnapshot } from './inventory-page-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InventoryPage() {
  const snapshot = await loadInventorySnapshot();
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadInventorySnapshot -> inventory-data.ts local snapshot',
    businessDataSource: 'local inventory product, sku, purchase-order, check and transfer samples',
    refreshPath: 'InventoryPage -> loadInventorySnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      '当前页面处于 fallback 样本态，交互按钮会更新内存样本并通过 router.refresh() 重取服务端快照。',
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
      <InventoryClient snapshot={snapshot} />
    </div>
  );
}
