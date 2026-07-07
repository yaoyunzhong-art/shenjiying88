import Link from 'next/link';
import { Suspense } from 'react';
import {
  PageShell,
  StatCard,
  Card,
  Badge,
  LoadingSkeleton,
  QuickStats,
} from '@m5/ui';
import {
  loadAgentDashboardSnapshot,
  loadAgentConfigs,
  loadAgentTools,
  loadAgentEvaluations,
} from './agent-view-model';

export const dynamic = 'force-dynamic';

/* ── 数字格式化 ── */
function fmt(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return String(num);
}

/* ── 功能卡片数据 ── */
interface ModuleCard {
  title: string;
  href: string;
  description: string;
}

const MODULES: ModuleCard[] = [
  {
    title: '仪表盘',
    href: '/agents/dashboard',
    description: 'Agent 实时监控仪表盘，查看运行中/已完成/失败的会话状态与统计数据。',
  },
  {
    title: 'Agent 配置',
    href: '/agents/configs',
    description: '管理 Agent 配置模板，包括模型选择、系统提示词、工具绑定与超时设置。',
  },
  {
    title: '会话列表',
    href: '/agents/sessions',
    description: '查看所有 Agent 会话历史，支持按状态筛选与深度检索。',
  },
  {
    title: 'Agent 工具',
    href: '/agents/tools',
    description: '注册与管理 Agent 可调用的工具，包括输入 Schema 与风险等级。',
  },
  {
    title: '评估报告',
    href: '/agents/evaluations',
    description: 'Agent 输出质量评估，涵盖相关性、准确性、安全性等多维度评分。',
  },
  {
    title: 'Agent Studio',
    href: '/agents/studio',
    description: '在线编排 Agent 工作流，实时测试与调试 Agent 行为。',
  },
];

/* ── 概览统计区域 (服务端组件) ── */
async function OverviewStats() {
  const [dashSnap, configSnap, toolSnap, evalSnap] = await Promise.all([
    loadAgentDashboardSnapshot({ cache: 'no-store' }).catch(() => null),
    loadAgentConfigs({ cache: 'no-store' }).catch(() => null),
    loadAgentTools({ cache: 'no-store' }).catch(() => null),
    loadAgentEvaluations({ cache: 'no-store' }).catch(() => null),
  ]);

  const running = dashSnap?.runningCount ?? 0;
  const completed = dashSnap?.completedCount ?? 0;
  const failed = dashSnap?.failedCount ?? 0;
  const totalExec = dashSnap?.totalExecutions ?? 0;
  const configCount = configSnap?.configs.length ?? 0;
  const toolCount = toolSnap?.tools.length ?? 0;
  const evalCount = evalSnap?.evaluations.length ?? 0;
  const avgDuration = dashSnap?.avgDurationMs ?? 0;
  const avgSteps = dashSnap?.avgSteps ?? 0;
  const passRate =
    evalCount > 0
      ? Math.round(
          (evalSnap!.evaluations.filter((e) => e.overallScore >= 0.6).length / evalCount) * 100,
        )
      : 0;

  return (
    <div style={{ marginBottom: 28 }} data-testid="agents-overview-stats">
      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          marginBottom: 16,
        }}
      >
        <StatCard
          label="运行中会话"
          value={running}
          tone={running > 0 ? 'warning' : 'neutral'}
          helper="实时并发"
        />
        <StatCard label="已完成" value={fmt(completed)} tone="success" helper="累计成功" />
        <StatCard
          label="失败会话"
          value={failed}
          tone={failed > 0 ? 'danger' : 'neutral'}
          helper="需关注"
        />
        <StatCard
          label="总执行次数"
          value={fmt(totalExec)}
          tone="neutral"
          helper={`均 ${avgSteps.toFixed(1)} 步 / ${(avgDuration / 1000).toFixed(1)}s`}
        />
      </div>

      <QuickStats
        items={[
          { label: 'Agent 配置', value: configCount },
          { label: '注册工具', value: toolCount },
          { label: '评估记录', value: evalCount },
          { label: '评估通过率', value: `${passRate}%` },
        ]}
      />
    </div>
  );
}

/* ── 功能模块网格 ── */
function ModuleGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      }}
      data-testid="agents-module-grid"
    >
      {MODULES.map((mod) => (
        <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Card variant="elevated" padding={20} style={{ height: '100%', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge variant="info" size="sm" />
                <span style={{ fontWeight: 600, fontSize: 16 }}>{mod.title}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                {mod.description}
              </p>
              <span style={{ fontSize: 12, color: '#1890ff', marginTop: 4 }}>
                进入 &rarr;
              </span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

/* ── 主页面 ── */
export default async function AgentsPage() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="Agent 管理中心"
        subtitle="AI Agent 全生命周期管理 — 配置、运行、监控、评估与编排。"
      >
        <Suspense
          fallback={<LoadingSkeleton variant="card" rows={2} label="加载概览统计..." />}
        >
          <OverviewStats />
        </Suspense>

        <Suspense
          fallback={<LoadingSkeleton variant="card" rows={3} label="加载功能模块..." />}
        >
          <ModuleGrid />
        </Suspense>
      </PageShell>
    </main>
  );
}
