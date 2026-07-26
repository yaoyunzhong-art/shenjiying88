export type RuleCategory = 'risk-control' | 'member' | 'promotion' | 'notification' | 'operation'
export type RuleStatus = 'enabled' | 'disabled' | 'draft' | 'archived'
export type RulePriority = 'critical' | 'high' | 'medium' | 'low'

export interface RuleItem {
  id: string
  name: string
  category: RuleCategory
  status: RuleStatus
  priority: RulePriority
  description: string
  triggerCount: number
  successRate: number
  lastTriggered: string
  updatedAt: string
  createdBy: string
}

export interface RulesSnapshotDelivery {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-rules-snapshot'
  rules: RuleItem[]
  generatedAt: string
}

export const CATEGORY_LABELS: Record<RuleCategory, string> = {
  'risk-control': '风控规则',
  member: '会员规则',
  promotion: '营销规则',
  notification: '通知规则',
  operation: '运维规则',
}

export const CATEGORY_LIST: RuleCategory[] = ['risk-control', 'member', 'promotion', 'notification', 'operation']

export const STATUS_LABELS: Record<RuleStatus, string> = {
  enabled: '已启用',
  disabled: '已停用',
  draft: '草稿',
  archived: '已归档',
}

export const STATUS_LIST: RuleStatus[] = ['enabled', 'disabled', 'draft', 'archived']

export const STATUS_BADGE_VARIANT: Record<RuleStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  enabled: 'success',
  disabled: 'neutral',
  draft: 'warning',
  archived: 'danger',
}

export const PRIORITY_LABELS: Record<RulePriority, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
}

export const PRIORITY_COLORS: Record<RulePriority, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
}

export const CATEGORY_COLORS: Record<RuleCategory, string> = {
  'risk-control': '#ef4444',
  member: '#3b82f6',
  promotion: '#f59e0b',
  notification: '#8b5cf6',
  operation: '#10b981',
}

export const CATEGORY_BG_COLORS: Record<RuleCategory, string> = {
  'risk-control': 'rgba(239, 68, 68, 0.12)',
  member: 'rgba(59, 130, 246, 0.12)',
  promotion: 'rgba(245, 158, 11, 0.12)',
  notification: 'rgba(139, 92, 246, 0.12)',
  operation: 'rgba(16, 185, 129, 0.12)',
}

export const defaultRules: RuleItem[] = Array.from({ length: 35 }, (_, index): RuleItem => {
  const id = index + 1
  const day = String((index % 28) + 1).padStart(2, '0')
  const hour = String(8 + (index % 10)).padStart(2, '0')
  const minute = String((index * 7) % 60).padStart(2, '0')
  const ruleNames = [
    '信用评分规则',
    '风控拦截规则',
    '会员升级规则',
    '优惠券发放规则',
    '异常登录检测规则',
    '批量通知规则',
    '库存预警规则',
    '订单风控规则',
    '积分过期规则',
    '推送频率限制',
  ] as const
  const descriptions = [
    '基于会员行为数据的信用评分自动计算与更新',
    '检测异常交易行为并触发拦截流程',
    '根据消费金额和频次自动升级会员等级',
    '按条件自动发放优惠券给目标会员群体',
    '检测异地登录、频繁登录等异常行为',
    '批量向目标用户发送系统通知消息',
    '库存低于阈值时自动触发补货提醒',
    '对高风险订单进行自动风控审核',
    '会员积分到期前自动发送提醒通知',
    '限制单用户每日推送消息频率上限',
  ] as const
  const priorities: RulePriority[] = ['critical', 'high', 'medium', 'low']
  const successRates = [96.2, 92.1, 88.4, 82.7]
  const timestamp = `2026-07-${day}T${hour}:${minute}:00Z`

  return {
    id: `rule-${id}`,
    name: `${ruleNames[index % ruleNames.length]} v${Math.floor(index / 10) + 1}`,
    category: CATEGORY_LIST[index % CATEGORY_LIST.length]!,
    status: STATUS_LIST[index % STATUS_LIST.length]!,
    priority: priorities[index % priorities.length]!,
    description: descriptions[index % descriptions.length]!,
    triggerCount: 120 + index * 137,
    successRate: successRates[index % successRates.length]!,
    lastTriggered: timestamp,
    updatedAt: timestamp,
    createdBy: ['admin', 'operator-01', 'operator-02', 'super-admin'][index % 4]!,
  }
})

export function filterRules(
  rules: RuleItem[],
  search: string,
  statusFilter: RuleStatus | 'ALL',
  categoryFilter: RuleCategory | 'ALL'
): RuleItem[] {
  let result = rules

  if (search.trim()) {
    const keyword = search.toLowerCase()
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.createdBy.toLowerCase().includes(keyword)
    )
  }

  if (statusFilter !== 'ALL') {
    result = result.filter((item) => item.status === statusFilter)
  }

  if (categoryFilter !== 'ALL') {
    result = result.filter((item) => item.category === categoryFilter)
  }

  return result
}

export function computeRulesStats(rules: RuleItem[]) {
  return {
    total: rules.length,
    enabled: rules.filter((item) => item.status === 'enabled').length,
    critical: rules.filter((item) => item.priority === 'critical').length,
    lowSuccess: rules.filter((item) => item.successRate < 85).length,
  }
}

export function computeRuleCategoryStats(rules: RuleItem[]) {
  const entries = CATEGORY_LIST.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    count: rules.filter((item) => item.category === category).length,
    color: CATEGORY_COLORS[category],
    bg: CATEGORY_BG_COLORS[category],
  }))

  return {
    entries,
    maxCount: Math.max(...entries.map((entry) => entry.count), 1),
  }
}

function getLatestRulesTimestamp(rules: RuleItem[]): string {
  if (rules.length === 0) return '—'
  return rules.reduce((latest, item) => (item.updatedAt > latest ? item.updatedAt : latest), rules[0]!.updatedAt)
}

export async function loadRulesSnapshot(): Promise<RulesSnapshotDelivery> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-rules-snapshot',
    rules: defaultRules,
    generatedAt: getLatestRulesTimestamp(defaultRules),
  }
}
