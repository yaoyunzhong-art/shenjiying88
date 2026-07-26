import { AdminPermissionGate } from '../../components/admin-permission-gate';
import StoreDetailClient from './store-detail-client';
import { loadStoreDetailPageSnapshot } from './store-detail-data';

const permissionGate = {
  requiredPermission: 'store:read',
  title: '门店详情访问受限',
  description:
    '门店详情页已接入管理员本地 session，只有具备 store:read 的账号才能查看门店档案、能力访问矩阵与编辑表单。',
} as const;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StoreDetailPage({ params }: PageProps) {
  const { id } = await params;
  const snapshot = await loadStoreDetailPageSnapshot(id);
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
        <StoreDetailClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  );
}
