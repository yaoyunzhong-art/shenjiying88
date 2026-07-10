'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TierData, TierSummary, TierDistributionParams } from './types';
import { fetchMockTierDistribution } from './useTierDistribution.mock';

interface UseTierDistributionResult {
  tiers: TierData[];
  total: number;
  summary: TierSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook to load and manage member tier distribution data.
 * Falls back to mock data; swap `fetchMockTierDistribution` with a real API call in production.
 */
export function useTierDistribution(
  params?: TierDistributionParams,
): UseTierDistributionResult {
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMockTierDistribution(params);
      setTiers(data.tiers);
      setTotal(data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载等级分布数据失败');
    } finally {
      setLoading(false);
    }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const sorted = [...tiers].sort((a, b) => b.count - a.count);
  const summary: TierSummary | null = tiers.length
    ? {
        total,
        highestTier: sorted[0] ?? null,
        lowestTier: sorted[sorted.length - 1] ?? null,
        growthRate: 0, // placeholder — wire up historical comparison when backend is ready
      }
    : null;

  return { tiers, total, summary, loading, error, refresh: load };
}
