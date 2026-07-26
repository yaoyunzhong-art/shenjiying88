export type RuleExecutionDetailStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING' | 'TIMEOUT'

export interface RuleExecutionDetail {
  id: string
  ruleName: string
  ruleId: string
  ruleVersion: string
  status: RuleExecutionDetailStatus
  triggeredBy: string
  triggerEventType: string
  durationMs: number
  inputSummary: string
  inputPayload: string
  outputSummary: string
  outputPayload: string
  errorMessage?: string
  errorStackTrace?: string
  retryCount: number
  executionNode: string
  createdAt: string
  completedAt?: string
}

export interface RuleExecutionDetailSnapshotDelivery {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-rule-execution-detail-snapshot'
  execution: RuleExecutionDetail
  generatedAt: string
}

export const defaultRuleExecutionDetails: RuleExecutionDetail[] = [
  {
    id: 'exec-001',
    ruleName: '信用评分规则',
    ruleId: 'rule-201',
    ruleVersion: 'v4.2.0',
    status: 'SUCCESS',
    triggeredBy: '会员注册事件',
    triggerEventType: 'member.register',
    durationMs: 230,
    inputSummary: '事件: { type: "member.register", memberId: "M10001" }',
    inputPayload: JSON.stringify({ type: 'member.register', memberId: 'M10001', channel: 'wechat' }, null, 2),
    outputSummary: '规则匹配成功，已写入信用评分标签。',
    outputPayload: JSON.stringify({ matched: true, score: 712, labels: ['trusted'] }, null, 2),
    retryCount: 0,
    executionNode: 'cn-beijing-1a',
    createdAt: '2026-07-26T15:00:00Z',
    completedAt: '2026-07-26T15:00:00Z',
  },
  {
    id: 'exec-002',
    ruleName: '风控拦截规则',
    ruleId: 'rule-202',
    ruleVersion: 'v8.1.0',
    status: 'FAILURE',
    triggeredBy: '订单创建事件',
    triggerEventType: 'order.created',
    durationMs: 1500,
    inputSummary: '事件: { type: "order.created", orderId: "ORD-1002" }',
    inputPayload: JSON.stringify({ type: 'order.created', orderId: 'ORD-1002', amount: 29800 }, null, 2),
    outputSummary: '上游风控接口返回 504，执行失败。',
    outputPayload: JSON.stringify(
      { matched: false, error: { code: 'UPSTREAM_TIMEOUT', httpStatus: 504 } },
      null,
      2
    ),
    errorMessage: 'risk-engine timeout',
    errorStackTrace:
      'Error: risk-engine timeout\\n    at evaluateCondition (/runtime/risk/evaluator.ts:88:9)\\n    at RuleEngine.run (/runtime/risk/index.ts:34:13)',
    retryCount: 2,
    executionNode: 'cn-shanghai-2b',
    createdAt: '2026-07-26T14:40:00Z',
    completedAt: '2026-07-26T14:40:01Z',
  },
  {
    id: 'exec-003',
    ruleName: '会员升级规则',
    ruleId: 'rule-203',
    ruleVersion: 'v2.3.1',
    status: 'RUNNING',
    triggeredBy: '定时任务',
    triggerEventType: 'cron.schedule',
    durationMs: 3200,
    inputSummary: '事件: { type: "cron.schedule", scope: "member-tier" }',
    inputPayload: JSON.stringify({ type: 'cron.schedule', scope: 'member-tier', batchSize: 300 }, null, 2),
    outputSummary: '规则引擎仍在执行中。',
    outputPayload: JSON.stringify({ stage: 'evaluating_condition', progress: 68 }, null, 2),
    retryCount: 0,
    executionNode: 'cn-shenzhen-3c',
    createdAt: '2026-07-26T14:20:00Z',
  },
]

export function formatExecutionDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

export async function loadRuleExecutionDetailSnapshot(
  id: string
): Promise<RuleExecutionDetailSnapshotDelivery | null> {
  const execution = defaultRuleExecutionDetails.find((item) => item.id === id)
  if (!execution) return null

  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-rule-execution-detail-snapshot',
    execution,
    generatedAt: execution.completedAt ?? execution.createdAt,
  }
}
