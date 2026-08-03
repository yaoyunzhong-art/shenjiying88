export type CampaignRuleDetailStatus = 'draft' | 'active' | 'inactive' | 'archived'

export interface CampaignRuleTimelineItem {
  time: string
  label: string
  detail: string
}

export interface CampaignRuleDetail {
  id: string
  name: string
  status: CampaignRuleDetailStatus
  campaignType: string
  owner: string
  audience: string
  budgetCents: number
  triggerWindow: string
  condition: string
  action: string
  note: string
  guardrails: string[]
  recentSignals: string[]
  timeline: CampaignRuleTimelineItem[]
  executionCount: number
  conversionRate: number
  updatedAt: string
}

export interface CampaignRuleDetailSnapshotDelivery {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-campaign-rule-detail-snapshot'
  rule: CampaignRuleDetail
  generatedAt: string
}

export const defaultCampaignRuleDetails: CampaignRuleDetail[] = [
  {
    id: 'rule-001',
    name: '满200减30',
    status: 'active',
    campaignType: '满减',
    owner: '营销运营一组',
    audience: '全部会员',
    budgetCents: 2_000_000,
    triggerWindow: '周五 18:00 - 周日 24:00',
    condition: '订单金额 >= 200 且未命中互斥大促',
    action: '减免 30 元并记录营销归因标签',
    note: '作为周末大促的常驻规则，与返券策略互斥。',
    guardrails: ['单用户每日最多触发 2 次', '与全场折扣活动互斥', '异常退款订单不参与'],
    recentSignals: ['上周命中率 18.2%', '门店覆盖 68 家', '客单价提升 11.4%'],
    timeline: [
      { time: '2026-07-26T10:00:00Z', label: '快照刷新', detail: '同步周末规则命中统计。' },
      { time: '2026-07-25T20:30:00Z', label: '阈值调整', detail: '将最低订单金额从 180 元提升到 200 元。' },
    ],
    executionCount: 5820,
    conversionRate: 18.2,
    updatedAt: '2026-07-26T10:00:00Z',
  },
  {
    id: 'rule-002',
    name: '全场 8 折',
    status: 'active',
    campaignType: '折扣',
    owner: '渠道增长组',
    audience: '区域白名单门店',
    budgetCents: 5_600_000,
    triggerWindow: '淡季周二 - 周四',
    condition: '指定区域门店 + 类目白名单',
    action: '订单总价 * 0.8',
    note: '用于低峰期拉新，不与满减叠加。',
    guardrails: ['仅限 26 家门店', '折扣上限 80 元', '黑名单商品不参与'],
    recentSignals: ['折扣成本受控', '客流回升 7.2%', '退货率无明显异常'],
    timeline: [
      { time: '2026-07-24T09:00:00Z', label: '活动复盘', detail: '确认继续保留到八月中旬。' },
      { time: '2026-07-22T14:30:00Z', label: '门店扩容', detail: '新增 8 家试点门店。' },
    ],
    executionCount: 3461,
    conversionRate: 12.5,
    updatedAt: '2026-07-24T09:00:00Z',
  },
  {
    id: 'rule-004',
    name: '新会员首单返券',
    status: 'draft',
    campaignType: '返券',
    owner: '会员增长组',
    audience: '注册 30 天内新会员',
    budgetCents: 1_800_000,
    triggerWindow: '注册后 72 小时内',
    condition: '完成首单且满足手机号校验',
    action: '发放满 100 减 20 券',
    note: '当前仍在客户端演练阶段，等待写链路接通。',
    guardrails: ['同一设备仅可领取 1 次', '与注册礼包互斥', '退款订单自动回收券'],
    recentSignals: ['草稿状态', '返券核销率预估 35%', '待接入实时黑名单'],
    timeline: [
      { time: '2026-07-26T08:00:00Z', label: '草稿创建', detail: '等待审批通过后发布。' },
      { time: '2026-07-25T17:15:00Z', label: '规则评审', detail: '确认返券门槛为 100 元。' },
    ],
    executionCount: 0,
    conversionRate: 0,
    updatedAt: '2026-07-26T08:00:00Z',
  },
]

export function formatBudget(cents: number): string {
  return `¥${(cents / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export async function loadCampaignRuleDetailSnapshot(
  id: string
): Promise<CampaignRuleDetailSnapshotDelivery | null> {
  const rule = defaultCampaignRuleDetails.find((item) => item.id === id)
  if (!rule) return null

  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-campaign-rule-detail-snapshot',
    rule,
    generatedAt: rule.updatedAt,
  }
}
