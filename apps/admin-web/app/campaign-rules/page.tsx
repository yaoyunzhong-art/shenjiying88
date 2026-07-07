import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { getAdminWorkbenchConsumerSnapshot } from '../bootstrap';
import { loadCampaignRulesWorkspace, type CampaignRulesQuery } from '../campaign-rules-view-model';
import CampaignRulesWorkspaceClient from './campaign-rules-workspace-client';

interface CampaignRulesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function CampaignRulesPage({
  searchParams,
}: CampaignRulesPageProps) {
  const params = await searchParams;
  const query: CampaignRulesQuery = {
    search: readQueryParam(params.search),
    status: (readQueryParam(params.status) ?? '') as CampaignRulesQuery['status'],
    page: Number(readQueryParam(params.page)) || undefined,
    pageSize: Number(readQueryParam(params.pageSize)) || 10,
  };

  const [snapshot, workbenchSnapshot] = await Promise.all([
    loadCampaignRulesWorkspace(query, { cache: 'no-store' }),
    getAdminWorkbenchConsumerSnapshot(),
  ]);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="营销决策规则"
        subtitle="管理活动营销决策规则列表，支持搜索、筛选、排序和分页查看。"
      >
        <Suspense
          fallback={
            <LoadingSkeleton variant="card" rows={5} label="加载营销决策规则列表…" />
          }
        >
          <CampaignRulesWorkspaceClient
            workspace={snapshot.workspace}
          />
        </Suspense>
      </PageShell>
    </main>
  );
}
