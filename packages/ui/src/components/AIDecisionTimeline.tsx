'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 时间轴节点状态 */
export type TimelineNodeStatus = 'success' | 'failure' | 'warning' | 'skipped' | 'running';

/** 决策事件节点 */
export interface DecisionEvent {
  /** 事件唯一 ID */
  id: string;
  /** 事件时间戳 */
  timestamp: string;
  /** 事件标题 */
  title: string;
  /** 事件描述 */
  description?: string;
  /** 事件状态 */
  status: TimelineNodeStatus;
  /** 关联规则数 */
  ruleCount?: number;
  /** 通过规则数 */
  passedCount?: number;
  /** 失败规则数 */
  failedCount?: number;
  /** 操作人 */
  operator?: string;
  /** 操作说明 */
  actionLabel?: string;
  /** 自定义详情节点回调 */
  renderDetail?: () => React.ReactNode;
}

/** AI 决策时间线 Props */
export interface AIDecisionTimelineProps {
  /** 决策事件列表 */
  events: DecisionEvent[];
  /** 面板标题 */
  title?: string;
  /** 面板副标题 */
  subtitle?: string;
  /** 最多显示条数(超出折叠) */
  maxVisible?: number;
  /** 空状态文案 */
  emptyText?: string;
  /** 自定义类名 */
  className?: string;
  /** 事件点击回调 */
  onEventClick?: (event: DecisionEvent) => void;
}

// ==================== 状态样式映射 ====================

const STATUS_META: Record<
  TimelineNodeStatus,
  { label: string; color: string; bg: string; lineColor: string; icon: string }
> = {
  success: {
    label: '成功',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
    lineColor: '#22c55e',
    icon: '✓',
  },
  failure: {
    label: '失败',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.15)',
    lineColor: '#ef4444',
    icon: '✗',
  },
  warning: {
    label: '警告',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
    lineColor: '#f59e0b',
    icon: '⚠',
  },
  skipped: {
    label: '跳过',
    color: '#64748b',
    bg: 'rgba(100,116,139,0.15)',
    lineColor: '#475569',
    icon: '⊘',
  },
  running: {
    label: '执行中',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
    lineColor: '#3b82f6',
    icon: '⟳',
  },
};

// ==================== 子组件：单节点 ====================

function TimelineNode({
  event,
  isLast,
  onClick,
}: {
  event: DecisionEvent;
  isLast: boolean;
  onClick?: (event: DecisionEvent) => void;
}) {
  const meta = STATUS_META[event.status];

  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        position: 'relative',
        paddingBottom: isLast ? 0 : 0,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={() => onClick?.(event)}
    >
      {/* 左侧：时间线节点 + 连线 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 32,
          flexShrink: 0,
        }}
      >
        {/* 状态圆点 */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: meta.bg,
            border: `2px solid ${meta.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: meta.color,
            zIndex: 1,
          }}
        >
          {event.status === 'running' ? (
            <span
              style={{
                display: 'inline-block',
                animation: 'aidtSpin 1s linear infinite',
              }}
            >
              ⟳
            </span>
          ) : (
            meta.icon
          )}
        </div>

        {/* 连线(非最后一项) */}
        {!isLast && (
          <div
            style={{
              width: 2,
              flex: 1,
              minHeight: 16,
              background: `linear-gradient(to bottom, ${meta.lineColor}, rgba(100,116,139,0.3))`,
            }}
          />
        )}
      </div>

      {/* 右侧：内容 */}
      <div
        style={{
          flex: 1,
          paddingBottom: isLast ? 4 : 20,
        }}
      >
        {/* 时间线和操作人 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: '#64748b',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {event.timestamp}
          </span>
          {event.operator && (
            <span
              style={{
                fontSize: 11,
                color: '#475569',
                padding: '1px 6px',
                borderRadius: 4,
                background: 'rgba(148,163,184,0.12)',
              }}
            >
              {event.operator}
            </span>
          )}
          {event.actionLabel && (
            <span
              style={{
                fontSize: 11,
                color: meta.color,
                fontWeight: 600,
              }}
            >
              {event.actionLabel}
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 4,
              background: meta.bg,
              color: meta.color,
              fontWeight: 600,
              marginLeft: 'auto',
            }}
          >
            {meta.label}
          </span>
        </div>

        {/* 标题 */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#e2e8f0',
            marginBottom: 2,
          }}
        >
          {event.title}
        </div>

        {/* 描述 */}
        {event.description && (
          <div
            style={{
              fontSize: 12,
              color: '#94a3b8',
              lineHeight: 1.5,
              marginTop: 4,
            }}
          >
            {event.description}
          </div>
        )}

        {/* 规则统计 */}
        {event.ruleCount != null && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 8,
            }}
          >
            <Chip label="规则" value={event.ruleCount} color="#64748b" />
            {event.passedCount != null && (
              <Chip label="通过" value={event.passedCount} color="#22c55e" />
            )}
            {event.failedCount != null && (
              <Chip label="失败" value={event.failedCount} color="#ef4444" />
            )}
          </div>
        )}

        {/* 自定义详情 */}
        {event.renderDetail?.()}
      </div>
    </div>
  );
}

// ==================== 微型 Chip ====================

function Chip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 6,
        background: `${color}14`,
        color,
        fontWeight: 600,
      }}
    >
      <span style={{ opacity: 0.8 }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// ==================== 展开折叠按钮 ====================

function ExpandButton({
  hidden,
  count,
  onClick,
}: {
  hidden: number;
  count: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        textAlign: 'center',
        padding: '8px 0',
        fontSize: 12,
        color: '#3b82f6',
        cursor: 'pointer',
        fontWeight: 600,
        borderRadius: 8,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background =
          'rgba(59,130,246,0.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      展开剩余 {hidden} 条记录 ↓
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * AIDecisionTimeline — AI 决策执行历史时间线。
 *
 * 以纵轴时间线展示 AI 决策历史事件，包括：
 * - 时间线节点 + 状态着色连线
 * - 操作记录（时间/操作人/动作标签）
 * - 规则统计（规则数/通过数/失败数）
 * - 最大条数折叠功能
 * - 事件点击交互
 *
 * @example
 * <AIDecisionTimeline
 *   title="决策执行记录"
 *   events={[
 *     {
 *       id: '1',
 *       timestamp: '2026-06-30 14:22',
 *       title: '库存异常规则触发',
 *       description: '3个SKU库存为负数，触发自动补货流程',
 *       status: 'warning',
 *       ruleCount: 12,
 *       passedCount: 9,
 *       failedCount: 3,
 *       operator: 'system',
 *       actionLabel: '自动触发',
 *     },
 *     {
 *       id: '2',
 *       timestamp: '2026-06-30 13:50',
 *       title: '价格合规检查完成',
 *       description: '全量价格检查完成，未发现异常',
 *       status: 'success',
 *       ruleCount: 8,
 *       passedCount: 8,
 *       operator: 'admin',
 *       actionLabel: '手动执行',
 *     },
 *   ]}
 *   maxVisible={10}
 *   onEventClick={(e) => console.log(e.id)}
 * />
 */
export function AIDecisionTimeline({
  events,
  title = 'AI 决策时间线',
  subtitle,
  maxVisible = 20,
  emptyText = '暂无决策执行记录',
  className,
  onEventClick,
}: AIDecisionTimelineProps) {
  const [showAll, setShowAll] = React.useState(false);

  const visibleEvents = showAll ? events : events.slice(0, maxVisible);
  const hiddenCount = events.length - maxVisible;

  if (events.length === 0) {
    return (
      <PanelShell title={title} subtitle={subtitle} className={className}>
        <div
          style={{
            padding: '40px 16px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
        >
          {emptyText}
        </div>
      </PanelShell>
    );
  }

  return (
    <PanelShell title={title} subtitle={subtitle} className={className}>
      {/* 事件总览计数 */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 16,
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(148,163,184,0.06)',
        }}
      >
        <OverviewItem label="总执行" value={events.length} color="#e2e8f0" />
        <OverviewItem
          label="成功"
          value={events.filter((e) => e.status === 'success').length}
          color="#22c55e"
        />
        <OverviewItem
          label="失败"
          value={events.filter((e) => e.status === 'failure').length}
          color="#ef4444"
        />
        <OverviewItem
          label="警告"
          value={events.filter((e) => e.status === 'warning').length}
          color="#f59e0b"
        />
        <OverviewItem
          label="进行中"
          value={events.filter((e) => e.status === 'running').length}
          color="#3b82f6"
        />
      </div>

      {/* 时间线 */}
      <div style={{ paddingLeft: 0 }}>
        {visibleEvents.map((event, idx) => (
          <TimelineNode
            key={event.id}
            event={event}
            isLast={idx === visibleEvents.length - 1}
            onClick={onEventClick}
          />
        ))}
      </div>

      {/* 展开折叠 */}
      {!showAll && hiddenCount > 0 && (
        <ExpandButton
          hidden={hiddenCount}
          count={events.length}
          onClick={() => setShowAll(true)}
        />
      )}
      {showAll && hiddenCount > 0 && (
        <div
          onClick={() => setShowAll(false)}
          style={{
            textAlign: 'center',
            padding: '8px 0',
            fontSize: 12,
            color: '#64748b',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          收起 ↑
        </div>
      )}

      {/* 动画关键帧 */}
      <style>{`
        @keyframes aidtSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </PanelShell>
  );
}

// ==================== 面板外壳 ====================

function PanelShell({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
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
          🕐 {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: 12, color: '#64748b' }}>{subtitle}</span>
        )}
      </div>

      {children}
    </div>
  );
}

// ==================== 概览项 ====================

function OverviewItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
    </div>
  );
}
