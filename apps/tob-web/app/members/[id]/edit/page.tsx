import MemberEditClient from './member-edit-client';
import { loadMemberEditSnapshot } from '../../member-edit-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MemberEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snapshot = await loadMemberEditSnapshot(id);
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadMemberEditSnapshot -> members-data/index.ts local member edit snapshot',
    businessDataSource: 'local member samples used to hydrate edit form defaults',
    refreshPath: 'MemberEditPage -> loadMemberEditSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.member === null
        ? '当前请求未命中本地会员样本，编辑页仅返回占位告警。'
        : '当前会员编辑页处于 fallback 样本态，保存仅更新客户端草稿，不会写回真实控制面。',
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
      <MemberEditClient snapshot={snapshot} />
    </div>
  );
}
