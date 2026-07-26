export type CampaignRuleStatus = 'active' | 'inactive' | 'draft'
export type CampaignRuleType = 'full-reduction' | 'discount' | 'gift' | 'coupon' | 'points'

export interface CampaignRule {
  id: string
  name: string
  campaignType: CampaignRuleType
  condition: string
  action: string
  priority: number
  status: CampaignRuleStatus
  owner: string
  description: string
  createdAt: string
  updatedAt: string
  lastTriggeredAt?: string
  hitCount: number
}

export interface CampaignRuleStats {
  total: number
  active: number
  draft: number
  inactive: number
  autoCoupon: number
}

export interface CampaignRulesSnapshotDelivery {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-campaign-rules-snapshot'
  rules: CampaignRule[]
  stats: CampaignRuleStats
  generatedAt: string
}

export const CAMPAIGN_RULE_STATUS_LABELS: Record<CampaignRuleStatus, string> = {
  active: '启用',
  inactive: '停用',
  draft: '草稿',
}

export const CAMPAIGN_RULE_TYPE_LABELS: Record<CampaignRuleType, string> = {
  'full-reduction': '满减',
  discount: '折扣',
  gift: '赠品',
  coupon: '返券',
  points: '积分加倍',
}

export const defaultCampaignRules: CampaignRule[] = [
  {
    id: 'rule-001',
    name: '满200减30',
    campaignType: 'full-reduction',
    condition: '订单金额 >= 200 元',
    action: '减免 30 元并写入优惠轨迹',
    priority: 1,
    status: 'active',
    owner: '营销运营一组',
    description: '通用满减活动，主用于拉动周末复购。',
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-07-20T09:30:00Z',
    lastTriggeredAt: '2026-07-26T13:05:00Z',
    hitCount: 5820,
  },
  {
    id: 'rule-002',
    name: '全场 8 折',
    campaignType: 'discount',
    condition: '活动白名单门店 + 指定周末场次',
    action: '订单总价 * 0.8',
    priority: 2,
    status: 'active',
    owner: '渠道增长组',
    description: '区域性折扣规则，用于淡季促活。',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-07-19T08:15:00Z',
    lastTriggeredAt: '2026-07-26T10:22:00Z',
    hitCount: 3461,
  },
  {
    id: 'rule-003',
    name: '买二送一',
    campaignType: 'gift',
    condition: '同一商品购买 >= 2 件',
    action: '自动追加同款赠品 1 件',
    priority: 3,
    status: 'inactive',
    owner: '类目运营组',
    description: '季节性买赠活动，当前已停用。',
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-07-02T11:20:00Z',
    lastTriggeredAt: '2026-06-30T20:15:00Z',
    hitCount: 1890,
  },
  {
    id: 'rule-004',
    name: '新会员首单返券',
    campaignType: 'coupon',
    condition: '注册 <= 30 天且完成首单',
    action: '返满 100 减 20 券 1 张',
    priority: 4,
    status: 'active',
    owner: '会员增长组',
    description: '首单成交通知链路的返券规则。',
    createdAt: '2026-04-15T08:30:00Z',
    updatedAt: '2026-07-23T07:40:00Z',
    lastTriggeredAt: '2026-07-26T14:35:00Z',
    hitCount: 2284,
  },
  {
    id: 'rule-005',
    name: '会员日双倍积分',
    campaignType: 'points',
    condition: '每周六会员日',
    action: '奖励积分 * 2',
    priority: 5,
    status: 'draft',
    owner: '会员运营组',
    description: '会员节奏活动，目前仍在演练。',
    createdAt: '2026-05-05T09:10:00Z',
    updatedAt: '2026-07-25T12:00:00Z',
    hitCount: 0,
  },
  {
    id: 'rule-006',
    name: '中秋满 500 送礼盒',
    campaignType: 'gift',
    condition: '订单金额 >= 500 元',
    action: '追加中秋礼盒 1 份',
    priority: 6,
    status: 'draft',
    owner: '节庆项目组',
    description: '节庆活动预案，用于大促演练。',
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-26T06:30:00Z',
    hitCount: 0,
  },
]

export function computeCampaignRuleStats(rules: CampaignRule[]): CampaignRuleStats {
  return {
    total: rules.length,
    active: rules.filter((rule) => rule.status === 'active').length,
    draft: rules.filter((rule) => rule.status === 'draft').length,
    inactive: rules.filter((rule) => rule.status === 'inactive').length,
    autoCoupon: rules.filter((rule) => rule.campaignType === 'coupon').length,
  }
}

function getLatestCampaignRuleTimestamp(rules: CampaignRule[]): string {
  return rules.reduce((latest, rule) => (rule.updatedAt > latest ? rule.updatedAt : latest), rules[0]?.updatedAt ?? '—')
}

export async function loadCampaignRulesSnapshot(): Promise<CampaignRulesSnapshotDelivery> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-campaign-rules-snapshot',
    rules: defaultCampaignRules,
    stats: computeCampaignRuleStats(defaultCampaignRules),
    generatedAt: getLatestCampaignRuleTimestamp(defaultCampaignRules),
  }
}
