import InventoryRulesClient from './inventory-rules-client';
import { loadInventoryRulesSnapshot } from '../inventory-rules-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InventoryRulesPage() {
  const snapshot = await loadInventoryRulesSnapshot();
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadInventoryRulesSnapshot -> inventory-rules-data.ts local governance snapshot',
    businessDataSource: 'local inventory governance rules and computed stock indicators',
    refreshPath: 'InventoryRulesPage -> loadInventoryRulesSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前库存规则页只展示 fallback 治理样本，规则变更能力仍待接入真实控制面。',
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
      <InventoryRulesClient snapshot={snapshot} />
    </div>
  );
}
