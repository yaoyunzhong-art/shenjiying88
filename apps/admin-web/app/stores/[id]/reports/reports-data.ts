export type ReportStatus = 'ready' | 'generating' | 'overdue' | 'failed'

export interface AutoReportRecord {
  id: string
  name: string
  freq: string
  desc: string
  last: string
  status: ReportStatus
  category: string
}

export interface CustomReportRecord {
  id: string
  name: string
  creator: string
  created: string
  status: 'ready' | 'generating'
  progress: number
}

export interface ReportsSnapshotSummary {
  totalReports: number
  readyCount: number
  generatingCount: number
  overdueCount: number
  categoryCount: number
}

export interface ReportsSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-reports-mock'
  storeId: string
  autoReports: AutoReportRecord[]
  customReports: CustomReportRecord[]
  categories: string[]
  summary: ReportsSnapshotSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const AUTO_REPORT_RECORDS: AutoReportRecord[] = [
  { id: 'R01', name: '每日营收报表', freq: '每日', desc: '前一日营收/支出/净利汇总', last: '2026-07-13', status: 'ready', category: '财务' },
  { id: 'R02', name: '客流趋势报表', freq: '每周', desc: '周客流/时段分布/峰值', last: '2026-07-13', status: 'ready', category: '运营' },
  { id: 'R03', name: '设备使用率报表', freq: '每月', desc: '各设备使用率/故障率/收益', last: '2026-07-01', status: 'ready', category: '设备' },
  { id: 'R04', name: '会员消费分析', freq: '每月', desc: '会员消费频次/客单价/偏好', last: '2026-07-01', status: 'ready', category: '会员' },
  { id: 'R05', name: '库存盘点报告', freq: '自定义', desc: '库存盘点差异/损耗分析', last: '2026-06-30', status: 'overdue', category: '库存' },
]

export const CUSTOM_REPORT_RECORDS: CustomReportRecord[] = [
  { id: 'C01', name: '七月促销效果分析', creator: '张三', created: '2026-07-10', status: 'generating', progress: 60 },
  { id: 'C02', name: '设备故障排行', creator: '李四', created: '2026-07-08', status: 'ready', progress: 100 },
  { id: 'C03', name: '周末客单价对比', creator: '张三', created: '2026-07-03', status: 'ready', progress: 100 },
]

export function buildReportsSummary(
  autoReports: AutoReportRecord[],
  customReports: CustomReportRecord[],
  categories: string[]
): ReportsSnapshotSummary {
  return {
    totalReports: autoReports.length + customReports.length,
    readyCount:
      autoReports.filter((item) => item.status === 'ready').length +
      customReports.filter((item) => item.status === 'ready').length,
    generatingCount: customReports.filter((item) => item.status === 'generating').length,
    overdueCount: autoReports.filter((item) => item.status === 'overdue').length,
    categoryCount: categories.length,
  }
}

export async function loadReportsSnapshot(storeId: string): Promise<ReportsSnapshot> {
  const autoReports = AUTO_REPORT_RECORDS.map((item) => ({ ...item }))
  const customReports = CUSTOM_REPORT_RECORDS.map((item) => ({ ...item }))
  const categories = Array.from(new Set(autoReports.map((item) => item.category)))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-reports-mock',
    storeId,
    autoReports,
    customReports,
    categories,
    summary: buildReportsSummary(autoReports, customReports, categories),
    generatedAt: '2026-07-27T17:35:00.000Z',
    controlPlaneSource: 'loadReportsSnapshot -> AUTO_REPORT_RECORDS + CUSTOM_REPORT_RECORDS + buildReportsSummary',
    businessDataSource: 'local reports samples + derived category and status counters',
    refreshPath: `ReportsPage -> loadReportsSnapshot(${storeId})`,
    note: '当前门店报表页消费本地 reports snapshot loader，已显式暴露来源态与刷新路径，生成、分享与新建报表仍为 mock 演示。',
    error: '门店报表控制面尚未接入实时 BI 上游，当前展示 mock 快照。',
  }
}
