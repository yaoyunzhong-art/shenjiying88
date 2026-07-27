import { AdminPermissionGate } from '../../../components/admin-permission-gate';
import NewMemberTierClient from './new-member-tier-client';
import { loadNewMemberTierPageSnapshot } from './new-member-tier-data';

const permissionGate = {
  requiredPermission: 'member:read',
  title: '新建会员等级访问受限',
  description: '新建会员等级页已接入管理员本地 session，只有具备 member:read 的账号才能查看等级配置字段、权益预设与校验反馈。',
} as const;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewMemberTierPage() {
  const snapshot = await loadNewMemberTierPageSnapshot();
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: snapshot.controlPlaneSource,
    businessDataSource: snapshot.businessDataSource,
    refreshPath: snapshot.refreshPath,
    generatedAt: snapshot.generatedAt,
    note: snapshot.note,
  } as const;

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <div style={{ marginBottom: 24, borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.18)', background: 'rgba(248, 250, 252, 0.92)', padding: 16, color: '#334155', fontSize: 12, lineHeight: 1.8 }}>
          <div>Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel}</div>
          <div>控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据: {sourceEvidence.businessDataSource}</div>
          <div>refreshPath: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}</div>
          <div>{sourceEvidence.note}</div>
        </div>
        <NewMemberTierClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  );
}
