'use client';

import { useCallback, useState } from 'react';
import type { RuleWeightItem, WeightAdjustResult } from './types';

export interface UseAIRuleWeightReturn {
  rules: RuleWeightItem[];
  loading: boolean;
  error: string | null;
  updateWeight: (ruleId: string, newWeight: number) => void;
  batchUpdate: (adjustments: WeightAdjustResult[]) => void;
  resetWeights: () => void;
}

export function useAIRuleWeight(initialRules: RuleWeightItem[]): UseAIRuleWeightReturn {
  const [rules, setRules] = useState<RuleWeightItem[]>(initialRules);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const updateWeight = useCallback((ruleId: string, newWeight: number) => {
    setRules(prev =>
      prev.map(r => (r.id === ruleId ? { ...r, currentWeight: Math.max(0, Math.min(100, newWeight)) } : r))
    );
  }, []);

  const batchUpdate = useCallback((adjustments: WeightAdjustResult[]) => {
    setRules(prev =>
      prev.map(r => {
        const adj = adjustments.find(a => a.ruleId === r.id);
        return adj ? { ...r, currentWeight: Math.max(0, Math.min(100, adj.newWeight)) } : r;
      })
    );
  }, []);

  const resetWeights = useCallback(() => {
    setRules(initialRules);
  }, [initialRules]);

  return { rules, loading, error, updateWeight, batchUpdate, resetWeights };
}
