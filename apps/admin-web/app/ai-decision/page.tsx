/**
 * AI 决策中心首页 — AI Decision Center (Next.js App Router Page)
 * 功能: AI 决策面板，展示规则执行结果、决策事件流、置信度分布
 * 组件: AiDecisionPanel (from @m5/ui)
 */
'use client';

import { AIDecisionPanel } from '@m5/ui';
import { PageShell } from '@m5/ui';

export default function AiDecisionPage() {
  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 24 }}>
      <PageShell
        title="AI 决策中心"
        subtitle="AI 规则引擎决策事件面板 — 查看命中规则、置信度分析、决策快照与建议操作"
      >
        <AIDecisionPanel variant="pc" />
      </PageShell>
    </main>
  );
}
