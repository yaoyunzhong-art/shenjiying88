'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 客服服务质量指标 */
export interface ServiceQualityMetrics {
  /** 今日已处理工单数 */
  resolvedTickets: number;
  /** 平均响应时间 (分钟) */
  avgResponseTime: number;
  /** 平均解决时间 (分钟) */
  avgResolutionTime: number;
  /** 客户满意度 (1-5) */
  satisfactionScore: number;
}

/** 客服工单 */
export interface ServiceTicket {
  id: string;
  title: string;
  customerName: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'complaint' | 'inquiry' | 'refund' | 'exchange' | 'other';
  createdAt: string;
  assignedTo?: string;
}

/** 座席状态摘要 */
export interface AgentStatusSummary {
  total: number;
  online: number;
  busy: number;
  away: number;
  offline: number;
}

/** 快速操作 */
export interface QuickAction {
  key: string;
  label: string;
  icon?: string;
  primary?: boolean;
  onClick?: () => void;
}

/** 客服主管工作台 Props */
export interface CustomerServiceDashboardProps {
  /** 服务质量指标 */
  serviceMetrics?: ServiceQualityMetrics;
  /** 待处理工单列表 */
  pendingTickets?: ServiceTicket[];
  /** 座席状态 */
  agentStatus?: AgentStatusSummary;
  /** 快速操作按钮 */
  quickActions?: QuickAction[];
  /** 团队名称 */
  teamName?: string;
  /** 最后同步时间 */
  lastSyncAt?: string;
  /** 加载中 */
  loading?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ---- 默认样式常量 ----
const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 24,
};

const CARD_STYLE: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  padding: 16,
};

// ---- 子组件 ----

/** 座席状态指示器 */
function AgentStatusIndicator({ agentStatus }: { agentStatus: AgentStatusSummary }) {
  const items: { label: string; count: number; color: string }[] = [
    { label: '在线', count: agentStatus.online, color: '#22c55e' },
    { label: '忙碌', count: agentStatus.busy, color: '#f59e0b' },
    { label: '离开', count: agentStatus.away, color: '#94a3b8' },
    { label: '离线', count: agentStatus.offline, color: '#ef4444' },
  ];

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {items.map((item) => (
        <div key={item.label} style={{ textAlign: 'center', minWidth: 56 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>
            {item.count}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

/** 优先级别标签（内联样式） */
function PriorityBadge({ priority }: { priority: ServiceTicket['priority'] }) {
  const colorMap: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e',
  };
  const labelMap: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        background: colorMap[priority] ?? '#6b7280',
      }}
    >
      {labelMap[priority] ?? priority}
    </span>
  );
}

/** 状态映射 */
function statusVariant(status: ServiceTicket['status']): 'info' | 'warning' | 'success' | 'neutral' {
  switch (status) {
    case 'open': return 'info';
    case 'in_progress': return 'warning';
    case 'resolved': return 'success';
    case 'closed': return 'neutral';
    default: return 'neutral';
  }
}

function statusLabel(status: ServiceTicket['status']): string {
  switch (status) {
    case 'open': return '待处理';
    case 'in_progress': return '处理中';
    case 'resolved': return '已解决';
    case 'closed': return '已关闭';
    default: return status;
  }
}

// ---- 工单表格列定义 (模块级常量) ----
const TICKET_COLUMNS: DataTableColumn<ServiceTicket>[] = [
  {
    key: 'id',
    header: '工单号',
    width: '100px',
    render: (t: ServiceTicket) => (
      <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{t.id}</span>
    ),
  },
  {
    key: 'title',
    header: '标题',
    render: (t: ServiceTicket) => (
      <span style={{ fontWeight: 500, fontSize: 14 }}>{t.title}</span>
    ),
  },
  {
    key: 'customerName',
    header: '客户',
    width: '120px',
  },
  {
    key: 'priority',
    header: '优先级',
    width: '80px',
    render: (t: ServiceTicket) => <PriorityBadge priority={t.priority} />,
  },
  {
    key: 'status',
    header: '状态',
    width: '100px',
    render: (t: ServiceTicket) => (
      <StatusBadge label={statusLabel(t.status)} variant={statusVariant(t.status)} size="sm" />
    ),
  },
  {
    key: 'category',
    header: '分类',
    width: '90px',
  },
  {
    key: 'createdAt',
    header: '创建时间',
    width: '160px',
    render: (t: ServiceTicket) => (
      <span style={{ fontSize: 13, color: '#6b7280' }}>
        {new Date(t.createdAt).toLocaleString('zh-CN')}
      </span>
    ),
  },
];

// ---- 主组件 ----

export function CustomerServiceDashboard({
  serviceMetrics,
  pendingTickets = [],
  agentStatus,
  quickActions = [],
  teamName = '客服团队',
  lastSyncAt,
  loading = false,
  compact = false,
  className,
}: CustomerServiceDashboardProps) {
  if (loading) {
    return (
      <div className={className} style={{ padding: compact ? 8 : 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#6b7280' }}>
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ padding: compact ? 8 : 16 }}>
      {/* 头部 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{teamName}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            客服主管工作台
            {lastSyncAt && ` · 最后同步 ${new Date(lastSyncAt).toLocaleString('zh-CN')}`}
          </p>
        </div>
        {quickActions.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {quickActions.map((action) => (
              <button
                key={action.key}
                onClick={action.onClick}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: action.primary ? 'none' : '1px solid #d1d5db',
                  background: action.primary ? '#2563eb' : '#fff',
                  color: action.primary ? '#fff' : '#374151',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {action.icon && <span style={{ marginRight: 4 }}>{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 服务质量指标 */}
      {serviceMetrics && (
        <div style={SECTION_STYLE}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>
            今日服务概览
          </h3>
          <QuickStats
            items={[
              { label: '已处理工单', value: serviceMetrics.resolvedTickets },
              { label: '平均响应', value: `${serviceMetrics.avgResponseTime}分钟` },
              { label: '平均解决', value: `${serviceMetrics.avgResolutionTime}分钟` },
              { label: '客户满意度', value: serviceMetrics.satisfactionScore.toFixed(1) },
            ]}
            columns={4}
          />
        </div>
      )}

      {/* 座席状态 + 待处理工单 */}
      <div
        style={{
          ...SECTION_STYLE,
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : '1fr 1fr',
          gap: 16,
        }}
      >
        {agentStatus && (
          <div style={CARD_STYLE}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>
              座席状态
            </h3>
            <AgentStatusIndicator agentStatus={agentStatus} />
          </div>
        )}

        <div style={CARD_STYLE}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>
            待处理工单
          </h3>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#2563eb' }}>
            {pendingTickets.length}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            等待分配或处理
          </div>
        </div>
      </div>

      {/* 工单列表 */}
      {pendingTickets.length > 0 && (
        <div style={SECTION_STYLE}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>
            待处理工单列表
          </h3>
          <div style={CARD_STYLE}>
            <DataTable
              rows={pendingTickets}
              columns={TICKET_COLUMNS}
              rowKey={(t: ServiceTicket) => t.id}
              compact={compact}
            />
          </div>
        </div>
      )}

      {/* 空状态 */}
      {pendingTickets.length === 0 && serviceMetrics && (
        <div
          style={{
            ...CARD_STYLE,
            textAlign: 'center',
            padding: '48px 16px',
            color: '#9ca3af',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>所有工单已处理完毕</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>暂无待处理的客户服务请求</div>
        </div>
      )}
    </div>
  );
}
