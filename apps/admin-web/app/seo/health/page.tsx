import { AdminPermissionGate } from '../../components/admin-permission-gate';
import SeoHealthClient from './seo-health-client';
import { loadSeoHealthSnapshot } from './seo-health-data';

const permissionGate = {
  requiredPermission: 'dashboard:read',
  title: 'SEO 健康报告访问受限',
  description:
    'SEO 健康报告页已接入管理员本地 session，只有具备 dashboard:read 的账号才能查看问题清单、覆盖率与治理优先级。',
} as const;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function resolveTenantId(value: string | string[] | undefined): string {
  const tenantId = Array.isArray(value) ? value[0] : value;
  return tenantId?.trim() ? tenantId.trim() : 'tenant-seo';
}

export default async function SeoHealthPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const snapshot = await loadSeoHealthSnapshot(resolveTenantId(query.tenantId));
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
        <SeoHealthClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  );
}
