// ── Revenue Report Enums ──

export enum RevenueReportType {
  Daily = 'daily',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
}

// ── RevenueReport ──

export interface RevenueReport {
  id: string
  storeId: string
  storeName: string
  startDate: string
  endDate: string
  reportType: RevenueReportType
  totalRevenue: number
  totalExpense: number
  grossProfit: number
  netProfit: number
  revenueBreakdown: Record<string, number>
  expenseBreakdown: Record<string, number>
  previousRevenue?: number
  previousExpense?: number
  revenueGrowthRate?: number
  expenseGrowthRate?: number
  tenantId: string
  createdAt: string
}
