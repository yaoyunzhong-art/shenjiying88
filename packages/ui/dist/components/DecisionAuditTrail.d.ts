import React from 'react';
import { RuleExecutionStatus } from './AIDecisionPanel';
/** 审计条目操作类型 */
export type AuditAction = 'rule_evaluated' | 'decision_applied' | 'decision_overridden' | 'decision_reverted' | 'alert_triggered' | 'notification_sent' | 'manual_review' | 'auto_resolved';
/** 审计条目严重程度 */
export type AuditSeverity = 'info' | 'warning' | 'critical' | 'success';
/** 单条审计记录 */
export interface AuditEntry {
    /** 唯一标识 */
    id: string;
    /** 操作类型 */
    action: AuditAction;
    /** 操作描述 */
    message: string;
    /** 关联的规则 ID（可选） */
    ruleId?: string;
    /** 关联的规则名称（可选） */
    ruleName?: string;
    /** 规则执行状态（可选） */
    ruleStatus?: RuleExecutionStatus;
    /** 严重程度 */
    severity: AuditSeverity;
    /** 操作人/系统 */
    actor: string;
    /** 操作时间 */
    timestamp: string;
    /** 变更详情（可选 JSON 字符串或结构化数据） */
    changes?: string;
    /** 是否可回滚 */
    revertible?: boolean;
    /** 关联实体 ID */
    entityId?: string;
    /** 关联实体类型 */
    entityType?: string;
}
/** 审计摘要统计 */
export interface AuditSummary {
    total: number;
    info: number;
    warning: number;
    critical: number;
    success: number;
    /** 最近 24h 新增 */
    last24h: number;
}
/** 审计过滤器 */
export interface AuditFilter {
    action?: AuditAction;
    severity?: AuditSeverity;
    ruleId?: string;
    actor?: string;
    dateFrom?: string;
    dateTo?: string;
}
export interface DecisionAuditTrailProps {
    /** 审计记录列表 */
    entries: AuditEntry[];
    /** 审计摘要（可选） */
    summary?: AuditSummary;
    /** 当前过滤器 */
    filter?: AuditFilter;
    /** 过滤器变更回调 */
    onFilterChange?: (filter: AuditFilter) => void;
    /** 点击条目回调 */
    onEntryClick?: (entry: AuditEntry) => void;
    /** 回滚操作回调 */
    onRevert?: (entry: AuditEntry) => void;
    /** 是否加载中 */
    loading?: boolean;
    /** 每页条数 */
    pageSize?: number;
    /** 自定义类名 */
    className?: string;
    /** 是否紧凑模式 */
    compact?: boolean;
    /** 空数据文案 */
    emptyText?: string;
}
/**
 * DecisionAuditTrail — AI 决策审计追踪组件。
 *
 * 展示 AI 规则决策的完整审计链路，包含：
 * - 操作时间线视图
 * - 多维度过滤（操作类型、严重程度、规则、操作人、日期）
 * - 分页浏览
 * - 回滚操作入口
 * - 统计摘要
 *
 * @example
 * ```tsx
 * <DecisionAuditTrail
 *   entries={auditLogs}
 *   summary={{ total: 1280, info: 800, warning: 300, critical: 120, success: 60, last24h: 45 }}
 *   filter={currentFilter}
 *   onFilterChange={setFilter}
 *   onRevert={handleRevert}
 *   pageSize={20}
 * />
 * ```
 */
export declare function DecisionAuditTrail({ entries, summary, filter, onFilterChange, onEntryClick, onRevert, loading, pageSize, className, compact, emptyText, }: DecisionAuditTrailProps): React.JSX.Element;
export default DecisionAuditTrail;
