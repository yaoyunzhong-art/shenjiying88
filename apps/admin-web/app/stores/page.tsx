import { AdminPermissionGate } from '../components/admin-permission-gate';
import StoresClient from './stores-client';
import { loadStoresPageSnapshot } from './stores-page-data';

const permissionGate = {
  requiredPermission: 'store:read',
  title: '门店中心访问受限',
  description:
    '门店管理中心已接入管理员本地 session，只有具备 store:read 的账号才能查看门店列表、风险分布与批量动作。',
} as const;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StoresPage() {
  const snapshot = await loadStoresPageSnapshot();
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
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <StoresClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  );
}
