/**
 * AI决策面板 - Mock data & hooks
 */

import type { DecisionEvent, DecisionRuleResult } from './types'

function randomId(): string {
  return `eval_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function futureOffset(min: number, max: number): string {
  const offset = Math.floor(Math.random() * (max - min + 1) + min) * 60 * 1000
  return new Date(Date.now() - offset).toISOString()
}

function buildRule(overrides: Partial<DecisionRuleResult>): DecisionRuleResult {
  return {
    ruleId: `rule_${crypto.randomUUID().slice(0, 8)}`,
    executedAt: new Date().toISOString(),
    ruleName: '',
    triggered: false,
    confidence: 0,
    detail: '',
    ...overrides,
  } as DecisionRuleResult
}

const sampleEvents: DecisionEvent[] = [
  {
    id: randomId(),
    type: 'member_level',
    label: '会员等级自动升级',
    targetId: 'mem_10086',
    severity: 'warning' as const,
    ruleResults: [
      buildRule({
        ruleId: 'rule_member_level_004',
        ruleName: '会员等级自动评估',
        triggered: true,
        confidence: 0.87,
        detail: '近 30 天消费金额 ¥12,800，符合黄金会员升级条件',
        suggestion: '建议自动升级至黄金会员并发送通知',
        dataSnapshot: { periodDays: 30, totalAmount: 12800, currentLevel: '白银', targetLevel: '黄金' },
      }),
    ],
    conclusion: '会员满足升级条件，建议执行升级操作',
    handled: false,
    createdAt: futureOffset(5, 30),
  },
  {
    id: randomId(),
    type: 'points_risk',
    label: '积分通胀预警',
    targetId: 'mem_10086',
    severity: 'critical' as const,
    ruleResults: [
      buildRule({
        ruleId: 'rule_monthly_inflation_001',
        ruleName: '月度积分通胀率检测',
        triggered: true,
        confidence: 0.94,
        detail: '本月积分发放量较上月增长 35%，超出阈值 20%',
        suggestion: '建议降低积分发放倍率至 1.0x',
        dataSnapshot: { growthRate: 0.35, threshold: 0.2, currentMultiplier: 1.5 },
      }),
    ],
    conclusion: '通胀率超标，需立即调整积分发放策略',
    handled: false,
    createdAt: futureOffset(2, 10),
  },
  {
    id: randomId(),
    type: 'abnormal_transaction',
    label: '大额交易风控',
    targetId: 'mem_2049',
    severity: 'critical' as const,
    ruleResults: [
      buildRule({
        ruleId: 'rule_large_transaction_003',
        ruleName: '大额交易熔断检查',
        triggered: true,
        confidence: 0.99,
        detail: '单笔交易金额 50000 积分，超过熔断阈值 30000',
        suggestion: '建议人工审核该笔交易',
        dataSnapshot: { amount: 50000, threshold: 30000, endpoint: 'transfer' },
      }),
    ],
    conclusion: '交易金额超过熔断阈值，需要人工审核确认',
    handled: true,
    handledBy: '管理员张三',
    handledAt: futureOffset(1, 3),
    createdAt: futureOffset(10, 60),
  },
  {
    id: randomId(),
    type: 'behavior_alarm',
    label: '设备行为常规检测',
    targetId: 'device_mac_001',
    severity: 'info' as const,
    ruleResults: [
      buildRule({
        ruleId: 'rule_device_anomaly_002',
        ruleName: '设备行为异常检测',
        triggered: false,
        confidence: 0.78,
        detail: '该设备登录频率正常，无异常指纹变更',
        dataSnapshot: { loginCount: 12, fingerprintChanges: 0 },
      }),
    ],
    conclusion: '设备行为正常，无需干预',
    handled: false,
    createdAt: futureOffset(30, 120),
  },
  {
    id: randomId(),
    type: 'points_risk',
    label: '积分过期提醒检测',
    targetId: 'mem_3344',
    severity: 'info' as const,
    ruleResults: [
      buildRule({
        ruleId: 'rule_expired_points_005',
        ruleName: '过期积分提醒',
        triggered: false,
        confidence: 0.95,
        detail: '会员积分将于 60 天后过期，暂未达到提醒窗口',
        dataSnapshot: { expireDays: 60, remindWindowDays: 30, points: 2500 },
      }),
    ],
    conclusion: '未触发过期提醒条件',
    handled: false,
    createdAt: futureOffset(60, 300),
  },
  {
    id: randomId(),
    type: 'ai_recommendation',
    label: 'AI推荐: 促销策略',
    targetId: 'store_f101',
    severity: 'warning' as const,
    ruleResults: [
      buildRule({
        ruleId: 'ai_rec_001',
        ruleName: '消费降级检测',
        triggered: true,
        confidence: 0.82,
        detail: '近 7 天客单价下降 12%，建议启动满减活动',
        suggestion: '建议配置满 200 减 30 活动',
        dataSnapshot: { avgOrderAmount: 168, dropRate: 0.12, period: '7d' },
      }),
    ],
    conclusion: '建议配置营销活动以提升客单价',
    handled: false,
    createdAt: futureOffset(5, 30),
  },
]

export function useDecisionEvents(config?: { typeFilter?: string[]; severityFilter?: string[]; maxEvents?: number }): {
  events: DecisionEvent[]
  loading: boolean
  error: null | string
} {
  let filtered = sampleEvents.map(e => ({ ...e, ruleResults: e.ruleResults.map(r => ({ ...r })) }))

  if (config?.typeFilter && config.typeFilter.length > 0) {
    filtered = filtered.filter((e) => config.typeFilter!.includes(e.type))
  }
  if (config?.severityFilter && config.severityFilter.length > 0) {
    filtered = filtered.filter((e) => config.severityFilter!.includes(e.severity))
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (config?.maxEvents && filtered.length > config.maxEvents) {
    filtered = filtered.slice(0, config.maxEvents)
  }

  return { events: filtered, loading: false, error: null }
}

export function useHandleEvent() {
  return {
    mutate: (params: { eventId: string; handledBy: string }) => {
      const event = sampleEvents.find((e) => e.id === params.eventId)
      if (event) {
        event.handled = true
        event.handledBy = params.handledBy
        event.handledAt = new Date().toISOString()
        console.log(`[useHandleEvent] Handled event ${params.eventId} by ${params.handledBy}`)
      }
    },
    isLoading: false,
    error: null,
  }
}
