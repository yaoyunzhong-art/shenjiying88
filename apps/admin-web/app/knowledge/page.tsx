/**
 * 知识库页面 Knowledge — admin-web 知识管理
 * 角色: 🏢总部 / 👔店长
 * 功能: 文档库、运营手册、FAQ、公告
 */

import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, ErrorBoundary } from '@m5/ui';
import { AdminPermissionGate } from '../components/admin-permission-gate';
import KnowledgeClient from './knowledge-client';
import { loadKnowledgeSnapshot } from './knowledge-data';

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '知识库访问受限',
  description: '该页面已接入管理员权限管控，仅具备 foundation.governance.read 权限的账号可访问知识库与制度资料。',
} as const;

export default async function KnowledgePage() {
  const snapshot = await loadKnowledgeSnapshot();
  const data = snapshot.data;
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadKnowledgeSnapshot -> loadKnowledge',
    businessDataSource: 'local knowledge snapshot',
    refreshPath: 'KnowledgePage -> loadKnowledgeSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前知识库页面使用本地知识样本，不代表真实知识中台，也不可作为闭环复签证据。',
  } as const;

  return (
    <AdminPermissionGate {...permissionGate}>
      <ErrorBoundary>
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
          <PageShell title="📚 知识库" subtitle="运营手册·设备指南·会员政策·财务规范·安全制度">
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.08)', fontSize: 12, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 16 }}>
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
            <Suspense fallback={<LoadingSkeleton variant="card" rows={8} label="加载知识库..." />}>
              <KnowledgeClient data={data} />
            </Suspense>
          </PageShell>
        </main>
      </ErrorBoundary>
    </AdminPermissionGate>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
