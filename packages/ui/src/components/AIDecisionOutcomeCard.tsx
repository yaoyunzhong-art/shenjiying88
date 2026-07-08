/**
 * AIDecisionOutcomeCard — AI 决策结果展示卡片
 *
 * 功能:
 * - 展示单个 AI 决策的执行结果（状态 / 置信度 / 影响指标）
 * - 支持决策理由摘要、建议后续动作
 * - 三种状态: approved | rejected | pending_review
 * - 轻量、可嵌入到列表、面板、详情页
 *
 * 使用场景:
 * - AI 决策面板中的结果列表
 * - 异常告警详情页的决策展示
 * - 规则执行链结果卡片
 * - 导购/店长工作台 AI 推荐结果
 */
'use client';

import React from 'react';
import { Badge } from './Badge';
import type { BadgeVariant } from './Badge';

// ---- 类型定义 ----

export type DecisionStatus = 'approved' | 'rejected' | 'pending_review';

export interface ImpactMetric {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface AIDecisionOutcomeCardProps {
  /** 唯一标识 */
  id: string;
  /** 决策标题 */
  title: string;
  /** 决策结果 */
  status: DecisionStatus;
  /** 置信度 0-1 */
  confidence: number;
  /** 决策时间 ISO 字符串 */
  decidedAt?: string;
  /** 决策决策者/模型 */
  decidedBy?: string;
  /** 决策理由摘要 */
  summary?: string;
  /** 影响指标 */
  impactMetrics?: ImpactMetric[];
  /** 建议后续动作 */
  suggestedActions?: string[];
  /** 点击卡片回调 */
  onClick?: (id: string) => void;
  /** 自定义类名 */
  className?: string;
}

// ---- 工具函数 ----

const STATUS_CONFIG: Record<DecisionStatus, { label: string; variant: BadgeVariant; icon: string }> = {
  approved: { label: '已批准', variant: 'success', icon: '✓' },
  rejected: { label: '已拒绝', variant: 'danger', icon: '✗' },
  pending_review: { label: '待复核', variant: 'warning', icon: '○' },
};

const TREND_ICON: Record<string, string> = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

const TREND_COLOR: Record<string, string> = {
  up: '#22c55e',
  down: '#ef4444',
  neutral: '#94a3b8',
};

function formatConfidence(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** 简洁时间格式化 (相对 + 绝对) */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ---- 样式 ----

const STYLES: Record<string, React.CSSProperties> = {
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 16,
    background: '#fff',
    cursor: 'default',
    transition: 'box-shadow 0.2s, border-color 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleArea: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  title: { fontSize: 15, fontWeight: 600, color: '#1e293b', lineHeight: 1.4, margin: 0 },
  metaRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const },
  confidenceBadge: {
    fontSize: 12, fontWeight: 600, color: '#6366f1', background: '#eef2ff',
    padding: '2px 8px', borderRadius: 6,
  },
  timeText: { fontSize: 12, color: '#94a3b8' },
  summary: { fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 },
  metricsRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const },
  metricItem: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  metricLabel: { fontSize: 11, color: '#94a3b8' },
  metricValue: { fontSize: 14, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 4 },
  actionsSection: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  actionsLabel: { fontSize: 11, color: '#94a3b8' },
  actionChip: {
    display: 'inline-block', fontSize: 12, color: '#6366f1', background: '#eef2ff',
    padding: '2px 10px', borderRadius: 6,
  },
  divider: { height: 1, background: '#f1f5f9', margin: 0 },
};

// ---- 组件 ----

export function AIDecisionOutcomeCard({
  id,
  title,
  status,
  confidence,
  decidedAt,
  decidedBy,
  summary,
  impactMetrics,
  suggestedActions,
  onClick,
  className,
}: AIDecisionOutcomeCardProps) {
  const cfg = STATUS_CONFIG[status];

  const cardBaseCss: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#fff', cursor: 'default', transition: 'box-shadow 0.2s, border-color 0.2s', display: 'flex', flexDirection: 'column', gap: 12 };
  const handleClick = onClick ? () => onClick(id) : undefined;
  const cardStyle: React.CSSProperties = onClick
    ? { ...cardBaseCss, cursor: 'pointer' }
    : cardBaseCss;

  return (
    <div
      className={className}
      style={cardStyle}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          (e.currentTarget as HTMLElement).style.borderColor = '#c7d2fe';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
        }
      }}
      role="article"
      aria-label={`AI 决策: ${title} — ${cfg.label}`}
    >
      {/* 头部：标题 + 状态 */}
      <div style={STYLES.header}>
        <div style={STYLES.titleArea}>
          <p style={STYLES.title}>{title}</p>
          <div style={STYLES.metaRow}>
            <Badge variant={cfg.variant}>{cfg.icon} {cfg.label}</Badge>
            <span style={STYLES.confidenceBadge}>置信度 {formatConfidence(confidence)}</span>
            {decidedAt && <span style={STYLES.timeText}>{formatTime(decidedAt)}</span>}
            {decidedBy && <span style={STYLES.timeText}>by {decidedBy}</span>}
          </div>
        </div>
      </div>

      {/* 决策理由 */}
      {summary && <p style={STYLES.summary}>{summary}</p>}

      {/* 影响指标 */}
      {impactMetrics && impactMetrics.length > 0 && (
        <>
          <div style={STYLES.divider} />
          <div style={STYLES.metricsRow}>
            {impactMetrics.map((m, i) => (
              <div key={i} style={STYLES.metricItem}>
                <span style={STYLES.metricLabel}>{m.label}</span>
                <span style={STYLES.metricValue}>
                  {m.value}
                  {m.trend && (
                    <span style={{ color: TREND_COLOR[m.trend], fontSize: 12 }}>
                      {TREND_ICON[m.trend]}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 建议动作 */}
      {suggestedActions && suggestedActions.length > 0 && (
        <>
          <div style={STYLES.divider} />
          <div style={STYLES.actionsSection}>
            <span style={STYLES.actionsLabel}>建议操作</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {suggestedActions.map((action, i) => (
                <span key={i} style={STYLES.actionChip}>{action}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AIDecisionOutcomeCard;
