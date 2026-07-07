import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, StatCard } from '@m5/ui';
import AgentEvaluationsClient from './agent-evaluations-client';
import { loadAgentEvaluations } from '../agent-view-model';

export const dynamic = 'force-dynamic';

export default async function AgentEvaluationsPage() {
  const snapshot = await loadAgentEvaluations({ cache: 'no-store' });
  const passed = snapshot.evaluations.filter((e) => e.overallScore >= 0.6).length;
  const passRate = snapshot.evaluations.length > 0
    ? ((passed / snapshot.evaluations.length) * 100).toFixed(1)
    : '—';

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="Agent 质量评估中心"
        subtitle="6 维度(相关性/准确性/完整性/安全性/有用性/简洁性)质量评分与综合得分,作为 Agent 选型与回归追踪的关键参考。"
      >
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <StatCard label="评估总数" value={snapshot.evaluations.length} helper="累计" />
          <StatCard
            label="通过率"
            value={`${passRate}%`}
            helper={`${passed} 通过 (≥0.6)`}
            tone={Number(passRate) >= 80 ? 'success' : Number(passRate) >= 60 ? 'warning' : 'danger'}
          />
          <StatCard
            label="平均综合分"
            value={
              snapshot.evaluations.length > 0
                ? (snapshot.evaluations.reduce((s, e) => s + e.overallScore, 0) / snapshot.evaluations.length).toFixed(3)
                : '—'
            }
            helper="overallScore 均值"
          />
          <StatCard
            label="未通过"
            value={snapshot.evaluations.length - passed}
            helper="需复盘"
            tone={snapshot.evaluations.length - passed > 0 ? 'danger' : 'neutral'}
          />
        </div>
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载质量评估..." />}>
          <AgentEvaluationsClient
            evaluations={snapshot.evaluations}
            deliveryMode={snapshot.deliveryMode}
            error={snapshot.error}
          />
        </Suspense>
      </PageShell>
    </main>
  );
}