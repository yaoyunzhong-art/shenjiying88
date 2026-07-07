import { AiDecisionPanel } from './AiDecisionPanel'
export { AiDecisionPanel } from './AiDecisionPanel'
export { useDecisionPanel } from './useDecisionPanel'
export type {
  DecisionEvent,
  DecisionRuleResult,
  DecisionEventType,
  DecisionPanelConfig,
} from './types'
// 向后兼容别名（AiDecisionPanel 重写后保留旧导出）
/** @deprecated 请使用 AiDecisionPanel */
export const AIDecisionPanel = AiDecisionPanel
/** @deprecated 请使用 AiDecisionPanelProps */
export type AIDecisionPanelProps = import('./AiDecisionPanel').AiDecisionPanelProps
export type { AiDecisionPanelProps } from './AiDecisionPanel'
export type { RuleExecutionResult, RuleExecutionStatus, RuleExecutionSummary } from './types'
