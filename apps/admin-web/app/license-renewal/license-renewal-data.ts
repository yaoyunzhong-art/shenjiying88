import type { RenewalRecord, RenewalStatistics, RenewalStrategy } from './types'

export interface LicenseHealthStat {
  total: number
  soonExpiring: number
  expired: number
  autoRenewalEnabled: number
}

export interface ReminderTimelineItem {
  id: string
  title: string
  description: string
  due: string
}

export interface LicenseRenewalSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'license-renewal-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  strategies: RenewalStrategy[]
  records: RenewalRecord[]
  statistics: RenewalStatistics
  licenseHealth: LicenseHealthStat
  reminderTimeline: ReminderTimelineItem[]
}

const STRATEGIES: RenewalStrategy[] = [
  {
    id: 'strategy-basic',
    name: '基础版',
    description: '适合单店试运行，覆盖基础收银、会员和报表能力。',
    price: 299,
    duration: 1,
    durationUnit: 'month',
    maxUsers: 10,
    maxStores: 1,
    features: ['basic', 'analytics'],
    isActive: true,
    createdAt: '2026-06-01 09:00',
    updatedAt: '2026-07-20 11:20',
  },
  {
    id: 'strategy-pro',
    name: '专业版',
    description: '适合区域连锁，支持 API、自动续费和更高并发席位。',
    price: 1999,
    duration: 12,
    durationUnit: 'month',
    maxUsers: 50,
    maxStores: 8,
    features: ['basic', 'analytics', 'api', 'webhook'],
    isActive: true,
    createdAt: '2026-05-15 14:30',
    updatedAt: '2026-07-18 16:10',
  },
  {
    id: 'strategy-enterprise',
    name: '企业版',
    description: '适合集团总部，提供 SSO、专属支持和高级运维能力。',
    price: 9999,
    duration: 1,
    durationUnit: 'year',
    maxUsers: 300,
    maxStores: 60,
    features: ['basic', 'analytics', 'api', 'webhook', 'sso', 'priority'],
    isActive: false,
    createdAt: '2026-04-28 08:45',
    updatedAt: '2026-07-10 10:00',
  },
]

const RECORDS: RenewalRecord[] = [
  {
    id: 'record-001',
    licenseId: 'LIC-001',
    licenseName: '火星蹦床公园',
    strategyId: 'strategy-basic',
    strategyName: '基础版',
    amount: 299,
    status: 'success',
    autoRenewal: true,
    renewedAt: '2026-07-01 10:20',
    expiresAt: '2026-08-01 00:00',
    remark: '自动扣款成功',
  },
  {
    id: 'record-002',
    licenseId: 'LIC-002',
    licenseName: '银河电竞馆',
    strategyId: 'strategy-pro',
    strategyName: '专业版',
    amount: 1999,
    status: 'success',
    autoRenewal: true,
    renewedAt: '2026-07-03 09:15',
    expiresAt: '2027-07-03 00:00',
    remark: '年度续费完成',
  },
  {
    id: 'record-003',
    licenseId: 'LIC-003',
    licenseName: '星际儿童乐园',
    strategyId: 'strategy-basic',
    strategyName: '基础版',
    amount: 299,
    status: 'pending',
    autoRenewal: false,
    renewedAt: '2026-07-24 13:40',
    expiresAt: '2026-07-30 00:00',
    remark: '待财务确认',
  },
  {
    id: 'record-004',
    licenseId: 'LIC-004',
    licenseName: '极速卡丁车',
    strategyId: 'strategy-enterprise',
    strategyName: '企业版',
    amount: 9999,
    status: 'failed',
    autoRenewal: false,
    renewedAt: '2026-07-12 18:00',
    expiresAt: '2026-07-20 00:00',
    remark: '支付失败，需人工跟进',
  },
]

const REMINDER_TIMELINE: ReminderTimelineItem[] = [
  {
    id: 'reminder-1',
    title: '到期前 7 天',
    description: '发送首轮续费提醒，提示管理员确认预算与续费方式。',
    due: 'T-7',
  },
  {
    id: 'reminder-2',
    title: '到期前 3 天',
    description: '自动续费关闭的许可证进入人工跟进名单。',
    due: 'T-3',
  },
  {
    id: 'reminder-3',
    title: '到期前 1 天',
    description: '再次通知门店负责人并标记高风险续费任务。',
    due: 'T-1',
  },
]

function calculateSuccessRate(records: RenewalRecord[]): number {
  if (records.length === 0) return 0
  const successCount = records.filter((record) => record.status === 'success').length
  return Math.round((successCount / records.length) * 100)
}

function buildStatistics(strategies: RenewalStrategy[], records: RenewalRecord[]): RenewalStatistics {
  return {
    totalStrategies: strategies.length,
    activeStrategies: strategies.filter((strategy) => strategy.isActive).length,
    totalRecords: records.length,
    successRate: calculateSuccessRate(records),
    autoRenewalEnabled: records.filter((record) => record.autoRenewal).length,
  }
}

function buildLicenseHealth(records: RenewalRecord[]): LicenseHealthStat {
  const now = new Date('2026-07-27T00:00:00.000Z')
  return {
    total: records.length,
    soonExpiring: records.filter((record) => {
      const expiresAt = new Date(record.expiresAt)
      const diffDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      return diffDays >= 0 && diffDays <= 7
    }).length,
    expired: records.filter((record) => new Date(record.expiresAt).getTime() < now.getTime()).length,
    autoRenewalEnabled: records.filter((record) => record.autoRenewal).length,
  }
}

export async function loadLicenseRenewalSnapshot(): Promise<LicenseRenewalSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'license-renewal-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadLicenseRenewalSnapshot -> local E54 snapshot shell',
    businessDataSource: 'license-renewal-data.ts mock strategy and record rows',
    refreshPath: 'LicenseRenewalPage -> loadLicenseRenewalSnapshot',
    note: '当前页面已按 E54 三层模板壳层化，套餐策略、续费记录和提醒时间线仍使用本地 mock 数据。',
    strategies: STRATEGIES,
    records: RECORDS,
    statistics: buildStatistics(STRATEGIES, RECORDS),
    licenseHealth: buildLicenseHealth(RECORDS),
    reminderTimeline: REMINDER_TIMELINE,
  }
}
