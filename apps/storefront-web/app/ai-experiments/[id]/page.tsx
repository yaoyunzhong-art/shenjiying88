/**
 * AI实验详情页 — AI Experiment Detail (Next.js App Router Page)
 * 功能: 展示单条实验的完整配置、运行状态、指标趋势、对比组、处置操作
 * 角色视角: 运营经理 / 营销经理 / AI训练师
 */
'use client';

import React, { useMemo, useCallback } from 'react';
import { notFound, useRouter } from 'next/navigation';
import {
  AIExperimentOptimizationPanel,
  DetailShell,
  DetailClosureBar,
  ComparisonBreakdownChart,
  type ExperimentEntry,
  type ExperimentStatus,
  type ExperimentVariant,
  type OptimizationSuggestion,
} from '@m5/ui';

// ============================================================
// Mock 实验详细数据
// ============================================================

interface ExperimentDetail extends ExperimentEntry {
  createdBy: string;
  lastModifiedAt: string;
  description: string;
  trafficPercent: number;
  winner: string | null;
}

const generateVariants = (
  controlValue: number,
  variantValue: number,
  controlLabel = '对照组',
  variantLabel = '实验组',
  trafficPercent = 50,
): ExperimentVariant[] => [
  {
    id: 'control',
    name: controlLabel,
    trafficPercent,
    conversionRate: controlValue,
    sampleSize: controlValue > 1000 ? Math.round(controlValue / 100) : 1200,
    isWinner: controlValue > variantValue,
    liftPercent: 0,
  },
  {
    id: 'variant',
    name: variantLabel,
    trafficPercent: 100 - trafficPercent,
    conversionRate: variantValue,
    sampleSize: variantValue > 1000 ? Math.round(variantValue / 100) : 1200,
    isWinner: variantValue >= controlValue,
    liftPercent: variantValue > 0 && controlValue > 0
      ? Math.round(((variantValue - controlValue) / controlValue) * 1000) / 10
      : 0,
  },
];

const MOCK_EXPERIMENTS: Record<string, ExperimentDetail> = {
  'exp-001': {
    id: 'exp-001',
    name: '首页Banner布局优化',
    description: '将首页Banner从上下滑动改为左右轮播 + 自动播放，测试对点击转化率的影响。',
    status: 'running',
    targetMetric: '首页点击转化率',
    startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    trafficPercent: 50,
    createdBy: '王明',
    lastModifiedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    winner: null,
    variants: generateVariants(3.2, 3.8),
    confidenceLevel: 85,
    aiRecommendation: '实验运行中，7天后可查看结论。目前实验组点击转化率 +18.75%，趋势向好。',
  },
  'exp-002': {
    id: 'exp-002',
    name: '会员日折扣力度测试',
    description: '对比 8折 vs 7.5折对会员日当天 GMV 和客单价的影响。',
    status: 'completed',
    targetMetric: '会员日GMV',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 23 * 86400000).toISOString(),
    trafficPercent: 50,
    createdBy: '李婷',
    lastModifiedAt: new Date(Date.now() - 22 * 86400000).toISOString(),
    winner: 'variant',
    variants: generateVariants(125800, 144670, '8折', '7.5折'),
    confidenceLevel: 95,
    aiRecommendation: '实验组 7.5折 方案显著胜出！GMV提升15%，客单价+9.09%，长期效果值得关注。',
  },
  'exp-003': {
    id: 'exp-003',
    name: 'Push通知文案A/B测试',
    description: '测试不同 Push 文案对打开率的影响。A: "限时优惠最后3小时" B: "为您精选好物"',
    status: 'running',
    targetMetric: 'Push打开率',
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    trafficPercent: 30,
    createdBy: '赵岩',
    lastModifiedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    winner: null,
    variants: generateVariants(12.5, 14.1, '文案A: 限时优惠最后3小时', '文案B: 为您精选好物', 30),
    confidenceLevel: 72,
    aiRecommendation: '实验运行中，目前实验组打开率+12.8%，但尚未达到统计显著性。推荐继续收集数据。',
  },
  'exp-004': {
    id: 'exp-004',
    name: '推荐算法版本对比测试',
    description: '新版协同过滤推荐算法 vs 现有规则推荐，测试推荐位点击率。',
    status: 'completed',
    targetMetric: '推荐位点击率',
    startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 53 * 86400000).toISOString(),
    trafficPercent: 20,
    createdBy: 'AI训练师',
    lastModifiedAt: new Date(Date.now() - 52 * 86400000).toISOString(),
    winner: 'control',
    variants: generateVariants(5.6, 5.2, '现有规则推荐', '新版协同过滤推荐', 20),
    confidenceLevel: 90,
    aiRecommendation: '对照组胜出，现有推荐算法表现更优。新算法在点击率上落后 -7.14%，建议进一步优化。',
  },
};

/* 指标对比数据 (用于 ComparisonBreakdownChart) */
interface MetricComparison {
  label: string;
  control: number;
  variant: number;
  uplift: string;
  significant: boolean;
}

const MOCK_METRICS_BY_EXP: Record<string, MetricComparison[]> = {
  'exp-001': [
    { label: '点击转化率', control: 3.2, variant: 3.8, uplift: '+18.75%', significant: true },
    { label: '平均停留时长(秒)', control: 45, variant: 52, uplift: '+15.56%', significant: true },
    { label: '跳出率', control: 42, variant: 38, uplift: '-9.52%', significant: false },
  ],
  'exp-002': [
    { label: 'GMV(元)', control: 125800, variant: 144670, uplift: '+15.0%', significant: true },
    { label: '客单价(元)', control: 286, variant: 312, uplift: '+9.09%', significant: true },
    { label: '订单数', control: 440, variant: 464, uplift: '+5.45%', significant: false },
  ],
  'exp-003': [
    { label: 'Push打开率', control: 12.5, variant: 14.1, uplift: '+12.8%', significant: false },
    { label: '点击后转化率', control: 8.2, variant: 9.0, uplift: '+9.76%', significant: false },
  ],
  'exp-004': [
    { label: '推荐位点击率', control: 5.6, variant: 5.2, uplift: '-7.14%', significant: true },
    { label: '推荐商品成交率', control: 3.1, variant: 2.8, uplift: '-9.68%', significant: false },
  ],
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AIExperimentDetailPage({ params }: PageProps) {
  const router = useRouter();

  // 在 client component 中用 React.use 解包 params
  const { id } = React.use(params);

  const experiment = useMemo<ExperimentDetail | null>(() => {
    return MOCK_EXPERIMENTS[id] ?? null;
  }, [id]);

  const handleRegenerate = useCallback(() => {
    alert('实验重新运行已触发');
  }, []);

  const handleStop = useCallback(() => {
    if (confirm('确认停止此实验？已收集的数据将被保留。')) {
      alert('实验已停止');
    }
  }, []);

  const handleApplyWinner = useCallback(() => {
    if (experiment?.winner === 'variant') {
      alert('已应用实验组配置到全量流量');
    } else if (experiment?.winner === 'control') {
      alert('已保留对照组配置');
    } else {
      alert('实验尚未完成，暂无可应用的优胜方案');
    }
  }, [experiment]);

  const handleExport = useCallback(() => {
    alert('实验数据导出已开始，可在下载中心查看');
  }, []);

  // --- 加载状态 ---
  if (!experiment) {
    return notFound();
  }

  const isRunning = experiment.status === 'running';
  const isCompleted = experiment.status === 'completed';

  // 转换 metrics 为 OptimizationSuggestion[]
  const suggestions: OptimizationSuggestion[] = useMemo(() => {
    const metrics = MOCK_METRICS_BY_EXP[id] ?? [];
    return metrics.map((m, i) => ({
      id: `sug-${id}-${i}`,
      title: m.significant ? `${m.label} 显著提升` : `${m.label} 趋势向好`,
      expectedLift: m.significant ? parseFloat(m.uplift.replace(/[+%]/g, '')) : 0,
      category: 'promotion' as const,
      description: `${m.label}: 对照组 ${m.control} → 实验组 ${m.variant} (${m.uplift})${m.significant ? ' ✓ 统计显著' : ''}`,
    }));
  }, [id]);



  // 对比组数据转为 ComparisonItem[]
  const breakdownData = useMemo(() => {
    const metrics = MOCK_METRICS_BY_EXP[id] ?? [];
    return metrics.map((m) => ({
      label: m.label,
      value: m.variant,
      baseline: m.control,
    }));
  }, [id]);

  const statusColor: Record<ExperimentStatus, 'success' | 'warning' | 'info' | 'default' | 'error'> = {
    running: 'info',
    completed: 'success',
    draft: 'default',
    paused: 'warning',
    failed: 'error',
  };

  const statusLabel: Record<ExperimentStatus, string> = {
    running: '运行中',
    completed: '已完成',
    draft: '草稿',
    paused: '已暂停',
    failed: '已失败',
  };

  const shellActions: import('@m5/ui').DetailShellAction[] = [
    ...(isCompleted && experiment.winner
      ? [{ key: 'apply-winner', label: '🏆 应用优胜方案', variant: 'primary' as const, onClick: handleApplyWinner }]
      : []),
    ...(isRunning
      ? [{ key: 'stop', label: '⏹ 停止实验', variant: 'danger' as const, onClick: handleStop }]
      : []),
    { key: 'regenerate', label: '🔄 重新运行', variant: 'secondary' as const, onClick: handleRegenerate },
    { key: 'export', label: '📥 导出数据', variant: 'secondary' as const, onClick: handleExport },
  ];

  const shellActionsAfter: import('@m5/ui').DetailShellAction[] = [
    { key: 'back', label: '← 返回列表', onClick: () => router.push('/ai-experiments') },
  ];

  return (
    <DetailShell
      title={experiment.name}
      subtitle={`实验ID: ${experiment.id} · 创建人: ${experiment.createdBy} · 置信度: ${experiment.confidenceLevel}% · ${statusLabel[experiment.status]}`}
      backLink={{ label: '← 返回AI实验列表', href: '/ai-experiments' }}
      actions={[...shellActions, ...shellActionsAfter]}
    >
      {/* 实验概述卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">实验描述</h3>
          <p className="text-gray-800">{experiment.description}</p>
          {experiment.aiRecommendation && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
              💡 AI推荐: {experiment.aiRecommendation}
            </div>
          )}
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">实验配置</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">目标指标:</dt><dd className="font-medium">{experiment.targetMetric}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">流量分配:</dt><dd className="font-medium">{experiment.trafficPercent}% 实验组 / {100 - experiment.trafficPercent}% 对照组</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">开始时间:</dt><dd className="font-medium">{new Date(experiment.startDate).toLocaleDateString('zh-CN')}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">结束时间:</dt><dd className="font-medium">{experiment.endDate ? new Date(experiment.endDate).toLocaleDateString('zh-CN') : '待定'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">实验方案数:</dt><dd className="font-medium">{experiment.variants.length}</dd></div>
          </dl>
        </div>
      </div>

      {/* 指标对比面板 */}
      <div className="mb-6">
        <AIExperimentOptimizationPanel
          experiments={[experiment]}
          suggestions={suggestions}
          activeExperimentCount={isRunning ? 1 : 0}
          opportunityCount={suggestions.filter(s => s.expectedLift > 0).length}
          estimatedTotalLift={suggestions.reduce((sum, s) => sum + s.expectedLift, 0)}
        />
      </div>

      {/* 对比组明细 */}
      {breakdownData.length > 0 && (
        <div className="mb-6">
          <ComparisonBreakdownChart
            title="核心指标对比"
            data={breakdownData}
          />
        </div>
      )}

      {/* 实验方案对比 */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {experiment.variants.map((v) => (
            <div key={v.id} className={`p-4 border rounded-lg shadow-sm ${v.isWinner ? 'bg-green-50 border-green-300' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-800">{v.name}</h4>
                {v.isWinner && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">优胜</span>}
              </div>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">转化率:</dt><dd className="font-mono">{v.conversionRate}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">流量占比:</dt><dd className="font-mono">{v.trafficPercent}%</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">样本量:</dt><dd className="font-mono">{v.sampleSize.toLocaleString()}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">提升:</dt><dd className={`font-mono ${v.liftPercent > 0 ? 'text-green-600' : v.liftPercent < 0 ? 'text-red-600' : ''}`}>{v.liftPercent > 0 ? '+' : ''}{v.liftPercent}%</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </div>

      {/* 结论与处置 */}
      {isCompleted && (
        <DetailClosureBar
          heading="实验结论"
          links={[
            {
              key: 'experiment-conclusion',
              title: experiment.winner === 'variant' ? '推荐应用实验组' : experiment.winner === 'control' ? '推荐保留对照组' : '无显著差异',
              subtitle: experiment.winner === 'variant'
                ? `实验组方案胜出！整体 ${experiment.targetMetric} 提升显著，建议全量推广。`
                : experiment.winner === 'control'
                  ? '对照组表现更优，建议保留现有方案。'
                  : '未检测到显著差异。',
              href: '#',
              variant: experiment.winner === 'variant' ? 'warning' as const : 'default' as const,
            },
          ]}
        />
      )}
    </DetailShell>
  );
}
