import React from 'react';
/** 规则执行结果状态 */
export type RuleExecutionStatus = 'passed' | 'failed' | 'warning' | 'pending';
/** 单条规则执行结果 */
export interface RuleExecutionResult {
    /** 规则 ID */
    id: string;
    /** 规则名称 */
    name: string;
    /** 规则描述 */
    description?: string;
    /** 执行状态 */
    status: RuleExecutionStatus;
    /** 匹配数据条数 */
    matchedCount?: number;
    /** 执行耗时(ms) */
    durationMs?: number;
    /** 详情/建议 */
    suggestion?: string;
    /** 执行时间戳 */
    executedAt?: string;
}
/** 规则执行汇总统计 */
export interface RuleExecutionSummary {
    total: number;
    passed: number;
    failed: number;
    warning: number;
    pending: number;
    /** 数据覆盖率 */
    coveragePercent?: number;
    /** 上一轮对比变化 */
    delta?: number;
}
/** AI 决策面板 Props */
export interface AIDecisionPanelProps {
    /** 规则执行结果列表 */
    rules: RuleExecutionResult[];
    /** 汇总统计 */
    summary?: RuleExecutionSummary;
    /** 面板标题 */
    title?: string;
    /** 面板副标题 */
    subtitle?: string;
    /** 是否显示详情展开 */
    expandable?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 空状态文案 */
    emptyText?: string;
    /** 规则点击回调 */
    onRuleClick?: (rule: RuleExecutionResult) => void;
    /** 是否紧凑模式 */
    compact?: boolean;
}
/**
 * AIDecisionPanel — AI 规则决策面板。
 *
 * 展示 AI 规则引擎的执行结果，包括：
 * - 汇总统计（通过率/覆盖率/趋势变化）
 * - 逐条规则结果（状态/匹配数/耗时/建议）
 * - 视觉化进度条
 *
 * 适用于治理告警、质量检测、风控规则等场景。
 *
 * @example
 * // 基础用法
 * <AIDecisionPanel
 *   title="质量检测规则执行结果"
 *   rules={[
 *     { id: '1', name: '价格合规检查', status: 'passed', matchedCount: 1280 },
 *     { id: '2', name: '库存异常检测', status: 'failed', matchedCount: 3, suggestion: '3个SKU库存为负' },
 *   ]}
 *   summary={{ total: 10, passed: 7, failed: 2, warning: 1, pending: 0 }}
 * />
 *
 * @example
 * // 紧凑模式 + 点击交互
 * <AIDecisionPanel
 *   title="实时风控"
 *   rules={rules}
 *   compact
 *   onRuleClick={(rule) => navigate(`/rule/${rule.id}`)}
 * />
 */
export declare function AIDecisionPanel({ rules, summary, title, subtitle, expandable, className, emptyText, onRuleClick, compact, }: AIDecisionPanelProps): React.JSX.Element;
