import type { TierData, TierDistributionParams } from './types';

/** Default mock member tier data */
export const MOCK_TIER_DATA: TierData[] = [
  { key: 'diamond', label: '钻石', count: 5, color: '#a78bfa' },
  { key: 'platinum', label: '铂金', count: 12, color: '#818cf8' },
  { key: 'gold', label: '黄金', count: 20, color: '#fbbf24' },
  { key: 'silver', label: '白银', count: 28, color: '#94a3b8' },
  { key: 'bronze', label: '青铜', count: 18, color: '#d97706' },
  { key: 'standard', label: '标准', count: 7, color: '#6b7280' },
];

/** Total count derived from mock data */
export const MOCK_TIER_TOTAL = MOCK_TIER_DATA.reduce((s, t) => s + t.count, 0);

/** Mock fetch function for tier distribution */
export function fetchMockTierDistribution(
  _params?: TierDistributionParams,
): Promise<{ tiers: TierData[]; total: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ tiers: MOCK_TIER_DATA, total: MOCK_TIER_TOTAL });
    }, 800);
  });
}
