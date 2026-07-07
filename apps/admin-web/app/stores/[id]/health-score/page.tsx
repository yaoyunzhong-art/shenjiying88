/**
 * 门店健康评分详情页 — Store Health Score Detail Page
 * 角色视角: 👔区域经理 / 📊运营管理员
 * 功能: 门店多维度健康评分展示，含各维度得分、趋势、改进建议
 */
'use client';

import { useMemo } from 'react';
import { PageShell, StatCard, WorkspaceBreadcrumb, GaugeChart, Progress, StatusBadge } from '@m5/ui';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

// ─── 类型定义 ─────────────────────────────────────────

type HealthDimension = 'operation' | 'member' | 'finance' | 'service' | 'inventory';
type TrendDir = 'up' | 'down' | 'stable';

interface DimensionScore {
  dimension: HealthDimension;
  label: string;
  score: number; // 0–100
  trend: TrendDir;
  change: number;
  weight: number;
  suggestions: string[];
}

interface StoreHealthData {
  storeId: string;
  storeName: string;
  overallScore: number;
  dimensionScores: DimensionScore[];
  periodLabel: string;
  totalStores: number;
  rank: number;
}

// ─── 常量 ─────────────────────────────────────────────

const DIMENSION_LABELS: Record<HealthDimension, string> = {
  operation: '运营效率',
  member: '会员活跃',
  finance: '财务状况',
  service: '服务质量',
  inventory: '库存健康',
};

const DIMENSION_DESCRIPTIONS: Record<HealthDimension, string> = {
  operation: '基于坪效、人效、高峰时段响应速度等指标',
  member: '基于会员复购率、活跃率、LTV 等指标',
  finance: '基于毛利率、现金流、费用率等指标',
  service: '基于客诉率、好评率、服务响应时间等指标',
  inventory: '基于库存周转率、缺货率、损耗率等指标',
};

const DIMENSION_ICONS: Record<HealthDimension, string> = {
  operation: '⚙️',
  member: '👥',
  finance: '💰',
  service: '⭐',
  inventory: '📦',
};

const TREND_LABELS: Record<TrendDir, string> = {
  up: '↑ 上升',
  down: '↓ 下降',
  stable: '→ 持平',
};

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function scoreLabel(score: number): string {
  if (score >= 80) return '优秀';
  if (score >= 60) return '良好';
  if (score >= 40) return '待改善';
  return '危险';
}

// ─── Mock 数据 ────────────────────────────────────────

function mockStoreHealth(storeId: string): StoreHealthData {
  const dimensionConfigs: Array<{ dim: HealthDimension; base: number; trend: TrendDir; change: number; weight: number }> = [
    { dim: 'operation', base: 78, trend: 'up', change: 4.2, weight: 0.25 },
    { dim: 'member', base: 65, trend: 'down', change: -3.1, weight: 0.2 },
    { dim: 'finance', base: 82, trend: 'stable', change: 0.5, weight: 0.25 },
    { dim: 'service', base: 72, trend: 'up', change: 6.7, weight: 0.15 },
    { dim: 'inventory', base: 58, trend: 'down', change: -8.4, weight: 0.15 },
  ];
  const scores: DimensionScore[] = dimensionConfigs.map(({ dim, base, trend, change, weight }) => {
    const suggestionSets: Record<HealthDimension, string[]> = {
      operation: ['优化排班减少空耗', '提升自助结账渗透率'],
      member: ['策划会员专享活动', '完善积分兑换体系'],
      finance: ['控制运营成本', '优化账期管理'],
      service: ['加强员工服务培训', '缩短响应时间'],
      inventory: ['清理滞销库存', '优化补货策略'],
    };
    return {
      dimension: dim,
      label: DIMENSION_LABELS[dim],
      score: base,
      trend,
      change,
      weight,
      suggestions: suggestionSets[dim],
    };
  });
  const overall = Math.round(scores.reduce((sum, s) => sum + s.score * s.weight, 0));
  return {
    storeId,
    storeName: `门店 ${storeId}`,
    overallScore: overall,
    dimensionScores: scores,
    periodLabel: '近30天',
    totalStores: 120,
    rank: 35,
  };
}

// ─── 助手 ─────────────────────────────────────────────

function sortByScoreDesc(dimensions: DimensionScore[]): DimensionScore[] {
  return [...dimensions].sort((a, b) => b.score - a.score);
}

function getBestAndWorst(dimensions: DimensionScore[]): { best: DimensionScore | null; worst: DimensionScore | null } {
  if (dimensions.length === 0) return { best: null, worst: null };
  const sorted = sortByScoreDesc(dimensions);
  return { best: sorted[0] ?? null, worst: sorted[sorted.length - 1] ?? null };
}

function formatHealthSummary(health: StoreHealthData): string {
  const { best, worst } = getBestAndWorst(health.dimensionScores);
  const bestStr = best ? `${best.label}(${best.score}分)` : '—';
  const worstStr = worst ? `${worst.label}(${worst.score}分)` : '—';
  return `综合评分 ${health.overallScore}分 · 最佳维度 ${bestStr} · 待改进 ${worstStr} · 排名 ${health.rank}/${health.totalStores}`;
}

// ─── 页面组件 ────────────────────────────────────────

interface StoreHealthScorePageProps {
  params: Promise<{ id: string }>;
}

export default async function StoreHealthScorePage({ params }: StoreHealthScorePageProps) {
  const { id } = await params;
  const health = mockStoreHealth(id);
  const sorted = sortByScoreDesc(health.dimensionScores);

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'stores', detailLabel: `${health.storeName} · 健康评分` })}
      />

      <PageShell
        title={`${health.storeName} · 健康评分`}
        description={formatHealthSummary(health)}
      >
        {/* 总体评分 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            padding: 24,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#f8fafc',
            marginBottom: 24,
          }}
        >
          <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>综合评分</div>
            <div style={{ fontSize: 56, fontWeight: 700, color: scoreColor(health.overallScore) }}>
              {health.overallScore}
            </div>
            <div style={{ fontSize: 13, color: scoreColor(health.overallScore), marginTop: 4 }}>
              {scoreLabel(health.overallScore)}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
              <StatCard
                label="排名"
                value={`${health.rank}/${health.totalStores}`}
                trend={health.rank <= 30 ? { value: '排名靠前', positive: true } : { value: '有提升空间', positive: false }}
              />
              <StatCard
                label="评估周期"
                value={health.periodLabel}
              />
            </div>
          </div>
        </div>

        {/* 各维度评分 */}
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>各维度评分</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {sorted.map((dim) => (
            <div
              key={dim.dimension}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                borderRadius: 12,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: 28, flex: '0 0 40px', textAlign: 'center' }}>
                {DIMENSION_ICONS[dim.dimension]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{dim.label}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>
                      (权重 {Math.round(dim.weight * 100)}%)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor(dim.score) }}>
                      {dim.score}
                    </span>
                    <StatusBadge
                      label={`${dim.trend === 'up' ? '+' : dim.trend === 'down' ? '-' : ''}${Math.abs(dim.change).toFixed(1)}`}
                      variant={dim.trend === 'up' ? 'success' : dim.trend === 'down' ? 'danger' : 'neutral'}
                      size="sm"
                      dot={false}
                    />
                  </div>
                </div>
                <Progress
                  value={dim.score}
                  variant={dim.score >= 80 ? 'success' : dim.score >= 60 ? 'info' : dim.score >= 40 ? 'warning' : 'danger'}
                  height={8}
                />
                <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
                  {DIMENSION_DESCRIPTIONS[dim.dimension]}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 改进建议 */}
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '24px 0 16px' }}>改进建议</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          {sorted.filter((d) => d.score < 75).map((dim) => (
            <div
              key={`suggest-${dim.dimension}`}
              style={{
                padding: 16,
                borderRadius: 12,
                background: '#fefce8',
                border: '1px solid #fde68a',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                {DIMENSION_ICONS[dim.dimension]} {dim.label} ({dim.score}分)
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#713f12' }}>
                {dim.suggestions.map((s, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
          {sorted.filter((d) => d.score >= 75).length === sorted.length && (
            <div style={{ padding: 16, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>✅ 当前门店所有维度表现良好，继续保持！</div>
            </div>
          )}
        </div>
      </PageShell>
    </main>
  );
}
