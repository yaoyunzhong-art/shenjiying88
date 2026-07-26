import MembersClient from './members-client';
import { loadMembersSnapshot } from './members-page-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MembersPage() {
  const snapshot = await loadMembersSnapshot();
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadMembersSnapshot -> members-data/index.ts local snapshot',
    businessDataSource: 'local member samples generated from members-data/index.ts',
    refreshPath: 'MembersPage -> loadMembersSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前会员列表处于 fallback 样本态，筛选与跳转可用，写入链路仍待接入真实 API。',
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
      <MembersClient snapshot={snapshot} />
    </div>
  );
}
