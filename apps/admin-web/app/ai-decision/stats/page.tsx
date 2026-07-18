/**
 * AI 决策统计分析页 — AI Decision Stats Dashboard (Next.js App Router Page)
 * 角色视角: 👤运营管理员 / 数据分析师
 * 功能:
 *   - 决策执行统计概览卡 (执行总数/成功率/平均响应/平均提升)
 *   - 决策结果分布环图 (成功/部分/失败)
 *   - 决策来源构成环图 (规则/模型/混合)
 *   - 单规则成功率仪表盘
 *   - 效果排行 (按提升率)
 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  PageShell,
  StatCard,
  DonutChart,
  GaugeChart,
  type DonutSlice,
  type GaugeSegment,
} from '@m5/ui';

// ---- Mock 数据 ---- （正式接入 API 时替换）

interface RuleStat {
  id: string;
  name: string;
  source: 'rule' | 'model' | 'hybrid';
  executionCount: number;
  successCount: number;
  avgResponseMs: number;
  liftPercent: number;
}

const MOCK_RULES: RuleStat[] = [
  { id: 'r1', name: '动态定价规则', source: 'rule', executionCount: 1240, successCount: 1100, avgResponseMs: 38, liftPercent: 12.4 },
  { id: 'r2', name: '库存预警模型', source: 'model', executionCount: 980, successCount: 870, avgResponseMs: 210, liftPercent: 8.7 },
  { id: 'r3', name: '促销推荐 (混合)', source: 'hybrid', executionCount: 2100, successCount: 1650, avgResponseMs: 145, liftPercent: 15.2 },
  { id: 'r4', name: '会员等级分配', source: 'rule', executionCount: 640, successCount: 620, avgResponseMs: 22, liftPercent: 3.1 },
  { id: 'r5', name: '客诉预判模型', source: 'model', executionCount: 780, successCount: 610, avgResponseMs: 180, liftPercent: 10.0 },
  { id: 'r6', name: '套餐推荐 (混合)', source: 'hybrid', executionCount: 1500, successCount: 1300, avgResponseMs: 98, liftPercent: 18.3 },
];

function computeStats(rules: RuleStat[]) {
  const total = rules.reduce((s, r) => s + r.executionCount, 0);
  const success = rules.reduce((s, r) => s + r.successCount, 0);
  const avgResp = total > 0 ? Math.round(rules.reduce((s, r) => s + r.avgResponseMs * r.executionCount, 0) / total) : 0;
  const avgLift = rules.length > 0 ? +(rules.reduce((s, r) => s + r.liftPercent, 0) / rules.length).toFixed(1) : 0;
  return { total, success, successRate: total > 0 ? +((success / total) * 100).toFixed(1) : 0, avgResp, avgLift };
}

/** AI决策统计条专用聚合 */
interface AiDecisionSummary {
  totalDecisions: number;
  adoptedCount: number;
  rejectedCount: number;
  pendingReviewCount: number;
}

function computeAiDecisionSummary(rules: RuleStat[]): AiDecisionSummary {
  // 总决策数 = 总执行次数
  const totalDecisions = rules.reduce((s, r) => s + r.executionCount, 0);
  // 采纳数 ≈ successCount
  const adoptedCount = rules.reduce((s, r) => s + r.successCount, 0);
  // 拒绝数 ≈ 失败部分
  const rejectedCount = rules.reduce((s, r) => s + (r.executionCount - r.successCount), 0);
  // 待审数 ≈ total * 5% 模拟
  const pendingReviewCount = Math.round(totalDecisions * 0.05);
  return { totalDecisions, adoptedCount, rejectedCount, pendingReviewCount };
}

const RESULT_COLORS: Record<string, string> = { success: '#4ade80', partial: '#fbbf24', failure: '#f87171' };
const SOURCE_COLORS: Record<string, string> = { rule: '#60a5fa', model: '#a78bfa', hybrid: '#2dd4bf' };
const SEGMENTS: GaugeSegment[] = [
  { from: 0, to: 70, color: '#f87171', label: '需改进' },
  { from: 70, to: 90, color: '#fbbf24', label: '良好' },
  { from: 90, to: 100, color: '#4ade80', label: '优秀' },
];

export default function AiDecisionStatsPage() {
  const [rules] = useState<RuleStat[]>(MOCK_RULES);

  const stats = useMemo(() => computeStats(rules), [rules]);
  const aiSummary = useMemo(() => computeAiDecisionSummary(rules), [rules]);

  // 结果分布: 按规则的 successCount 反推 partial+failure 简化示意
  const resultSlices: DonutSlice[] = useMemo(() => {
    const success = rules.reduce((s, r) => s + r.successCount, 0);
    const partial = Math.round(success * 0.12);
    const failure = rules.reduce((s, r) => s + (r.executionCount - r.successCount), 0) - partial;
    return [
      { key: 'success', label: '成功', value: success, color: RESULT_COLORS['success'] ?? '#4ade80' },
      { key: 'partial', label: '部分成功', value: Math.max(partial, 1), color: RESULT_COLORS['partial'] ?? '#fbbf24' },
      { key: 'failure', label: '失败', value: Math.max(failure, 1), color: RESULT_COLORS['failure'] ?? '#f87171' },
    ];
  }, [rules]);

  // 来源构成
  const sourceSlices: DonutSlice[] = useMemo(() => {
    const groups: Record<string, number> = {};
    rules.forEach(r => { groups[r.source] = (groups[r.source] || 0) + r.executionCount; });
    return Object.entries(groups).map(([key, value]) => ({
      key,
      label: key === 'rule' ? '规则引擎' : key === 'model' ? '模型推理' : '混合决策',
      value,
      color: SOURCE_COLORS[key] ?? '#94a3b8',
    }));
  }, [rules]);

  // 按提升率排序 TOP
  const topLift = useMemo(() => [...rules].sort((a, b) => b.liftPercent - a.liftPercent), [rules]);

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
      <PageShell
        title="AI 决策统计分析"
        subtitle="决策执行效果总览 — 成功率、来源构成、规则排名与性能监控"
      >
        {/* 概览统计卡 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="总执行次数" value={stats.total.toLocaleString()} variant="info" />
          <StatCard label="综合成功率" value={`${stats.successRate}%`} variant={stats.successRate >= 85 ? 'success' : 'warning'} />
          <StatCard label="平均响应" value={`${stats.avgResp} ms`} variant="default" />
          <StatCard label="平均提升率" value={`+${stats.avgLift}%`} variant="success" trend={{ value: '+2.1%', positive: true }} />
        </div>

        {/* AI 决策统计条 */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24,
          padding: 16, borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <StatCard label="AI 决策总数" value={aiSummary.totalDecisions.toLocaleString()} variant="info" />
          <StatCard label="已采纳" value={aiSummary.adoptedCount.toLocaleString()} variant="success" />
          <StatCard label="已拒绝" value={aiSummary.rejectedCount.toLocaleString()} variant="error" />
          <StatCard label="待审核" value={aiSummary.pendingReviewCount.toLocaleString()} variant="warning" />
        </div>

        {/* 图表行 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* 结果分布 */}
          <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>决策结果分布</h3>
            <DonutChart
              data={resultSlices}
              size={180}
              thickness={32}
              showCenterLabel
              centerFormatter={total => `${((resultSlices[0]?.value ?? 0) / total * 100).toFixed(0)}%`}
              showLegend
              minPercent={2}
              animationDuration={600}
            />
          </div>

          {/* 来源构成 */}
          <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>决策来源构成</h3>
            <DonutChart
              data={sourceSlices}
              size={180}
              thickness={32}
              showCenterLabel
              centerFormatter={total => `${sourceSlices.length} 来源`}
              showLegend
              minPercent={2}
              animationDuration={600}
            />
          </div>

          {/* 综合成功率仪表 */}
          <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>综合成功率</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GaugeChart
                value={stats.successRate}
                label="成功率"
                suffix="%"
                segments={SEGMENTS}
                size={180}
              />
            </div>
          </div>
        </div>

        {/* 规则排行表 */}
        <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>规则效果排行 (按提升率)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>规则名称</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>执行次数</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>成功率</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>平均响应</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>提升率</th>
              </tr>
            </thead>
            <tbody>
              {topLift.map((r, i) => {
                const successRate = r.executionCount > 0 ? ((r.successCount / r.executionCount) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                    <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 22, height: 22, borderRadius: 6,
                        background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#c0846e' : 'rgba(148,163,184,0.15)',
                        color: i < 3 ? '#0f172a' : '#94a3b8', fontSize: 11, fontWeight: 700,
                      }}>{i + 1}</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{r.name}</span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>{r.executionCount.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', color: '#4ade80' }}>{successRate}%</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>{r.avgResponseMs} ms</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', color: '#4ade80', fontWeight: 600 }}>+{r.liftPercent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PageShell>
    </main>
  );
}
