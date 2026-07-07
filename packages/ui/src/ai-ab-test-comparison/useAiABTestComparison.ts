'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ABTestComparison, TestVariant, AiABTestComparisonPanelProps } from './types';
import { mockABTestComparisons } from './useAiABTestComparison.mock';
import type { VariantStats } from './types';

// ── Sort / filter helpers ───────────────────────────────────────────────────

export type SortKey = 'pValue' | 'lift' | 'name' | 'date';

interface UseAiABTestComparisonReturn {
  comparisons: ABTestComparison[];
  loading: boolean;
  error: string | null;
  sortKey: SortKey;
  setSortKey: (key: SortKey) => void;
  showOnlySignificant: boolean;
  setShowOnlySignificant: (v: boolean) => void;
  adoptVariant: (experimentId: string, variant: TestVariant) => void;
  getVariantRate: (stats: VariantStats) => number;
  getVariantAdoptionRate: (stats: VariantStats) => number;
}

export function useAiABTestComparison(): UseAiABTestComparisonReturn {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [showOnlySignificant, setShowOnlySignificant] = useState(false);

  const raw = useMemo(() => mockABTestComparisons(), []);

  const filtered = useMemo(() => {
    let list = [...raw];
    if (showOnlySignificant) {
      list = list.filter((e) => e.isSignificant);
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case 'pValue':
          return a.pValue - b.pValue;
        case 'lift': {
          const aLift = Math.abs(a.variantB.avgValueDelta - a.variantA.avgValueDelta);
          const bLift = Math.abs(b.variantB.avgValueDelta - b.variantA.avgValueDelta);
          return bLift - aLift;
        }
        case 'name':
          return a.experimentName.localeCompare(b.experimentName);
        case 'date':
        default:
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      }
    });
    return list;
  }, [raw, sortKey, showOnlySignificant]);

  // 模拟「采纳」— 实际上 mock 数据不需要真正的 mutation
  const adoptVariant = useCallback((_experimentId: string, _variant: TestVariant) => {
    // In a real implementation, this would call an API
    console.log(`Adopt variant ${_variant} for experiment ${_experimentId}`);
  }, []);

  const getVariantRate = useCallback((stats: VariantStats): number => {
    if (stats.totalExecutions === 0) return 0;
    return stats.successCount / stats.totalExecutions;
  }, []);

  const getVariantAdoptionRate = useCallback((stats: VariantStats): number => {
    if (stats.totalExecutions === 0) return 0;
    return stats.adoptionCount / stats.totalExecutions;
  }, []);

  return {
    comparisons: filtered,
    loading: false,
    error: null,
    sortKey,
    setSortKey,
    showOnlySignificant,
    setShowOnlySignificant,
    adoptVariant,
    getVariantRate,
    getVariantAdoptionRate,
  };
}
