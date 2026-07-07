'use client';

import React, { useMemo, useState } from 'react';
import {
  AIExperimentOptimizationPanel,
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
      {
        id: 'v-control',
        name: '对照组（原版）',
        trafficPercent: 50,
        conversionRate: 3.2,
        sampleSize: 12500,
        isWinner: false,
        liftPercent: 0,
      },
      {
        id: 'v-new',
        name: '实验组（新版）',
        trafficPercent: 50,
        conversionRate: 4.1,
        sampleSize: 12480,
        isWinner: true,
        liftPercent: 28.1,
      },
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
      {
        id: 'v-cf',
        name: '协同过滤',
        trafficPercent: 50,
        conversionRate: 5.8,
        sampleSize: 22000,
        isWinner: false,
        liftPercent: 0,
      },
      {
        id: 'v-dl',
        name: '深度学习模型 v2.3',
        trafficPercent: 50,
        conversionRate: 7.2,
        sampleSize: 21980,
        isWinner: true,
        liftPercent: 24.1,
      },
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
      {
        id: 'v-5s',
        name: '5秒弹出',
        trafficPercent: 50,
        conversionRate: 6.1,
        sampleSize: 8500,
        isWinner: false,
        liftPercent: 0,
      },
      {
        id: 'v-10s',
        name: '10秒弹出',
        trafficPercent: 50,
        conversionRate: 6.8,
        sampleSize: 8430,
        isWinner: true,
        liftPercent: 11.5,
      },
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
      {
        id: 'v-greeting',
        name: '友好问候式',
        trafficPercent: 33,
        conversionRate: 0,
        sampleSize: 0,
        isWinner: false,
        liftPercent: 0,
      },
      {
        id: 'v-question',
        name: '引导提问式',
        trafficPercent: 33,
        conversionRate: 0,
        sampleSize: 0,
        isWinner: false,
        liftPercent: 0,
      },
      {
        id: 'v-direct',
        name: '直接解决式',
        trafficPercent: 34,
        conversionRate: 0,
        sampleSize: 0,
        isWinner: false,
        liftPercent: 0,
      },
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
      {
        id: 'v-5',
        name: '推荐5件',
        trafficPercent: 33,
        conversionRate: 4.5,
        sampleSize: 5200,
        isWinner: false,
        liftPercent: 0,
      },
      {
        id: 'v-8',
        name: '推荐8件',
        trafficPercent: 33,
        conversionRate: 5.2,
        sampleSize: 5180,
        isWinner: true,
        liftPercent: 15.6,
      },
      {
        id: 'v-12',
        name: '推荐12件',
        trafficPercent: 34,
        conversionRate: 4.8,
        sampleSize: 5210,
        isWinner: false,
        liftPercent: 6.7,
      },
    ],
    confidenceLevel: 95,
    aiRecommendation: '推荐8件商品取得最佳平衡，推荐5件信息量不足，12件导致选择困难',
  },
];

const MOCK_SUGGESTIONS: OptimizationSuggestion[] = [
  {
    id: 'sug-001',
    title: '首页Banner布局推广全量',
    expectedLift: 28.1,
    category: 'placement',
    relatedExperimentId: 'exp-001',
    description: '新版Banner布局已验证有效，建议推广至全量用户',
  },
  {
    id: 'sug-002',
    title: '推荐算法切换至深度学习模型',
    expectedLift: 24.1,
    category: 'other',
    relatedExperimentId: 'exp-002',
    description: '深度学习推荐模型显著优于协同过滤，建议全面切换',
  },
  {
    id: 'sug-003',
    title: '推送弹窗设置10秒延迟',
    expectedLift: 11.5,
    category: 'promotion',
    relatedExperimentId: 'exp-003',
    description: '会员日弹窗10秒后弹出转化率更高',
  },
];

// ==================== 页面组件 ====================

export default function AIExperimentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredExperiments = useMemo(() => {
    if (statusFilter === 'all') return MOCK_EXPERIMENTS;
    return MOCK_EXPERIMENTS.filter(
      (exp) => exp.status === (statusFilter as ExperimentStatus),
    );
  }, [statusFilter]);

  const stats = useMemo(() => {
    const total = MOCK_EXPERIMENTS.length;
    const running = MOCK_EXPERIMENTS.filter((e) => e.status === 'running').length;
    const completed = MOCK_EXPERIMENTS.filter((e) => e.status === 'completed').length;
    const draft = MOCK_EXPERIMENTS.filter((e) => e.status === 'draft').length;
    const winners = MOCK_EXPERIMENTS.filter((e) =>
      e.variants.some((v) => v.isWinner),
    ).length;
    const totalLift = MOCK_SUGGESTIONS.reduce((s, sug) => s + sug.expectedLift, 0);
    return { total, running, completed, draft, winners, totalLift };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        padding: '24px 32px',
      }}
    >
      {/* 页面标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#f1f5f9',
              margin: '0 0 4px',
            }}
          >
            AI 实验优化中心
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            AI 驱动自动化 A/B 实验管理与优化建议
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              borderRadius: 8,
              background: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            + 新建实验
          </button>
          <button
            style={{
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: 8,
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            查看 AI 分析报告
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: '实验总数', value: stats.total, color: '#3b82f6' },
          { label: '运行中', value: stats.running, color: '#22c55e' },
          { label: '已完成', value: stats.completed, color: '#8b5cf6' },
          { label: '草稿', value: stats.draft, color: '#f59e0b' },
          { label: '发现优胜方案', value: stats.winners, color: '#ec4899' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
              padding: '16px',
            }}
          >
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          padding: '12px 16px',
          background: 'rgba(15,23,42,0.4)',
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.08)',
        }}
      >
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
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              borderRadius: 6,
              background:
                statusFilter === key
                  ? 'rgba(59,130,246,0.2)'
                  : 'rgba(148,163,184,0.06)',
              color: statusFilter === key ? '#60a5fa' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 主体区域 */}
      {filteredExperiments.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 0',
            color: '#475569',
            fontSize: 14,
          }}
        >
          暂无符合条件的实验
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AIExperimentOptimizationPanel
            experiments={filteredExperiments}
            suggestions={MOCK_SUGGESTIONS}
            activeExperimentCount={
              filteredExperiments.filter((e) => e.status === 'running').length
            }
            opportunityCount={MOCK_SUGGESTIONS.length}
            estimatedTotalLift={stats.totalLift}
            title={`${statusFilter === 'all' ? '全部' : statusFilter}实验 (${filteredExperiments.length})`}
          />
        </div>
      )}
    </div>
  );
}
