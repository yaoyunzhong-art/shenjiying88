import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LoadingSkeleton, PageShell, StatCard } from '@m5/ui';
import AgentSessionDetailClient from './session-detail-client';
import { loadAgentSessionDetail } from '../../agent-view-model';

export const dynamic = 'force-dynamic';

interface AgentSessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentSessionDetailPage({ params }: AgentSessionDetailPageProps) {
  const { id } = await params;
  const snapshot = await loadAgentSessionDetail(id, { cache: 'no-store' });

  if (!snapshot) {
    notFound();
  }

  const { session, execution, evaluation, config, deliveryMode, error } = snapshot;
  const totalSteps = execution?.steps ?? session.currentStep;
  const totalDurationMs = execution?.totalDurationMs ?? 0;
  const llmCalls = execution?.llmCalls ?? 0;
  const toolCalls = execution?.toolCalls ?? 0;

  return (
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
  );
}