import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { getAdminWorkbenchConsumerSnapshot } from '../bootstrap';
import { loadIdentityAccessWorkspace } from '../identity-access-view-model';
import IdentityAccessWorkspaceClient from './identity-access-workspace-client';

interface IdentityAccessPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function IdentityAccessPage({ searchParams }: IdentityAccessPageProps) {
  const params = await searchParams;
  const query = {
    tenantId: readQueryParam(params.tenantId),
    brandId: readQueryParam(params.brandId),
    storeId: readQueryParam(params.storeId),
    marketCode: readQueryParam(params.marketCode)
  };

  const [workspaceSnapshot, workbenchSnapshot] = await Promise.all([
    loadIdentityAccessWorkspace(query, { cache: 'no-store' }),
    getAdminWorkbenchConsumerSnapshot()
  ]);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="身份与授权"
        subtitle="展示当前 actor 解析结果，以及角色、权限、租户边界三类真实校验结果。"
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载身份与授权工作台..." />}>
          <IdentityAccessWorkspaceClient
            workspace={workspaceSnapshot.workspace}
            foundationDependencies={workbenchSnapshot.foundationDependencies}
            handoffContracts={workbenchSnapshot.consumerDescriptor.handoffContracts}
          />
        </Suspense>
      </PageShell>
    </main>
  );
}
