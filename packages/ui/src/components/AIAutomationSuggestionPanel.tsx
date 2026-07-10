'use client';

import React, { useState } from 'react';

// ==================== 类型定义 ====================

/** 自动化触发条件类型 */
export type TriggerConditionType =
  | 'threshold'       // 阈值触发
  | 'pattern'         // 模式识别
  | 'schedule'        // 定时触发
  | 'anomaly'         // 异常触发
  | 'composite';      // 复合条件

/** 触发条件 */
export interface TriggerCondition {
  type: TriggerConditionType;
  label: string;
  detail: string;
}

/** 自动化执行动作 */
export interface AutomationAction {
  type: string;
  label: string;
  description: string;
}

/** 建议执行状态 */
export type SuggestionStatus =
  | 'pending'       // 待处理
  | 'applied'       // 已应用
  | 'dismissed'     // 已忽略
  | 'in_progress';  // 执行中

/** 预期收益 */
export interface ExpectedBenefit {
  metric: string;
  current: string;
  projected: string;
  improvement: string;
}

/** 自动化建议条目 */
export interface AutomationSuggestion {
  id: string;
  title: string;
  description: string;
  confidence: number;         // 0-100
  trigger: TriggerCondition;
  action: AutomationAction;
  status: SuggestionStatus;
  benefit: ExpectedBenefit;
  estimatedEffort: 'low' | 'medium' | 'high';
  createdAt: string;
  executedAt?: string;
  tags?: string[];
}

/** 面板属性 */
export interface AIAutomationSuggestionPanelProps {
  suggestions: AutomationSuggestion[];
  title?: string;
  emptyText?: string;
  onApply?: (suggestion: AutomationSuggestion) => void;
  onDismiss?: (suggestionId: string) => void;
  onViewDetail?: (suggestion: AutomationSuggestion) => void;
  className?: string;
  loading?: boolean;
}

// ==================== 样式 ====================

const s: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    background: '#fff',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  headerBadge: {
    background: '#eef2ff',
    color: '#4338ca',
    borderRadius: 999,
    padding: '2px 10px',
    fontSize: 12,
    fontWeight: 500,
  },
  list: {
    padding: '8px 0',
  },
  card: {
    padding: '14px 20px',
    borderBottom: '1px solid #f9fafb',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
    lineHeight: '20px',
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: '18px',
    marginBottom: 8,
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 12,
    alignItems: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  confidenceBar: {
    width: '100%',
    height: 4,
    background: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  benefitGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginTop: 8,
    padding: 10,
    background: '#f9fafb',
    borderRadius: 8,
  },
  benefitItem: {
    textAlign: 'center' as const,
  },
  benefitLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  benefitValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#111827',
  },
  actionBar: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #f3f4f6',
  },
  primaryBtn: {
    padding: '6px 16px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '6px 16px',
    background: '#fff',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#9ca3af',
    fontSize: 14,
  },
  triggerTag: {
    fontSize: 11,
    color: '#6366f1',
    background: '#eef2ff',
    borderRadius: 4,
    padding: '1px 6px',
  },
  loadingPlaceholder: {
    padding: 40,
    textAlign: 'center' as const,
    color: '#d1d5db',
    fontSize: 14,
  },
};

// ==================== 辅助样式函数 ====================

const getStatusBadgeStyle = (color: string, bg: string): React.CSSProperties => ({
  fontSize: 11,
  fontWeight: 500,
  color,
  background: bg,
  borderRadius: 999,
  padding: '1px 8px',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  marginLeft: 8,
});

const getConfidenceFillStyle = (value: number): React.CSSProperties => ({
  height: '100%',
  width: `${value}%`,
  borderRadius: 2,
  background: value >= 80 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444',
  transition: 'width 0.3s',
});

const getEffortChipStyle = (color: string, bg: string): React.CSSProperties => ({
  fontSize: 11,
  color,
  background: bg,
  borderRadius: 4,
  padding: '1px 6px',
});

// ==================== 子组件 ====================

const StatusBadge: React.FC<{ status: SuggestionStatus }> = ({ status }) => {
  const map: Record<SuggestionStatus, { label: string; color: string; bg: string }> = {
    pending: { label: '待处理', color: '#92400e', bg: '#fffbeb' },
    applied: { label: '已应用', color: '#166534', bg: '#f0fdf4' },
    dismissed: { label: '已忽略', color: '#6b7280', bg: '#f3f4f6' },
    in_progress: { label: '执行中', color: '#1e40af', bg: '#eff6ff' },
  };
  const { label, color, bg } = map[status];
  return <span style={getStatusBadgeStyle(color, bg)}>{label}</span>;
};

const EffortChip: React.FC<{ effort: 'low' | 'medium' | 'high' }> = ({ effort }) => {
  const map = {
    low: { label: '低', color: '#166534', bg: '#f0fdf4' },
    medium: { label: '中', color: '#92400e', bg: '#fffbeb' },
    high: { label: '高', color: '#991b1b', bg: '#fef2f2' },
  };
  const { label, color, bg } = map[effort];
  return <span style={getEffortChipStyle(color, bg)}>投入:{label}</span>;
};

const TriggerLabel: React.FC<{ type: TriggerConditionType }> = ({ type }) => {
  const map: Record<TriggerConditionType, string> = {
    threshold: '阈值',
    pattern: '模式',
    schedule: '定时',
    anomaly: '异常',
    composite: '复合',
  };
  return <span style={s.triggerTag}>{map[type]}</span>;
};

// ==================== 主组件 ====================

export const AIAutomationSuggestionPanel: React.FC<AIAutomationSuggestionPanelProps> = ({
  suggestions,
  title = 'AI 自动化建议',
  emptyText = '暂无待处理的自动化建议',
  onApply,
  onDismiss,
  onViewDetail,
  className,
  loading = false,
}) => {
  if (loading) {
    return (
      <div style={s.container} className={className}>
        <div style={s.loadingPlaceholder}>⏳ 正在分析数据，生成建议…</div>
      </div>
    );
  }

  const pendingCount = suggestions.filter((s) => s.status === 'pending').length;

  return (
    <div style={s.container} className={className} data-testid="ai-automation-suggestion-panel">
      <div style={s.header}>
        <h3 style={s.headerTitle}>{title}</h3>
        {pendingCount > 0 && (
          <span style={s.headerBadge}>{pendingCount} 条待处理</span>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div style={s.emptyState}>{emptyText}</div>
      ) : (
        <div style={s.list}>
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              style={s.card}
              onClick={() => onViewDetail?.(suggestion)}
              data-testid={`suggestion-card-${suggestion.id}`}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              {/* 标题行 */}
              <div style={s.cardTopRow}>
                <h4 style={s.cardTitle}>{suggestion.title}</h4>
                <StatusBadge status={suggestion.status} />
              </div>

              {/* 描述 */}
              <p style={s.description}>{suggestion.description}</p>

              {/* 元信息行 */}
              <div style={s.metaRow}>
                <span style={s.metaItem}>
                  <TriggerLabel type={suggestion.trigger.type} />
                  <span>{suggestion.trigger.label}</span>
                </span>
                <span style={s.metaItem}>
                  <span>🎯 {suggestion.action.label}</span>
                </span>
                <EffortChip effort={suggestion.estimatedEffort} />
                <span style={s.metaItem}>🕐 {suggestion.createdAt}</span>
                {suggestion.executedAt && (
                  <span style={s.metaItem}>✅ 执行时间: {suggestion.executedAt}</span>
                )}
              </div>

              {/* 置信度 */}
              <div title={`置信度: ${suggestion.confidence}%`}>
                <div style={s.confidenceBar}>
                  <div style={getConfidenceFillStyle(suggestion.confidence)} />
                </div>
              </div>

              {/* 预期收益 */}
              <div style={s.benefitGrid}>
                <div style={s.benefitItem}>
                  <div style={s.benefitLabel}>当前</div>
                  <div style={s.benefitValue}>{suggestion.benefit.current}</div>
                </div>
                <div style={s.benefitItem}>
                  <div style={s.benefitLabel}>优化后</div>
                  <div style={s.benefitValue}>{suggestion.benefit.projected}</div>
                </div>
                <div style={s.benefitItem}>
                  <div style={s.benefitLabel}>提升</div>
                  <div style={{ ...s.benefitValue, color: '#16a34a' }}>{suggestion.benefit.improvement}</div>
                </div>
              </div>

              {/* 操作按钮 (仅待处理) */}
              {suggestion.status === 'pending' && (
                <div style={s.actionBar}>
                  <button
                    style={s.primaryBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onApply?.(suggestion);
                    }}
                    data-testid={`apply-btn-${suggestion.id}`}
                  >
                    应用建议
                  </button>
                  <button
                    style={s.secondaryBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss?.(suggestion.id);
                    }}
                    data-testid={`dismiss-btn-${suggestion.id}`}
                  >
                    忽略
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
