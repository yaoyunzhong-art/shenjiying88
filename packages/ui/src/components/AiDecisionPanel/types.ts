/**
 * AI决策面板 - 类型定义
 */

/** 规则执行结果 */
export interface DecisionRuleResult {
  ruleId: string
  ruleName: string
  /** 是否命中/触发 */
  triggered: boolean
  /** 决策置信度 0-1 */
  confidence: number
  /** 规则详情 */
  detail: string
  /** 建议操作 */
  suggestion?: string
  /** 关联数据快照 */
  dataSnapshot?: Record<string, unknown>
  /** 执行时间 */
  executedAt: string
}

/** 决策事件类型 */
export type DecisionEventType = 'member_level' | 'device_risk' | 'points_risk' | 'behavior_alarm' | 'abnormal_transaction' | 'ai_recommendation'

/** 决策事件 */
export interface DecisionEvent {
  id: string
  type: DecisionEventType
  /** 事件标签 */
  label: string
  /** 关联会员/设备 ID */
  targetId: string
  /** 事件级别 */
  severity: 'info' | 'warning' | 'critical'
  /** 规则链执行结果 */
  ruleResults: DecisionRuleResult[]
  /** 总体决策结论 */
  conclusion: string
  /** 是否已处理 */
  handled: boolean
  /** 处理人 */
  handledBy?: string
  /** 处理时间 */
  handledAt?: string
  /** 事件时间 */
  createdAt: string
}

/** 决策面板展示配置 */
export interface DecisionPanelConfig {
  /** 自动刷新间隔 (ms), 0 表示不自动刷新 */
  autoRefreshMs?: number
  /** 最多展示条数 */
  maxEvents?: number
  /** 按类型过滤 */
  typeFilter?: DecisionEventType[]
  /** 按严重度过滤 */
  severityFilter?: DecisionEvent['severity'][]
}

export const EVENT_TYPE_LABELS: Record<DecisionEventType, string> = {
  member_level: '会员等级',
  device_risk: '设备风险',
  points_risk: '积分风控',
  behavior_alarm: '行为告警',
  abnormal_transaction: '异常交易',
  ai_recommendation: 'AI推荐',
}

export const EVENT_TYPE_ICONS: Record<DecisionEventType, string> = {
  member_level: '👤',
  device_risk: '📱',
  points_risk: '🪙',
  behavior_alarm: '🔔',
  abnormal_transaction: '⚠️',
  ai_recommendation: '🤖',
}

export const SEVERITY_LABELS: Record<DecisionEvent['severity'], string> = {
  info: '信息',
  warning: '警告',
  critical: '严重',
}

export const SEVERITY_COLORS: Record<DecisionEvent['severity'], string> = {
  info: '#1677ff',
  warning: '#faad14',
  critical: '#f5222d',
}

// ---- 向后兼容别名（AiDecisionPanel 重写后保留旧导出） ----

/** @deprecated 请使用 DecisionRuleResult */
export type RuleExecutionResult = DecisionRuleResult;

/** @deprecated 规则执行状态枚举 */
export type RuleExecutionStatus = 'pending' | 'running' | 'success' | 'failure' | 'skipped';

/** @deprecated 规则执行摘要 */
export type RuleExecutionSummary = {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
};
