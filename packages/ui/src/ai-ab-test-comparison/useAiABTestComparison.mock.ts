import type { ABTestComparison, VariantStats } from './types';

// ── Mock data generators ────────────────────────────────────────────────────

function makeVariantStats(base: Partial<VariantStats> & { variant: 'A' | 'B' }): VariantStats {
  return {
    totalExecutions: base.totalExecutions ?? 0,
    successCount: base.successCount ?? 0,
    failureCount: base.failureCount ?? 0,
    avgDurationMs: base.avgDurationMs ?? 0,
    p95DurationMs: base.p95DurationMs ?? 0,
    avgConfidence: base.avgConfidence ?? 0,
    adoptionCount: base.adoptionCount ?? 0,
    avgValueDelta: base.avgValueDelta ?? 0,
    variant: base.variant,
  };
}

export function mockABTestComparisons(): ABTestComparison[] {
  return [
    {
      experimentId: 'exp-001',
      experimentName: '会员折扣阈值优化',
      ruleName: '会员升级规则',
      startedAt: '2026-06-15T00:00:00Z',
      endedAt: '2026-06-30T23:59:59Z',
      variantA: makeVariantStats({
        variant: 'A',
        totalExecutions: 1250,
        successCount: 1180,
        failureCount: 70,
        avgDurationMs: 320,
        p95DurationMs: 890,
        avgConfidence: 0.82,
        adoptionCount: 980,
        avgValueDelta: 12.5,
      }),
      variantB: makeVariantStats({
        variant: 'B',
        totalExecutions: 1280,
        successCount: 1216,
        failureCount: 64,
        avgDurationMs: 280,
        p95DurationMs: 720,
        avgConfidence: 0.91,
        adoptionCount: 1120,
        avgValueDelta: 18.3,
      }),
      isSignificant: true,
      pValue: 0.023,
      recommendedVariant: 'B',
      liftSummary: 'B 方案置信度提升 9.8%，节省均值提升 46.4%，p=0.023 显著',
    },
    {
      experimentId: 'exp-002',
      experimentName: '风控拦截触发时机',
      ruleName: '风控拦截规则',
      startedAt: '2026-06-10T00:00:00Z',
      endedAt: '2026-06-25T23:59:59Z',
      variantA: makeVariantStats({
        variant: 'A',
        totalExecutions: 3400,
        successCount: 3120,
        failureCount: 280,
        avgDurationMs: 150,
        p95DurationMs: 420,
        avgConfidence: 0.76,
        adoptionCount: 2800,
        avgValueDelta: 0,
      }),
      variantB: makeVariantStats({
        variant: 'B',
        totalExecutions: 3350,
        successCount: 3150,
        failureCount: 200,
        avgDurationMs: 180,
        p95DurationMs: 480,
        avgConfidence: 0.88,
        adoptionCount: 3100,
        avgValueDelta: 0,
      }),
      isSignificant: true,
      pValue: 0.008,
      recommendedVariant: 'B',
      liftSummary: 'B 方案失败率降低 28.6%，置信度提升 15.8%，p=0.008 显著',
    },
    {
      experimentId: 'exp-003',
      experimentName: '优惠券发放渠道权重',
      ruleName: '优惠券发放规则',
      startedAt: '2026-06-20T00:00:00Z',
      endedAt: '2026-07-04T23:59:59Z',
      variantA: makeVariantStats({
        variant: 'A',
        totalExecutions: 890,
        successCount: 810,
        failureCount: 80,
        avgDurationMs: 410,
        p95DurationMs: 1050,
        avgConfidence: 0.79,
        adoptionCount: 740,
        avgValueDelta: 8.2,
      }),
      variantB: makeVariantStats({
        variant: 'B',
        totalExecutions: 920,
        successCount: 840,
        failureCount: 80,
        avgDurationMs: 390,
        p95DurationMs: 980,
        avgConfidence: 0.81,
        adoptionCount: 760,
        avgValueDelta: 9.1,
      }),
      isSignificant: false,
      pValue: 0.31,
      recommendedVariant: null,
      liftSummary: '两组差异不显著（p=0.31），建议延长实验周期或调整方案差异',
    },
  ];
}

export function useAiABTestComparison() {
  return {
    comparisons: mockABTestComparisons(),
    loading: false,
    error: null,
  };
}
