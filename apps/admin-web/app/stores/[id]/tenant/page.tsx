import { AdminPermissionGate } from '../../../components/admin-permission-gate';
import TenantClient from './tenant-client';
import { loadTenantSnapshot } from './tenant-data';

const permissionGate = {
  requiredPermission: 'store:read',
  title: '门店租户访问受限',
  description:
    '门店租户页已接入管理员本地 session，只有具备 store:read 的账号才能查看租户套餐、隔离得分与迁移状态。',
} as const;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function resolveTenantId(value: string | string[] | undefined): string {
  const tenantId = Array.isArray(value) ? value[0] : value;
  return tenantId?.trim() ? tenantId.trim() : 'tenant-dwy';
}

export default async function TenantPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const snapshot = await loadTenantSnapshot(id, resolveTenantId(query.tenantId));
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
            Delivery {sourceEvidence.deliveryMode} / {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} / 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>
            refreshPath: {sourceEvidence.refreshPath} / generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <TenantClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  );
}
