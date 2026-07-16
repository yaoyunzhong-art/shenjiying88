export enum SpendingPeriod { DAILY = 'daily', WEEKLY = 'weekly', MONTHLY = 'monthly' }

export interface SpendingAnalysis {
  memberId: string;
  period: SpendingPeriod;
  totalSpent: number;
  orderCount: number;
  categoryBreakdown: Record<string, number>;
  peakHours: number[];
  favoriteDays: string[];
  createdAt: string;
}
