export type RuleCategory =
  | 'risk-control'
  | 'member'
  | 'promotion'
  | 'notification'
  | 'operation'

export type RuleStatus = 'enabled' | 'disabled' | 'draft' | 'archived'
export type RulePriority = 'critical' | 'high' | 'medium' | 'low'

export interface RuleTimelineItem {
  time: string
  label: string
  detail: string
}

export interface RuleDetail {
  id: string
  name: string
  category: RuleCategory
  status: RuleStatus
  priority: RulePriority
  description: string
  condition: string
  action: string
  triggerCount: number
  successRate: number
  lastTriggered: string
  updatedAt: string
  createdAt: string
  createdBy: string
  version: string
  enabled: boolean
  guardrails: string[]
  recentSignals: string[]
  timeline: RuleTimelineItem[]
}

export interface RuleDetailSnapshotDelivery {
  deliveryMode: 'mock'
  sourceLabel: 'rules-detail-mock'
  generatedAt: string
  detail: RuleDetail
}

const RULE_NAMES = [
  '信用评分规则',
  '风控拦截规则',
  '会员升级规则',
  '优惠券发放规则',
  '异常登录检测规则',
  '批量通知规则',
  '库存预警规则',
  '订单风控规则',
] as const

const RULE_DESCRIPTIONS = [
  '基于会员行为与订单链路的综合规则，用于识别高价值行为并自动下发后续动作。',
  '聚合事件、画像与策略标签，对异常流量和风险订单进行自动拦截。',
  '围绕会员等级、积分和促销权益编排升级动作。',
  '根据命中的目标人群发放权益，并追踪触达与核销表现。',
] as const

const RULE_CONDITIONS = [
  'member.creditScore < 600 && order.amount > 10000',
  'login.geoVelocity > 500 && device.isNew === true',
  'member.totalSpent >= 50000 && member.tier !== "diamond"',
  'campaign.active === true && member.tags.includes("high_value")',
] as const

const RULE_ACTIONS = [
  '拦截请求并发送风控告警',
  '升级会员等级并追加权益标签',
  '发放优惠券并落审计链路',
  '写入通知任务并触发执行日志',
] as const

const RULE_CREATORS = ['admin', 'operator-01', 'operator-02', 'super-admin'] as const
const RULE_CATEGORIES: RuleCategory[] = ['risk-control', 'member', 'promotion', 'notification', 'operation']
const RULE_STATUSES: RuleStatus[] = ['enabled', 'disabled', 'draft', 'archived']
const RULE_PRIORITIES: RulePriority[] = ['critical', 'high', 'medium', 'low']

function numericSeed(id: string): number {
  const matches = id.match(/\d+/g)
  if (!matches) return 1
  return matches.join('').split('').reduce((sum, digit) => sum * 10 + Number(digit), 0) || 1
}

function pick<T>(values: readonly T[], seed: number): T {
  return values[seed % values.length] as T
}

export function buildRuleDetail(id: string): RuleDetail {
  const seed = numericSeed(id || 'rule-001')
  const status = pick(RULE_STATUSES, seed)
  const category = pick(RULE_CATEGORIES, seed)
  const priority = pick(RULE_PRIORITIES, seed)
  const day = String((seed % 28) + 1).padStart(2, '0')
  const hour = String(8 + (seed % 10)).padStart(2, '0')
  const minute = String((seed * 7) % 60).padStart(2, '0')
  const createdMonth = String((seed % 12) + 1).padStart(2, '0')

  return {
    id: id || `rule-${String(seed).padStart(3, '0')}`,
    name: `${pick(RULE_NAMES, seed)} v${Math.floor(seed / 10) + 1}`,
    category,
    status,
    priority,
    description: pick(RULE_DESCRIPTIONS, seed),
    condition: pick(RULE_CONDITIONS, seed),
    action: pick(RULE_ACTIONS, seed),
    triggerCount: 1200 + seed * 17,
    successRate: Number((78 + (seed % 18) + (seed % 5) * 0.3).toFixed(1)),
    lastTriggered: `2026-07-${day}T${hour}:${minute}:00Z`,
    updatedAt: `2026-07-${day}T${hour}:${minute}:00Z`,
    createdAt: `2025-${createdMonth}-${day}T10:00:00Z`,
    createdBy: pick(RULE_CREATORS, seed),
    version: `${Math.floor(seed / 2) + 1}.${seed % 10}.0`,
    enabled: status === 'enabled',
    guardrails: [
      '同一主体 5 分钟内最多命中 1 次。',
      '命中后必须保留审计链路与操作人信息。',
      '回退前需确认无未完成人工复核任务。',
    ],
    recentSignals: [
      `最近 24h 命中 ${320 + seed} 次`,
      `成功率 ${Number((86 + (seed % 10) * 0.7).toFixed(1))}%`,
      `关联执行日志 exec-${String(seed).padStart(3, '0')}`,
    ],
    timeline: [
      {
        time: `2026-07-${day}T${hour}:${minute}:00Z`,
        label: '快照刷新',
        detail: '服务端详情快照已刷新，用于本轮 E54 结构固证。',
      },
      {
        time: `2026-07-${String(((seed + 3) % 28) + 1).padStart(2, '0')}T09:15:00Z`,
        label: '规则评审',
        detail: '确认条件表达式与动作编排未偏离当前治理基线。',
      },
      {
        time: `2026-07-${String(((seed + 6) % 28) + 1).padStart(2, '0')}T13:40:00Z`,
        label: '执行回放',
        detail: '基于样本流量完成客户端演练，等待真实链路接入。',
      },
    ],
  }
}

export async function loadRuleDetailSnapshot(id: string): Promise<RuleDetailSnapshotDelivery> {
  const detail = buildRuleDetail(id || 'rule-001')

  return {
    deliveryMode: 'mock',
    sourceLabel: 'rules-detail-mock',
    generatedAt: detail.updatedAt,
    detail,
  }
}
