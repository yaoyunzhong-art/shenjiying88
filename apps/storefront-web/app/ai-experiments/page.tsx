'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  AIExperimentOptimizationPanel,
  StatusBadge,
  type ExperimentEntry,
  type ExperimentStatus,
  type OptimizationSuggestion,
} from '@m5/ui';

// ==================== Mock 数据 ====================

const MOCK_EXPERIMENTS: ExperimentEntry[] = [
  {
    id: 'exp-001',
    name: '首页Banner布局优化',
    status: 'running',
    targetMetric: '首页点击转化率',
    startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    variants: [
      { id: 'v-control', name: '对照组（原版）', trafficPercent: 50, conversionRate: 3.2, sampleSize: 12500, isWinner: false, liftPercent: 0 },
      { id: 'v-new', name: '实验组（新版）', trafficPercent: 50, conversionRate: 4.1, sampleSize: 12480, isWinner: true, liftPercent: 28.1 },
    ],
    confidenceLevel: 95,
    aiRecommendation: '建议将新版Banner布局推广至全量用户，预期提升转化率28%',
  },
  {
    id: 'exp-002',
    name: '推荐算法版本对比',
    status: 'completed',
    targetMetric: '推荐位点击率',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    variants: [
      { id: 'v-cf', name: '协同过滤', trafficPercent: 50, conversionRate: 5.8, sampleSize: 22000, isWinner: false, liftPercent: 0 },
      { id: 'v-dl', name: '深度学习模型 v2.3', trafficPercent: 50, conversionRate: 7.2, sampleSize: 21980, isWinner: true, liftPercent: 24.1 },
    ],
    confidenceLevel: 99,
    aiRecommendation: '深度学习模型显著优于协同过滤，已自动切换',
  },
  {
    id: 'exp-003',
    name: '会员日促销弹窗时机',
    status: 'paused',
    targetMetric: '弹窗转化率',
    startDate: new Date(Date.now() - 14 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    variants: [
      { id: 'v-5s', name: '5秒弹出', trafficPercent: 50, conversionRate: 6.1, sampleSize: 8500, isWinner: false, liftPercent: 0 },
      { id: 'v-10s', name: '10秒弹出', trafficPercent: 50, conversionRate: 6.8, sampleSize: 8430, isWinner: true, liftPercent: 11.5 },
    ],
    confidenceLevel: 90,
    aiRecommendation: '10秒弹出效果更优，建议继续运行收集更多数据',
  },
  {
    id: 'exp-004',
    name: 'AI客服对话开场白测试',
    status: 'draft',
    targetMetric: '用户回复率',
    startDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    variants: [
      { id: 'v-greeting', name: '友好问候式', trafficPercent: 33, conversionRate: 0, sampleSize: 0, isWinner: false, liftPercent: 0 },
      { id: 'v-question', name: '引导提问式', trafficPercent: 33, conversionRate: 0, sampleSize: 0, isWinner: false, liftPercent: 0 },
      { id: 'v-direct', name: '直接解决式', trafficPercent: 34, conversionRate: 0, sampleSize: 0, isWinner: false, liftPercent: 0 },
    ],
    confidenceLevel: 95,
    aiRecommendation: '根据历史数据，引导提问式预期效果最佳',
  },
  {
    id: 'exp-005',
    name: '个性化推荐商品数量',
    status: 'running',
    targetMetric: '推荐区点击转化率',
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 11 * 86400000).toISOString(),
    variants: [
      { id: 'v-5', name: '推荐5件', trafficPercent: 33, conversionRate: 4.5, sampleSize: 5200, isWinner: false, liftPercent: 0 },
      { id: 'v-8', name: '推荐8件', trafficPercent: 33, conversionRate: 5.2, sampleSize: 5180, isWinner: true, liftPercent: 15.6 },
      { id: 'v-12', name: '推荐12件', trafficPercent: 34, conversionRate: 4.8, sampleSize: 5210, isWinner: false, liftPercent: 6.7 },
    ],
    confidenceLevel: 95,
    aiRecommendation: '推荐8件商品取得最佳平衡，推荐5件信息量不足，12件导致选择困难',
  },
  {
    id: 'exp-006',
    name: '商品详情页CTA颜色测试',
    status: 'running',
    targetMetric: '加入购物车率',
    startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 9 * 86400000).toISOString(),
    variants: [
      { id: 'v-blue', name: '蓝色按钮', trafficPercent: 50, conversionRate: 5.0, sampleSize: 9800, isWinner: false, liftPercent: 0 },
      { id: 'v-green', name: '绿色按钮', trafficPercent: 50, conversionRate: 5.8, sampleSize: 9750, isWinner: true, liftPercent: 16.0 },
    ],
    confidenceLevel: 95,
    aiRecommendation: '绿色CTA按钮转化率显著高于蓝色，建议优先使用',
  },
  {
    id: 'exp-007',
    name: '新用户注册引导流程',
    status: 'draft',
    targetMetric: '注册完成率',
    startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    variants: [
      { id: 'v-3step', name: '三步骤引导', trafficPercent: 50, conversionRate: 0, sampleSize: 0, isWinner: false, liftPercent: 0 },
      { id: 'v-1page', name: '单页完成', trafficPercent: 50, conversionRate: 0, sampleSize: 0, isWinner: false, liftPercent: 0 },
    ],
    confidenceLevel: 95,
    aiRecommendation: '预计单页完成注册率更高，建议作为实验组',
  },
];

const MOCK_SUGGESTIONS: OptimizationSuggestion[] = [
  { id: 'sug-001', title: '首页Banner布局推广全量', expectedLift: 28.1, category: 'placement', relatedExperimentId: 'exp-001', description: '新版Banner布局已验证有效，建议推广至全量用户' },
  { id: 'sug-002', title: '推荐算法切换至深度学习模型', expectedLift: 24.1, category: 'other', relatedExperimentId: 'exp-002', description: '深度学习推荐模型显著优于协同过滤，建议全面切换' },
  { id: 'sug-003', title: '推送弹窗设置10秒延迟', expectedLift: 11.5, category: 'promotion', relatedExperimentId: 'exp-003', description: '会员日弹窗10秒后弹出转化率更高' },
  { id: 'sug-004', title: 'CTA按钮统一使用绿色', expectedLift: 16.0, category: 'placement', relatedExperimentId: 'exp-006', description: '绿色CTA按钮转化率相比蓝色提升16%' },
  { id: 'sug-005', title: '商品推荐数量默认8件', expectedLift: 15.6, category: 'other', relatedExperimentId: 'exp-005', description: '推荐8件商品时点击转化率最高' },
];

// ==================== 子组件 ====================

function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: string }) {
  return (
    <div style={{
      background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.12)',
      borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
      </div>
    </div>
  );
}

function VariantComparisonBar({ winner, v1, v2 }: { winner: string; v1: string; v2: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
      <span style={{ fontSize: 11, color: '#64748b', minWidth: 40 }}>{v1}</span>
      <div style={{ flex: 1, height: 10, background: 'rgba(148,163,184,0.1)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: '50%', height: '100%', background: winner === v1 ? '#22c55e' : '#475569', borderRadius: 5 }} />
      </div>
      <div style={{ flex: 1, height: 10, background: 'rgba(148,163,184,0.1)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: '50%', height: '100%', background: winner === v2 ? '#22c55e' : '#475569', borderRadius: 5 }} />
      </div>
      <span style={{ fontSize: 11, color: '#64748b', minWidth: 40 }}>{v2}</span>
    </div>
  );
}

// ==================== 页面组件 ====================

export default function AIExperimentsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(false);

  const filteredExperiments = useMemo(() => {
    if (statusFilter === 'all') return MOCK_EXPERIMENTS;
    return MOCK_EXPERIMENTS.filter((exp) => exp.status === (statusFilter as ExperimentStatus));
  }, [statusFilter]);

  const stats = useMemo(() => {
    const total = MOCK_EXPERIMENTS.length;
    const running = MOCK_EXPERIMENTS.filter((e) => e.status === 'running').length;
    const completed = MOCK_EXPERIMENTS.filter((e) => e.status === 'completed').length;
    const draft = MOCK_EXPERIMENTS.filter((e) => e.status === 'draft').length;
    const paused = MOCK_EXPERIMENTS.filter((e) => e.status === 'paused').length;
    const winners = MOCK_EXPERIMENTS.filter((e) => e.variants.some((v) => v.isWinner)).length;
    const totalLift = MOCK_SUGGESTIONS.reduce((s, sug) => s + sug.expectedLift, 0);
    const avgLift = MOCK_SUGGESTIONS.length > 0 ? Math.round(totalLift / MOCK_SUGGESTIONS.length * 10) / 10 : 0;
    return { total, running, completed, draft, paused, winners, totalLift, avgLift };
  }, []);

  /** 状态标签 */
  const getStatusBadge = useCallback((status: string) => {
    const map: Record<string, { variant: string; label: string }> = {
      running: { variant: 'success', label: '运行中' },
      completed: { variant: 'info', label: '已完成' },
      paused: { variant: 'warning', label: '已暂停' },
      draft: { variant: 'neutral', label: '草稿' },
      failed: { variant: 'danger', label: '失败' },
    };
    const cfg = map[status] || { variant: 'neutral', label: status };
    return <StatusBadge variant={cfg.variant as 'success' | 'info' | 'warning' | 'neutral' | 'danger'} label={cfg.label} />;
  }, []);

  if (loading) return <div style={{ minHeight: '100vh', background: '#0f172a', padding: '24px 32px', textAlign: 'center', paddingTop: 60, color: '#94a3b8' }}>加载中...</div>;
  if (error) return <div style={{ minHeight: '100vh', background: '#0f172a', padding: '24px 32px', textAlign: 'center', paddingTop: 60, color: '#f87171' }}>数据获取失败: {error}</div>;
  if (!MOCK_EXPERIMENTS || MOCK_EXPERIMENTS.length === 0) return <div style={{ minHeight: '100vh', background: '#0f172a', padding: '24px 32px', textAlign: 'center', paddingTop: 60, color: '#94a3b8' }}>暂无数据</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '24px 32px' }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>🧪 AI 实验优化中心</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            AI 驱动自动化 A/B 实验管理与优化建议 · 共 {stats.total} 个实验 · {stats.running} 个运行中
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
            + 新建实验
          </button>
          <button style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
            查看 AI 分析报告
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="实验总数" value={stats.total} color="#3b82f6" icon="🧪" />
        <StatCard label="运行中" value={stats.running} color="#22c55e" icon="🟢" />
        <StatCard label="已完成" value={stats.completed} color="#8b5cf6" icon="✅" />
        <StatCard label="草稿" value={stats.draft} color="#f59e0b" icon="📝" />
      </div>

      {/* 第二行统计 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="已暂停" value={stats.paused} color="#f97316" icon="⏸️" />
        <StatCard label="发现优胜方案" value={stats.winners} color="#ec4899" icon="🏆" />
        <StatCard label="预期总提升" value={`${stats.totalLift.toFixed(1)}%`} color="#22c55e" icon="📈" />
        <StatCard label="平均提升" value={`${stats.avgLift}%`} color="#60a5fa" icon="📊" />
      </div>

      {/* 优胜方案概览 */}
      <div style={{
        marginBottom: 20, padding: 16,
        background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(59,130,246,0.05))',
        borderRadius: 12, border: '1px solid rgba(34,197,94,0.2)',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#4ade80', margin: '0 0 10px' }}>🏆 优胜方案概览</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {MOCK_EXPERIMENTS.filter(e => e.variants.some(v => v.isWinner)).slice(0, 3).map(exp => {
            const winner = exp.variants.find(v => v.isWinner);
            return (
              <div key={exp.id} style={{ padding: 10, background: 'rgba(15,23,42,0.6)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{exp.name}</div>
                <div style={{ fontSize: 11, color: '#4ade80' }}>🥇 {winner?.name} (提升 {winner?.liftPercent}%)</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>置信度 {exp.confidenceLevel}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 实验状态分布 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {MOCK_EXPERIMENTS.map(exp => (
          <span key={exp.id} style={{
            padding: '3px 8px', borderRadius: 4, fontSize: 10,
            background: exp.status === 'running' ? 'rgba(34,197,94,0.1)' : exp.status === 'completed' ? 'rgba(139,92,246,0.1)' : exp.status === 'paused' ? 'rgba(249,115,22,0.1)' : 'rgba(148,163,184,0.1)',
            color: exp.status === 'running' ? '#4ade80' : exp.status === 'completed' ? '#a78bfa' : exp.status === 'paused' ? '#f97316' : '#94a3b8',
          }}>
            {exp.name.substring(0, 6)}…: {getStatusBadge(exp.status)}
          </span>
        ))}
      </div>

      {/* 筛选栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
        padding: '12px 16px', background: 'rgba(15,23,42,0.4)', borderRadius: 10,
        border: '1px solid rgba(148,163,184,0.08)',
      }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>状态筛选：</span>
        {[
          { key: 'all', label: '全部' },
          { key: 'running', label: '运行中' },
          { key: 'completed', label: '已完成' },
          { key: 'paused', label: '已暂停' },
          { key: 'draft', label: '草稿' },
          { key: 'failed', label: '失败' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            style={{
              padding: '4px 12px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 6,
              background: statusFilter === key ? 'rgba(59,130,246,0.2)' : 'rgba(148,163,184,0.06)',
              color: statusFilter === key ? '#60a5fa' : '#94a3b8', cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              padding: '4px 12px', fontSize: 11, borderRadius: 6,
              background: showDetails ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.06)',
              border: showDetails ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
              color: showDetails ? '#93c5fd' : '#94a3b8', cursor: 'pointer',
            }}
          >
            {showDetails ? '收起详情' : '展开详情'}
          </button>
          <span style={{ fontSize: 11, color: '#475569' }}>
            筛选 {filteredExperiments.length}/{MOCK_EXPERIMENTS.length}
          </span>
        </div>
      </div>

      {/* 详情表格 */}
      {showDetails && (
        <div style={{ marginBottom: 20, background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>实验名称</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>状态</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>指标</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>优胜方案</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>提升</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>置信度</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_EXPERIMENTS.map(exp => {
                const winner = exp.variants.find(v => v.isWinner);
                return (
                  <tr key={exp.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                    <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 600 }}>{exp.name}</td>
                    <td style={{ padding: '10px 14px' }}>{getStatusBadge(exp.status)}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{exp.targetMetric}</td>
                    <td style={{ padding: '10px 14px', color: winner ? '#4ade80' : '#64748b' }}>{winner?.name || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#4ade80', fontWeight: 600 }}>{winner ? `+${winner.liftPercent}%` : '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#60a5fa', fontWeight: 600 }}>{exp.confidenceLevel}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Variant对比可视化 */}
      <div style={{ marginBottom: 20, padding: 14, background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.08)' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', margin: '0 0 10px' }}>📊 关键实验 Variant 对比</h3>
        <VariantComparisonBar winner="新版" v1="对照组" v2="新版" />
        <VariantComparisonBar winner="深度学习模型 v2.3" v1="协同过滤" v2="深度学习模型 v2.3" />
        <VariantComparisonBar winner="10秒弹出" v1="5秒弹出" v2="10秒弹出" />
      </div>

      {/* 主体区域 */}
      {filteredExperiments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontSize: 14 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔬</div>
          暂无符合条件的实验
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AIExperimentOptimizationPanel
            experiments={filteredExperiments}
            suggestions={MOCK_SUGGESTIONS}
            activeExperimentCount={filteredExperiments.filter((e) => e.status === 'running').length}
            opportunityCount={MOCK_SUGGESTIONS.length}
            estimatedTotalLift={stats.totalLift}
            title={`${statusFilter === 'all' ? '全部' : statusFilter}实验 (${filteredExperiments.length})`}
          />
        </div>
      )}

      {/* 优化建议优先级列表 */}
      <div style={{ marginTop: 20, marginBottom: 20, padding: 16, background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.08)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 12px' }}>🎯 优化建议优先级</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>建议名称</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>类别</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>预期提升</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>优先级</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>关联实验</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SUGGESTIONS.map(s => {
              const priorityColor = s.expectedLift >= 20 ? '#4ade80' : s.expectedLift >= 12 ? '#fbbf24' : '#94a3b8';
              const priorityLabel = s.expectedLift >= 20 ? '高' : s.expectedLift >= 12 ? '中' : '低';
              const relatedExp = MOCK_EXPERIMENTS.find(e => e.id === s.relatedExperimentId);
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                  <td style={{ padding: '8px 12px', color: '#e2e8f0', fontWeight: 600 }}>{s.title}</td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{s.category === 'placement' ? '页面布局' : s.category === 'promotion' ? '促销策略' : '其他'}</td>
                  <td style={{ padding: '8px 12px', color: '#4ade80', fontWeight: 600 }}>+{s.expectedLift}%</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: `${priorityColor}20`, color: priorityColor, fontWeight: 600 }}>{priorityLabel}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#64748b' }}>{relatedExp?.name || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 学习与洞察 */}
      <div style={{ marginTop: 20, padding: 16, background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.08)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 10px' }}>💡 AI 实验洞察</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12, color: '#94a3b8' }}>
          <div style={{ padding: 10, background: 'rgba(15,23,42,0.6)', borderRadius: 8 }}>
            <div style={{ color: '#4ade80', fontWeight: 600, marginBottom: 4 }}>最佳实践</div>
            <div>88% 的实验都发现了显著优胜方案，AI驱动优化效果明显。建议持续保持实验文化，每两周开启新实验。</div>
          </div>
          <div style={{ padding: 10, background: 'rgba(15,23,42,0.6)', borderRadius: 8 }}>
            <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 4 }}>待关注</div>
            <div>2个实验处于草稿状态，建议尽快配置并启动以获取优化收益。草稿超过30天将自动归档。</div>
          </div>
          <div style={{ padding: 10, background: 'rgba(15,23,42,0.6)', borderRadius: 8 }}>
            <div style={{ color: '#60a5fa', fontWeight: 600, marginBottom: 4 }}>预期收益</div>
            <div>所有建议全部采纳预计可提升综合转化率 {stats.totalLift}%，约等于年度增收 ¥280,000。</div>
          </div>
          <div style={{ padding: 10, background: 'rgba(15,23,42,0.6)', borderRadius: 8 }}>
            <div style={{ color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>数据质量</div>
            <div>实验样本量充足，所有运行中实验的置信度均达到90%以上。建议设定95%作为默认阈值。</div>
          </div>
        </div>
      </div>

      {/* 季节性优化日历 */}
      <div style={{ marginTop: 20, padding: 16, background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.08)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 10px' }}>📅 实验时间线</h3>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {MOCK_EXPERIMENTS.map(exp => {
            const startDate = new Date(exp.startDate);
            const startStr = startDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
            const endDate = exp.endDate ? new Date(exp.endDate) : null;
            const endStr = endDate ? endDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '待定';
            const barColor = exp.status === 'running' ? '#22c55e' : exp.status === 'completed' ? '#8b5cf6' : exp.status === 'paused' ? '#f97316' : '#475569';
            return (
              <div key={exp.id} style={{ minWidth: 120, padding: 10, background: 'rgba(15,23,42,0.6)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exp.name}</div>
                <div style={{ height: 4, background: barColor, borderRadius: 2, marginBottom: 4 }} />
                <div style={{ fontSize: 9, color: '#64748b' }}>{startStr} ~ {endStr}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 指标趋势对比 */}
      <div style={{ marginTop: 20, padding: 16, background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.08)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 10px' }}>📈 实验效果对比 (对照组 vs 实验组)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
          {MOCK_EXPERIMENTS.filter(e => e.variants.length >= 2).slice(0, 3).map(exp => {
            const control = exp.variants[0];
            const winner = exp.variants.find(v => v.isWinner) || exp.variants[1];
            const convDiff = (winner?.conversionRate ?? control?.conversionRate ?? 0) - (control?.conversionRate ?? 0);
            const convPct = (control?.conversionRate ?? 1) > 0 ? Math.round((convDiff / (control?.conversionRate ?? 1)) * 100) : 0;
            return (
              <div key={exp.id} style={{ padding: 12, background: 'rgba(15,23,42,0.6)', borderRadius: 8 }}>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{exp.name}</div>
                <div style={{ color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>对照组</span>
                  <span style={{ color: '#94a3b8' }}>{control?.conversionRate}%</span>
                </div>
                <div style={{ color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>实验组</span>
                  <span style={{ color: '#4ade80' }}>{winner?.conversionRate}%</span>
                </div>
                <div style={{ color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>提升</span>
                  <span style={{ color: convPct > 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                    {convPct > 0 ? '+' : ''}{convPct}%
                  </span>
                </div>
                <div style={{ marginTop: 8, height: 6, background: 'rgba(148,163,184,0.1)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: '50%', height: '100%', background: '#475569' }} />
                  <div style={{ width: '50%', height: '100%', background: '#22c55e' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 快速操作区 */}
      <div style={{ marginTop: 20, padding: 16, background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.08)', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ✨ AI 推荐新实验
        </button>
        <button style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          📊 导出实验报告
        </button>
        <button style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          🔔 设置实验告警
        </button>
        <button style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          📖 实验最佳实践
        </button>
      </div>

      {/* 脚注 */}
      <div style={{ marginTop: 16, fontSize: 11, color: '#475569', textAlign: 'center' }}>
        AI 实验优化中心 · 数据更新于 {new Date().toLocaleString('zh-CN')} · 共 {stats.total} 个实验 · {MOCK_SUGGESTIONS.length} 条优化建议 · 预期总提升 {stats.totalLift}%
      </div>
    </div>
  );
}
