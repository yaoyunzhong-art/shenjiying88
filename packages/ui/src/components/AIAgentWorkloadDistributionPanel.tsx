'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

/** 单个坐席工作量概览 */
export interface AgentWorkload {
  /** 坐席 ID */
  id: string;
  /** 坐席名称 */
  name: string;
  /** 坐席头像 emoji */
  avatar?: string;
  /** 当前状态: online / away / busy / offline */
  status: 'online' | 'away' | 'busy' | 'offline';
  /** 进行中任务数 */
  activeTasks: number;
  /** 待处理任务数 */
  pendingTasks: number;
  /** 今日已完成任务数 */
  completedToday: number;
  /** 今日平均响应时间(秒) */
  avgResponseSec: number;
  /** 今日好评率 (0-100) */
  satisfactionRate: number;
  /** 专业技能标签 */
  skills?: string[];
}

/** 面板 Props */
export interface AIAgentWorkloadDistributionPanelProps {
  /** 坐席工作量列表 */
  agents: AgentWorkload[];
  /** 面板标题 */
  title?: string;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 空状态提示 */
  emptyText?: string;
  /** 点击坐席回调 */
  onAgentClick?: (agent: AgentWorkload) => void;
  /** 测试 id */
  'data-testid'?: string;
}

// ==================== 工具函数 ====================

/** 状态样式映射 */
function statusConfig(status: AgentWorkload['status']): { label: string; color: string; bg: string } {
  switch (status) {
    case 'online':
      return { label: '在线', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)' };
    case 'away':
      return { label: '离开', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' };
    case 'busy':
      return { label: '忙碌', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)' };
    case 'offline':
      return { label: '离线', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' };
  }
}

/** 响应时间评级 */
function responseTimeLevel(sec: number): { text: string; color: string } {
  if (sec <= 30) return { text: '优秀', color: '#4ade80' };
  if (sec <= 60) return { text: '良好', color: '#fbbf24' };
  if (sec <= 120) return { text: '一般', color: '#fb923c' };
  return { text: '待改善', color: '#f87171' };
}

/** 满意度条形颜色 */
function satisfactionColor(rate: number): string {
  if (rate >= 90) return '#4ade80';
  if (rate >= 70) return '#fbbf24';
  return '#f87171';
}

// ==================== 小组件 ====================

function AgentCard({
  agent,
  compact,
  onAgentClick,
}: {
  agent: AgentWorkload;
  compact: boolean;
  onAgentClick?: (agent: AgentWorkload) => void;
}) {
  const st = statusConfig(agent.status);
  const rtl = responseTimeLevel(agent.avgResponseSec);
  const total = agent.activeTasks + agent.pendingTasks + agent.completedToday;

  return (
    <article
      onClick={() => onAgentClick?.(agent)}
      style={{
        borderRadius: 14,
        padding: compact ? 12 : 16,
        background: 'rgba(15, 23, 42, 0.35)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        cursor: onAgentClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(96, 165, 250, 0.4)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(148, 163, 184, 0.15)';
      }}
    >
      {/* 头部: 头像 + 名称 + 状态 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: compact ? 8 : 12 }}>
        <div
          style={{
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            borderRadius: '50%',
            backgroundColor: st.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: compact ? 14 : 18,
            flexShrink: 0,
          }}
        >
          {agent.avatar || '🤖'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: compact ? 13 : 14, color: '#e2e8f0' }}>
            {agent.name}
          </div>
          <div style={{ fontSize: 11, color: st.color, marginTop: 2 }}>
            ● {st.label}
          </div>
        </div>
        {/* 技能标签 */}
        {agent.skills && agent.skills.length > 0 && !compact && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 140 }}>
            {agent.skills.slice(0, 3).map((sk) => (
              <span
                key={sk}
                style={{
                  padding: '2px 7px',
                  borderRadius: 8,
                  fontSize: 10,
                  background: 'rgba(96, 165, 250, 0.12)',
                  color: '#93c5fd',
                  whiteSpace: 'nowrap',
                }}
              >
                {sk}
              </span>
            ))}
            {agent.skills.length > 3 && (
              <span style={{ fontSize: 10, color: '#64748b' }}>+{agent.skills.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* 指标网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: compact ? 6 : 10,
        }}
      >
        <MetricBox label="进行中" value={agent.activeTasks} color="#60a5fa" compact={compact} />
        <MetricBox label="待处理" value={agent.pendingTasks} color="#fbbf24" compact={compact} />
        <MetricBox label="已完成" value={agent.completedToday} color="#4ade80" compact={compact} />
      </div>

      {/* 副指标: 响应时间 + 满意度 + 总量 */}
      {!compact && (
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 10,
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            响应{' '}
            <span style={{ color: rtl.color, fontWeight: 600 }}>
              {agent.avgResponseSec < 60
                ? `${agent.avgResponseSec}s`
                : `${(agent.avgResponseSec / 60).toFixed(1)}m`}
            </span>
            <span style={{ color: rtl.color, marginLeft: 4 }}>({rtl.text})</span>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            满意度{' '}
            <span style={{ color: satisfactionColor(agent.satisfactionRate), fontWeight: 600 }}>
              {agent.satisfactionRate}%
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            合计 <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{total}</span>
          </div>
        </div>
      )}
    </article>
  );
}

function MetricBox({
  label,
  value,
  color,
  compact,
}: {
  label: string;
  value: number;
  color: string;
  compact: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 10,
        padding: compact ? '6px 8px' : '8px 10px',
        background: 'rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: compact ? 16 : 20, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ==================== 主面板 ====================

export function AIAgentWorkloadDistributionPanel(
  props: AIAgentWorkloadDistributionPanelProps
) {
  const {
    agents,
    title = '坐席工作量分布',
    compact = false,
    emptyText = '暂无坐席数据',
    onAgentClick,
    'data-testid': testId,
  } = props;

  // 汇总统计
  const summary = useMemo(() => {
    const total = agents.length;
    const online = agents.filter((a) => a.status === 'online').length;
    const busy = agents.filter((a) => a.status === 'busy').length;
    const away = agents.filter((a) => a.status === 'away').length;
    const activeSum = agents.reduce((s, a) => s + a.activeTasks, 0);
    const pendingSum = agents.reduce((s, a) => s + a.pendingTasks, 0);
    const completedSum = agents.reduce((s, a) => s + a.completedToday, 0);
    const avgSatisfaction =
      total > 0
        ? agents.reduce((s, a) => s + a.satisfactionRate, 0) / total
        : 0;
    return { total, online, busy, away, activeSum, pendingSum, completedSum, avgSatisfaction };
  }, [agents]);

  // 按状态分组排序: online > busy > away > offline
  const sorted = useMemo(
    () =>
      [...agents].sort((a, b) => {
        const order: Record<string, number> = { online: 0, busy: 1, away: 2, offline: 3 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      }),
    [agents]
  );

  // 空状态
  if (agents.length === 0) {
    return (
      <div
        style={{
          borderRadius: 16,
          padding: 32,
          background: 'rgba(15, 23, 42, 0.3)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          textAlign: 'center',
          color: '#64748b',
          fontSize: 14,
        }}
        data-testid={testId}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <section data-testid={testId}>
      {/* 面板头部 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>
          {title}
          <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b', fontWeight: 400 }}>
            {agents.length} 位坐席
          </span>
        </h3>
        {/* 汇总统计 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <SummaryBadge label="在线" value={summary.online} color="#4ade80" />
          <SummaryBadge label="忙碌" value={summary.busy} color="#f87171" />
          <SummaryBadge label="离开" value={summary.away} color="#fbbf24" />
          <SummaryBadge
            label="满意度"
            value={`${summary.avgSatisfaction.toFixed(1)}%`}
            color={satisfactionColor(summary.avgSatisfaction)}
          />
        </div>
      </div>

      {/* 全局汇总卡片 */}
      {!compact && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <GlobalStat label="进行中任务" value={summary.activeSum} color="#60a5fa" />
          <GlobalStat label="待处理任务" value={summary.pendingSum} color="#fbbf24" />
          <GlobalStat label="已完成(今日)" value={summary.completedSum} color="#4ade80" />
          <GlobalStat label="总处理量" value={summary.activeSum + summary.pendingSum + summary.completedSum} color="#cbd5e1" />
        </div>
      )}

      {/* 坐席卡片网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact
            ? 'repeat(auto-fill, minmax(220px, 1fr))'
            : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: compact ? 10 : 14,
        }}
      >
        {sorted.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            compact={compact}
            onAgentClick={onAgentClick}
          />
        ))}
      </div>
    </section>
  );
}

// ==================== 子组件 ====================

function SummaryBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
      {label}
      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function GlobalStat({
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
        borderRadius: 12,
        padding: '12px 16px',
        background: 'rgba(15, 23, 42, 0.3)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{label}</div>
    </div>
  );
}
