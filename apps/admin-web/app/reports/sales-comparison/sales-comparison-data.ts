export type SalesComparisonPeriod = '本周 vs 上周' | '本月 vs 上月'

export interface SalesComparisonRecord {
  period: SalesComparisonPeriod
  metric: string
  current: number
  previous: number
  unit: 'currency' | 'count' | 'percent'
}

export interface SalesComparisonSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'reports-sales-comparison-mock'
  records: SalesComparisonRecord[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

const SALES_COMPARISON_RECORDS: SalesComparisonRecord[] = [
  { period: '本周 vs 上周', metric: '营收', current: 1026400, previous: 954300, unit: 'currency' },
  { period: '本周 vs 上周', metric: '订单数', current: 3240, previous: 3015, unit: 'count' },
  { period: '本周 vs 上周', metric: '客单价', current: 317, previous: 306, unit: 'currency' },
  { period: '本周 vs 上周', metric: '退款率', current: 2.1, previous: 2.8, unit: 'percent' },
  { period: '本月 vs 上月', metric: '营收', current: 4263800, previous: 3954200, unit: 'currency' },
  { period: '本月 vs 上月', metric: '新增会员', current: 628, previous: 544, unit: 'count' },
  { period: '本月 vs 上月', metric: '新客占比', current: 38.4, previous: 35.2, unit: 'percent' },
  { period: '本月 vs 上月', metric: '活跃率', current: 71.8, previous: 68.6, unit: 'percent' },
]

export async function loadSalesComparisonSnapshot(): Promise<SalesComparisonSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'reports-sales-comparison-mock',
    records: SALES_COMPARISON_RECORDS.map((item) => ({ ...item })),
    generatedAt: '2026-07-27T16:42:00.000Z',
    controlPlaneSource: 'loadSalesComparisonSnapshot -> SALES_COMPARISON_RECORDS',
    businessDataSource: 'local comparison metrics + derived delta and growth flags',
    refreshPath: 'SalesComparisonPage -> loadSalesComparisonSnapshot()',
    note: '销售对比报表当前消费本地 comparison snapshot，周期对比与增长率均为 mock 样本。',
    error: '销售对比尚未接入真实 BI 聚合接口，当前展示 mock 快照。',
  }
}
