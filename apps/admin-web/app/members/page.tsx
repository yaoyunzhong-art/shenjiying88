import { AdminPermissionGate } from '../components/admin-permission-gate';
import MembersClient from './members-client';
import { loadMembersPageSnapshot } from './members-page-data';

const permissionGate = {
  requiredPermission: 'member:read',
  title: '会员管理访问受限',
  description:
    '会员管理中心已接入管理员本地 session，只有具备 member:read 的账号才能查看会员档案、等级筛选与消费统计结果。',
} as const;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MembersPage() {
  const snapshot = await loadMembersPageSnapshot();
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: snapshot.controlPlaneSource,
    businessDataSource: snapshot.businessDataSource,
    refreshPath: snapshot.refreshPath,
    generatedAt: snapshot.generatedAt,
    note: snapshot.note,
  } as const;

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <div
          style={{
            marginBottom: 24,
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.18)',
            background: 'rgba(248, 250, 252, 0.92)',
            padding: 16,
            color: '#334155',
            fontSize: 12,
            lineHeight: 1.8,
          }}
        >
          <div>
            Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · 来源标签: {snapshot.sourceLabel}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <MembersClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  );
}
