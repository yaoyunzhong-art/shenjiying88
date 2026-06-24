import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readConfigurationOperationDetailParam } from '@m5/types';
import { loadConfigurationOperationDetail } from '../../../configuration-operation-view-model';
import ConfigurationOperationDetailClient from './configuration-operation-detail-client';

interface ConfigurationOperationDetailPageProps {
  params: Promise<{ operation?: string | string[] }>;
}

function readOperation(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return readConfigurationOperationDetailParam(value);
  }
  return readConfigurationOperationDetailParam(value);
}

export default async function ConfigurationOperationDetailPage({
  params
}: ConfigurationOperationDetailPageProps) {
  const resolved = await params;
  const operation = readOperation(resolved.operation);

  const snapshot = operation
    ? await loadConfigurationOperationDetail(operation, { cache: 'no-store' })
    : await loadConfigurationOperationDetail('', { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '操作边界不存在' : `配置操作：${snapshot.operation}`}
        subtitle={
          snapshot.notFound
            ? '该操作未在 configuration-governance 元数据中注册，可能已下线或拼写错误。'
            : '查看单一操作的 RBAC 与审批边界，并深链到治理审批/审计/Foundation 上下文。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载操作边界..." />}>
          <ConfigurationOperationDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
