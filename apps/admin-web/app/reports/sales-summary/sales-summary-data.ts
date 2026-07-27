export type SalesSummaryPeriod = 'today' | 'week' | 'month'

export interface SalesSummaryRecord {
  date: string
  channel: '门店' | '小程序' | '团购' | '企业客户'
  orders: number
  revenue: number
  refunds: number
  netRevenue: number
  topProduct: string
}

export interface SalesSummarySnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'reports-sales-summary-mock'
  periodOptions: SalesSummaryPeriod[]
  records: SalesSummaryRecord[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

const SALES_SUMMARY_RECORDS: SalesSummaryRecord[] = [
  { date: '2026-07-21', channel: '门店', orders: 218, revenue: 84600, refunds: 1200, netRevenue: 83400, topProduct: '体验套票' },
  { date: '2026-07-22', channel: '小程序', orders: 196, revenue: 73200, refunds: 800, netRevenue: 72400, topProduct: '双人畅玩' },
  { date: '2026-07-23', channel: '门店', orders: 242, revenue: 91800, refunds: 900, netRevenue: 90900, topProduct: '会员续费' },
  { date: '2026-07-24', channel: '团购', orders: 128, revenue: 56400, refunds: 600, netRevenue: 55800, topProduct: '团建包场' },
  { date: '2026-07-25', channel: '企业客户', orders: 64, revenue: 68800, refunds: 0, netRevenue: 68800, topProduct: '企业团建' },
  { date: '2026-07-26', channel: '门店', orders: 276, revenue: 103400, refunds: 1600, netRevenue: 101800, topProduct: '家庭畅玩' },
  { date: '2026-07-27', channel: '小程序', orders: 231, revenue: 88700, refunds: 1400, netRevenue: 87300, topProduct: '周末套票' },
]

export async function loadSalesSummarySnapshot(): Promise<SalesSummarySnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'reports-sales-summary-mock',
    periodOptions: ['today', 'week', 'month'],
    records: SALES_SUMMARY_RECORDS.map((item) => ({ ...item })),
    generatedAt: '2026-07-27T16:41:00.000Z',
    controlPlaneSource: 'loadSalesSummarySnapshot -> SALES_SUMMARY_RECORDS',
    businessDataSource: 'local sales summary records + derived order and refund totals',
    refreshPath: 'SalesSummaryPage -> loadSalesSummarySnapshot()',
    note: '销售汇总报表当前使用本地 sales summary snapshot，订单、收入与退款均为固证样本。',
    error: '销售汇总尚未接入真实经营分析读模型，当前展示 mock 快照。',
  }
}
