export type RuleExecutionStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING' | 'TIMEOUT'

export interface RuleExecutionSummary {
  id: string
  ruleName: string
  ruleId: string
  status: RuleExecutionStatus
  triggeredBy: string
  triggerEventType: string
  durationMs: number
  inputSummary: string
  outputSummary: string
  errorMessage?: string
  createdAt: string
}

export interface RuleExecutionStats {
  total: number
  success: number
  failure: number
  running: number
  timeout: number
}

export interface RuleExecutionsSnapshotDelivery {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-rule-executions-snapshot'
  executions: RuleExecutionSummary[]
  stats: RuleExecutionStats
  generatedAt: string
}

export const RULE_EXECUTION_STATUS_LABELS: Record<RuleExecutionStatus, string> = {
  SUCCESS: '成功',
  FAILURE: '失败',
  RUNNING: '进行中',
  TIMEOUT: '超时',
}

export const defaultRuleExecutions: RuleExecutionSummary[] = [
  {
    id: 'exec-001',
    ruleName: '信用评分规则',
    ruleId: 'rule-201',
    status: 'SUCCESS',
    triggeredBy: '会员注册事件',
    triggerEventType: 'member.register',
    durationMs: 230,
    inputSummary: '事件: { type: "member.register", memberId: "M10001" }',
    outputSummary: '规则匹配成功，已写入信用评分标签。',
    createdAt: '2026-07-26T15:00:00Z',
  },
  {
    id: 'exec-002',
    ruleName: '风控拦截规则',
    ruleId: 'rule-202',
    status: 'FAILURE',
    triggeredBy: '订单创建事件',
    triggerEventType: 'order.created',
    durationMs: 1500,
    inputSummary: '事件: { type: "order.created", orderId: "ORD-1002" }',
    outputSummary: '上游风控接口返回 504，执行失败。',
    errorMessage: 'risk-engine timeout',
    createdAt: '2026-07-26T14:40:00Z',
  },
  {
    id: 'exec-003',
    ruleName: '会员升级规则',
    ruleId: 'rule-203',
    status: 'RUNNING',
    triggeredBy: '定时任务',
    triggerEventType: 'cron.schedule',
    durationMs: 3200,
    inputSummary: '事件: { type: "cron.schedule", scope: "member-tier" }',
    outputSummary: '规则引擎仍在执行中。',
    createdAt: '2026-07-26T14:20:00Z',
  },
  {
    id: 'exec-004',
    ruleName: '优惠券发放规则',
    ruleId: 'rule-204',
    status: 'TIMEOUT',
    triggeredBy: 'Webhook',
    triggerEventType: 'webhook.inbound',
    durationMs: 8900,
    inputSummary: '事件: { type: "webhook.inbound", topic: "coupon" }',
    outputSummary: '超过最大执行时长 8s，已超时。',
    errorMessage: 'execution timeout',
    createdAt: '2026-07-26T13:55:00Z',
  },
  {
    id: 'exec-005',
    ruleName: '库存预警规则',
    ruleId: 'rule-205',
    status: 'SUCCESS',
    triggeredBy: '手动执行',
    triggerEventType: 'manual.execute',
    durationMs: 540,
    inputSummary: '事件: { type: "manual.execute", itemId: "SKU-205" }',
    outputSummary: '已发送库存预警消息。',
    createdAt: '2026-07-26T13:20:00Z',
  },
]

export function computeExecutionStats(executions: RuleExecutionSummary[]): RuleExecutionStats {
  return {
    total: executions.length,
    success: executions.filter((item) => item.status === 'SUCCESS').length,
    failure: executions.filter((item) => item.status === 'FAILURE').length,
    running: executions.filter((item) => item.status === 'RUNNING').length,
    timeout: executions.filter((item) => item.status === 'TIMEOUT').length,
  }
}

function getLatestExecutionTimestamp(executions: RuleExecutionSummary[]): string {
  return executions.reduce(
    (latest, execution) => (execution.createdAt > latest ? execution.createdAt : latest),
    executions[0]?.createdAt ?? '—'
  )
}

export async function loadRuleExecutionsSnapshot(): Promise<RuleExecutionsSnapshotDelivery> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-rule-executions-snapshot',
    executions: defaultRuleExecutions,
    stats: computeExecutionStats(defaultRuleExecutions),
    generatedAt: getLatestExecutionTimestamp(defaultRuleExecutions),
  }
}
