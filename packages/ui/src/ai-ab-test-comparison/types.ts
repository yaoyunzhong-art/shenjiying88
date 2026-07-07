// ── AI A/B Test Comparison Types ────────────────────────────────────────────

/** 实验变体身份 */
export type TestVariant = 'A' | 'B';

/** 单个实验分组统计 */
export interface VariantStats {
  variant: TestVariant;
  /** 执行总次数 */
  totalExecutions: number;
  /** 成功次数 */
  successCount: number;
  /** 失败次数 */
  failureCount: number;
  /** 平均耗时（ms） */
  avgDurationMs: number;
  /** P95 耗时（ms） */
  p95DurationMs: number;
  /** 平均置信度 */
  avgConfidence: number;
  /** 采纳次数（adopted） */
  adoptionCount: number;
  /** 建议节省/提升平均值（单位自定） */
  avgValueDelta: number;
}

/** 单次实验记录 */
export interface ABTestRecord {
  id: string;
  variant: TestVariant;
  ruleName: string;
  status: 'SUCCESS' | 'FAILURE' | 'TIMEOUT';
  confidence: number;
  valueDelta: number;
  durationMs: number;
  adopted: boolean;
  executedAt: string;
}

/** A/B 实验摘要对比 */
export interface ABTestComparison {
  experimentId: string;
  experimentName: string;
  ruleName: string;
  startedAt: string;
  endedAt: string;
  variantA: VariantStats;
  variantB: VariantStats;
  /** 置信区间 95% 下是否显著 */
  isSignificant: boolean;
  /** p 值 */
  pValue: number;
  /** 推荐采信变体（null=无显著差异） */
  recommendedVariant: TestVariant | null;
  /** 提升幅度摘要 */
  liftSummary: string;
}

/** 组件 props */
export interface AiABTestComparisonPanelProps {
  comparisons: ABTestComparison[];
  onSelectComparison?: (experimentId: string) => void;
  onAdoptVariant?: (experimentId: string, variant: TestVariant) => void;
  compact?: boolean;
}
