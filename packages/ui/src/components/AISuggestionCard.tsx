'use client';

import React, { useState, useCallback } from 'react';

// ---- Types ----

/** 建议优先级 */
export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';

/** 建议来源 */
export type SuggestionSource = 'ai' | 'rule' | 'manual' | 'system';

/** AI 建议项 */
export interface SuggestionItem {
  /** 建议 ID */
  id: string;
  /** 建议标题 */
  title: string;
  /** 建议详细描述 */
  description: string;
  /** 优先级 */
  priority: SuggestionPriority;
  /** 来源类型 */
  source: SuggestionSource;
  /** AI 置信度 (0-100) */
  confidence: number;
  /** 预期收益描述 */
  expectedBenefit?: string;
  /** 关联指标 */
  relatedMetrics?: { label: string; value: string; trend?: 'up' | 'down' }[];
  /** 建议操作列表 */
  actions?: { label: string; key: string; variant?: 'primary' | 'secondary' | 'ghost' }[];
  /** 是否已采纳 */
  adopted?: boolean;
  /** 建议生成时间 ISO */
  createdAt?: string;
  /** 额外标签 */
  tags?: string[];
}

/** 组件 Props */
export interface AISuggestionCardProps {
  /** 建议数据 */
  suggestion: SuggestionItem;
  /** 操作回调 */
  onAction?: (actionKey: string, suggestionId: string) => void;
  /** 采纳/拒绝回调 */
  onAdopt?: (adopted: boolean, suggestionId: string) => void;
  /** 卡片变体 */
  variant?: 'compact' | 'detailed';
  /** 类名 */
  className?: string;
}

// ---- Styles ----

const PRIORITY_COLORS: Record<SuggestionPriority, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#6b7280',
};

const PRIORITY_LABELS: Record<SuggestionPriority, string> = {
  critical: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

const SOURCE_LABELS: Record<SuggestionSource, string> = {
  ai: 'AI 分析',
  rule: '规则引擎',
  manual: '手动',
  system: '系统',
};

// ---- Sub Components ----

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 60,
          height: 4,
          background: 'rgba(148,163,184,0.15)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: color,
            borderRadius: 2,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{value}%</span>
    </div>
  );
}

// ---- Main Component ----

export function AISuggestionCard({
  suggestion,
  onAction,
  onAdopt,
  variant = 'detailed',
  className,
}: AISuggestionCardProps) {
  const [adopted, setAdopted] = useState<boolean | null>(suggestion.adopted ?? null);
  const [expanded, setExpanded] = useState(variant === 'detailed');

  const handleAdopt = useCallback(
    (value: boolean) => {
      setAdopted(value);
      onAdopt?.(value, suggestion.id);
    },
    [onAdopt, suggestion.id],
  );

  const handleAction = useCallback(
    (key: string) => {
      onAction?.(key, suggestion.id);
    },
    [onAction, suggestion.id],
  );

  const priorityColor = PRIORITY_COLORS[suggestion.priority];

  return (
    <div
      className={className}
      style={{
        background: 'rgba(15,23,42,0.6)',
        border: `1px solid ${adopted === true ? 'rgba(34,197,94,0.3)' : adopted === false ? 'rgba(239,68,68,0.2)' : 'rgba(148,163,184,0.12)'}`,
        borderRadius: 12,
        padding: '14px 16px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          {/* Priority indicator */}
          <div
            style={{
              width: 3,
              height: 28,
              borderRadius: 2,
              background: priorityColor,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', lineHeight: '20px' }}>
                {suggestion.title}
              </span>
              {/* Priority badge */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: priorityColor,
                  background: `${priorityColor}18`,
                  padding: '1px 6px',
                  borderRadius: 4,
                  lineHeight: '16px',
                }}
              >
                {PRIORITY_LABELS[suggestion.priority]}
              </span>
              {/* Source badge */}
              <span
                style={{
                  fontSize: 10,
                  color: '#94a3b8',
                  background: 'rgba(148,163,184,0.1)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  lineHeight: '16px',
                }}
              >
                {SOURCE_LABELS[suggestion.source]}
              </span>
            </div>
          </div>
        </div>

        {/* Expand toggle for compact */}
        {variant === 'compact' && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: 2,
              fontSize: 14,
              lineHeight: 1,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            ▼
          </button>
        )}
      </div>

      {/* Content */}
      {(expanded || variant === 'detailed') && (
        <>
          {/* Description */}
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px 11px', lineHeight: '20px' }}>
            {suggestion.description}
          </p>

          {/* Confidence + Expected benefit row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginLeft: 11,
              marginBottom: suggestion.relatedMetrics?.length ? 10 : 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>置信度</span>
              <ConfidenceBar value={suggestion.confidence} />
            </div>
            {suggestion.expectedBenefit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>预期收益</span>
                <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>{suggestion.expectedBenefit}</span>
              </div>
            )}
          </div>

          {/* Related metrics */}
          {suggestion.relatedMetrics && suggestion.relatedMetrics.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginLeft: 11,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              {suggestion.relatedMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(148,163,184,0.06)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 11, color: '#64748b' }}>{metric.label}</span>
                  <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{metric.value}</span>
                  {metric.trend && (
                    <span style={{ fontSize: 10, color: metric.trend === 'up' ? '#22c55e' : '#ef4444' }}>
                      {metric.trend === 'up' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {suggestion.tags && suggestion.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginLeft: 11, marginBottom: 12, flexWrap: 'wrap' }}>
              {suggestion.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: 10,
                    color: '#60a5fa',
                    background: 'rgba(96,165,250,0.1)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    lineHeight: '16px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Adopt / Reject */}
          {adopted === null && onAdopt && (
            <div style={{ display: 'flex', gap: 6, marginLeft: 11, marginBottom: 10 }}>
              <button
                onClick={() => handleAdopt(true)}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 6,
                  background: 'rgba(34,197,94,0.08)',
                  color: '#22c55e',
                  cursor: 'pointer',
                }}
              >
                采纳建议
              </button>
              <button
                onClick={() => handleAdopt(false)}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid rgba(148,163,184,0.15)',
                  borderRadius: 6,
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                忽略
              </button>
            </div>
          )}

          {/* Adoption status indicator */}
          {adopted !== null && (
            <div style={{ marginLeft: 11, marginBottom: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: adopted ? '#22c55e' : '#64748b',
                }}
              >
                {adopted ? '✓ 已采纳' : '— 已忽略'}
              </span>
            </div>
          )}

          {/* Action buttons */}
          {suggestion.actions && suggestion.actions.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginLeft: 11 }}>
              {suggestion.actions.map((action) => {
                const isPrimary = action.variant === 'primary' || !action.variant;
                return (
                  <button
                    key={action.key}
                    onClick={() => handleAction(action.key)}
                    style={{
                      padding: '5px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      border: isPrimary ? 'none' : '1px solid rgba(148,163,184,0.2)',
                      borderRadius: 6,
                      background: isPrimary ? '#3b82f6' : 'transparent',
                      color: isPrimary ? '#fff' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Timestamp */}
          {suggestion.createdAt && (
            <div
              style={{
                marginTop: 10,
                marginLeft: 11,
                fontSize: 10,
                color: '#475569',
              }}
            >
              {new Date(suggestion.createdAt).toLocaleString('zh-CN')}
            </div>
          )}
        </>
      )}
    </div>
  );
}
