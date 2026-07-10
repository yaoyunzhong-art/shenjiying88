/** Member tier level */
export type TierLevel = 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard';

/** Single tier segment */
export interface TierData {
  key: string;
  label: string;
  count: number;
  color: string;
}

/** Tier distribution summary info */
export interface TierSummary {
  total: number;
  highestTier: TierData | null;
  lowestTier: TierData | null;
  growthRate: number; // percentage compared to last period
}

/** Parameters to fetch tier distribution */
export interface TierDistributionParams {
  groupId?: string;
  startDate?: string;
  endDate?: string;
}
