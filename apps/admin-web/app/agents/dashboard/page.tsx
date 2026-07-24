import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, StatCard } from '@m5/ui';
import AgentDashboardClient from './dashboard-client';
import { AdminPermissionGate } from '../../components/admin-permission-gate';
import { loadAgentDashboardSnapshot } from '../agent-view-model';

export const dynamic = 'force-dynamic';

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: 'Agent 监控仪表盘访问受限',
  description:
    'Agent 实时监控仪表盘已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看会话并发、失败统计与实时追踪信息。',
} as const;

export default async function AgentDashboardPage() {
  const snapshot = await loadAgentDashboardSnapshot({ cache: 'no-store' });

  // 按 status 排序: RUNNING > PENDING > COMPLETED > FAILED > CANCELLED
  const STATUS_RANK: Record<string, number> = {
    RUNNING: 0,
    PENDING: 1,
    COMPLETED: 2,
    FAILED: 3,
    CANCELLED: 4
  };
  const sortedSessions = [...snapshot.sessions].sort(
    (a, b) => (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99)
  );

  return (
    <AdminPermissionGate {...permissionGate}>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell
          title="Agent 实时监控仪表盘"
          subtitle="多 Session 并发实时监控 (Phase-29)。RUNNING 会话自动订阅 stream,实时显示步骤进度与事件计数。"
        >
          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              marginBottom: 20
            }}
            data-testid="dashboard-stats"
          >
            <StatCard
              label="运行中"
              value={snapshot.runningCount}
              helper="实时并发 stream 订阅"
              tone={snapshot.runningCount > 0 ? 'warning' : 'neutral'}
            />
            <StatCard
              label="已完成"
              value={snapshot.completedCount}
              helper="成功会话累计"
              tone="success"
            />
            <StatCard
              label="失败"
              value={snapshot.failedCount}
              helper="需关注"
              tone={snapshot.failedCount > 0 ? 'danger' : 'neutral'}
            />
            <StatCard
              label="总会话"
              value={snapshot.totalExecutions}
              helper={`平均 ${snapshot.avgSteps.toFixed(1)} 步 / ${(snapshot.avgDurationMs / 1000).toFixed(2)}s`}
            />
          </div>
          <Suspense
            fallback={<LoadingSkeleton variant="card" rows={4} label="加载监控仪表盘..." />}
          >
            <AgentDashboardClient
              sessions={sortedSessions}
              deliveryMode={snapshot.deliveryMode}
              error={snapshot.error}
              totalConfigs={snapshot.totalConfigs}
              timestamp={snapshot.timestamp}
            />
          </Suspense>
        </PageShell>
      </main>
    </AdminPermissionGate>
  );
}
