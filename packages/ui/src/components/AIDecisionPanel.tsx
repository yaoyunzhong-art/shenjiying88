'use client';

import React from 'react';

// ==================== 类型定义 ====================

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

// ==================== 状态图标/颜色映射 ====================

const STATUS_CONFIG: Record<
  RuleExecutionStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  passed: {
    label: '通过',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    icon: '✓',
  },
  failed: {
    label: '未通过',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    icon: '✗',
  },
  warning: {
    label: '警告',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    icon: '⚠',
  },
  pending: {
    label: '待执行',
    color: '#64748b',
    bg: 'rgba(100,116,139,0.12)',
    icon: '⋯',
  },
};

// ==================== 汇总统计条 ====================

function SummaryBar({ summary }: { summary: RuleExecutionSummary }) {
  const items: { label: string; value: number; color: string }[] = [
    { label: '总计', value: summary.total, color: '#cbd5e1' },
    { label: '通过', value: summary.passed, color: '#22c55e' },
    { label: '未通过', value: summary.failed, color: '#ef4444' },
    { label: '警告', value: summary.warning, color: '#f59e0b' },
    { label: '待执行', value: summary.pending, color: '#64748b' },
  ];

  const passRate =
    summary.total > 0
      ? Math.round((summary.passed / summary.total) * 100)
      : 0;

  // 进度条各段宽度
  const segments = [
    { value: summary.passed, color: '#22c55e' },
    { value: summary.failed, color: '#ef4444' },
    { value: summary.warning, color: '#f59e0b' },
    { value: summary.pending, color: '#64748b' },
  ];

  return (
    <div style={{ marginBottom: 16 }}>
      {/* 进度条 */}
      <div
        style={{
          display: 'flex',
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          background: 'rgba(148,163,184,0.12)',
          marginBottom: 12,
        }}
      >
        {segments.map((seg, i) =>
          seg.value > 0 ? (
            <div
              key={i}
              style={{
                width: summary.total > 0 ? `${(seg.value / summary.total) * 100}%` : '0%',
                background: seg.color,
                transition: 'width 0.4s ease',
              }}
            />
          ) : null
        )}
      </div>

      {/* 统计数字 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 20px',
          alignItems: 'center',
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: item.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {item.label}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: item.color,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {item.value}
            </span>
          </div>
        ))}

        {/* 通过率 */}
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>通过率 </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color:
                passRate >= 90
                  ? '#22c55e'
                  : passRate >= 70
                    ? '#f59e0b'
                    : '#ef4444',
            }}
          >
            {passRate}%
          </span>
        </div>
      </div>

      {/* 覆盖率和变化 */}
      {summary.coveragePercent != null && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: '#94a3b8',
            display: 'flex',
            gap: 16,
          }}
        >
          <span>
            数据覆盖率：{summary.coveragePercent}%
          </span>
          {summary.delta != null && (
            <span
              style={{
                color: summary.delta >= 0 ? '#22c55e' : '#ef4444',
              }}
            >
              {summary.delta >= 0 ? '↑' : '↓'} {Math.abs(summary.delta)}%
              vs 上轮
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== 单条规则结果行 ====================

function RuleRow({
  rule,
  compact,
  onClick,
}: {
  rule: RuleExecutionResult;
  compact: boolean;
  onClick?: (rule: RuleExecutionResult) => void;
}) {
  const config = STATUS_CONFIG[rule.status];

  return (
    <div
      onClick={() => onClick?.(rule)}
      style={{
        display: 'flex',
        alignItems: compact ? 'center' : 'flex-start',
        gap: 10,
        padding: compact ? '6px 10px' : '10px 12px',
        borderRadius: 10,
        background:
          rule.status === 'failed'
            ? 'rgba(239,68,68,0.06)'
            : 'rgba(148,163,184,0.04)',
        borderLeft: `3px solid ${config.color}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (onClick)
          (e.currentTarget as HTMLDivElement).style.background =
            'rgba(148,163,184,0.08)';
      }}
      onMouseLeave={(e) => {
        if (onClick)
          (e.currentTarget as HTMLDivElement).style.background =
            rule.status === 'failed'
              ? 'rgba(239,68,68,0.06)'
              : 'rgba(148,163,184,0.04)';
      }}
    >
      {/* 状态图标 */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: 6,
          background: config.bg,
          color: config.color,
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {config.icon}
      </span>

      {/* 规则信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#e2e8f0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {rule.name}
          </span>
          <span
            style={{
              fontSize: 11,
              padding: '1px 6px',
              borderRadius: 4,
              background: config.bg,
              color: config.color,
              fontWeight: 600,
            }}
          >
            {config.label}
          </span>
          {rule.matchedCount != null && (
            <span style={{ fontSize: 11, color: '#64748b' }}>
              匹配 {rule.matchedCount} 条
            </span>
          )}
          {rule.durationMs != null && (
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {rule.durationMs}ms
            </span>
          )}
        </div>

        {!compact && rule.description && (
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: '#94a3b8',
              lineHeight: 1.5,
            }}
          >
            {rule.description}
          </div>
        )}

        {!compact && rule.suggestion && rule.status === 'failed' && (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: '#fca5a5',
              padding: '4px 8px',
              borderRadius: 6,
              background: 'rgba(239,68,68,0.08)',
              lineHeight: 1.5,
            }}
          >
            💡 {rule.suggestion}
          </div>
        )}
      </div>

      {/* 执行时间 */}
      {!compact && rule.executedAt && (
        <span
          style={{
            fontSize: 11,
            color: '#475569',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {rule.executedAt}
        </span>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

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
export function AIDecisionPanel({
  rules,
  summary,
  title = 'AI 决策面板',
  subtitle,
  expandable = false,
  className,
  emptyText = '暂无规则执行结果',
  onRuleClick,
  compact = false,
}: AIDecisionPanelProps) {
  void expandable;
  // 如果没有传入 summary，从 rules 计算
  const computedSummary: RuleExecutionSummary = summary ?? {
    total: rules.length,
    passed: rules.filter((r) => r.status === 'passed').length,
    failed: rules.filter((r) => r.status === 'failed').length,
    warning: rules.filter((r) => r.status === 'warning').length,
    pending: rules.filter((r) => r.status === 'pending').length,
  };

  const isEmpty = rules.length === 0;

  return (
    <div
      className={className}
      style={{
        borderRadius: 16,
        background: 'rgba(15, 23, 42, 0.38)',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        padding: '20px 18px',
      }}
    >
      {/* 标题区 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#f8fafc',
          }}
        >
          🤖 {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: 12, color: '#64748b' }}>{subtitle}</span>
        )}
      </div>

      {isEmpty ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
        >
          {emptyText}
        </div>
      ) : (
        <>
          {/* 汇总统计 */}
          <SummaryBar summary={computedSummary} />

          {/* 规则列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rules.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                compact={compact}
                onClick={onRuleClick}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
