import Link from 'next/link';
import { LoadingSkeleton, PageShell, StatCard } from '@m5/ui';
import { AdminPermissionGate } from '../../components/admin-permission-gate';
import AgentSessionDetailClient from './session-detail-client';
import { loadAgentSessionDetail } from '../../agent-view-model';

export const dynamic = 'force-dynamic';

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: 'Agent 会话详情访问受限',
  description: '该页面已接入管理员权限管控，仅具备 foundation.governance.read 权限的账号可查看 Agent 会话链路与执行详情。',
} as const;

interface AgentSessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentSessionDetailPage({ params }: AgentSessionDetailPageProps) {
  const { id } = await params;
  const snapshot = await loadAgentSessionDetail(id, { cache: 'no-store' });

  if (!snapshot) {
    return (
      <AdminPermissionGate {...permissionGate}>
        <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
          <PageShell title="Agent 会话未找到" subtitle="会话不存在或已被清理">
            <div style={{ padding: 32, color: '#94a3b8', textAlign: 'center' }}>
              当前会话不存在，请返回会话列表重新选择。
            </div>
          </PageShell>
        </main>
      </AdminPermissionGate>
    );
  }

  const { session, execution, evaluation, config, deliveryMode, error } = snapshot;
  const totalSteps = execution?.steps ?? session.currentStep;
  const totalDurationMs = execution?.totalDurationMs ?? 0;
  const llmCalls = execution?.llmCalls ?? 0;
  const toolCalls = execution?.toolCalls ?? 0;

  return (
    <AdminPermissionGate {...permissionGate}>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
        <PageShell
          title={`Session · ${session.id}`}
          subtitle={`查看 Agent 会话完整链路:${session.userInput.slice(0, 80)}${session.userInput.length > 80 ? '...' : ''}`}
          breadcrumb={
            <nav style={{ display: 'flex', gap: 8, fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
              <Link href="/agents/sessions" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                ← 返回 Agent 会话列表
              </Link>
              <span style={{ color: '#475569' }}>/</span>
              <span style={{ fontFamily: 'monospace' }}>{session.id}</span>
            </nav>
          }
        >
          {/* 顶部 4 个 stats */}
          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              marginBottom: 20
            }}
          >
            <StatCard
              label="执行步数"
              value={`${totalSteps} / ${session.maxSteps}`}
              helper={`currentStep=${session.currentStep}`}
            />
            <StatCard
              label="总耗时"
              value={totalDurationMs > 0 ? `${(totalDurationMs / 1000).toFixed(2)}s` : '—'}
              helper={execution ? `${totalDurationMs}ms` : '执行中或未记录'}
            />
            <StatCard
              label="LLM 调用"
              value={llmCalls}
              helper="包含反思"
              tone={llmCalls > session.maxSteps ? 'warning' : 'neutral'}
            />
            <StatCard
              label="工具调用"
              value={toolCalls}
              helper={`允许 ${config?.allowedTools.length ?? '-'} 个工具`}
              tone={toolCalls > 0 ? 'warning' : 'neutral'}
            />
          </div>

          <LoadingSkeleton variant="card" rows={2} label="加载会话详情..." />

          <div style={{ marginTop: 16 }}>
            <AgentSessionDetailClient
              session={session}
              execution={execution}
              evaluation={evaluation}
              config={config}
              deliveryMode={deliveryMode}
              error={error}
            />
          </div>
        </PageShell>
      </main>
    </AdminPermissionGate>
  );
}
