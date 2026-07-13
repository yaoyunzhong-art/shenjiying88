/**
 * AI 决策中心首页 — AI Decision Center (Next.js App Router Page)
 * 功能: AI 决策面板，展示规则执行结果、决策事件流、置信度分布
 * 组件: AIDecisionPanel (from @m5/ui)
 */
import { AIDecisionPanel } from '@m5/ui';
import { PageShell, Badge, StatCard } from '@m5/ui';

export const dynamic = 'force-dynamic';

export default function AiDecisionPage() {
  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 24 }}>
      <PageShell
        title="AI 决策中心"
        subtitle="AI 规则引擎决策事件面板 — 查看命中规则、置信度分析、决策快照与建议操作"
      >
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatCard label="今日决策" value="—" />
          <StatCard label="平均置信度" value="—" />
          <StatCard label="活跃规则" value="—" />
        </div>
        <AIDecisionPanel variant="pc" />
      </PageShell>
    </main>
  );
}
