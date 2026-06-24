'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 今日运营指标 */
export interface StoreDailyMetrics {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  newMembers: number;
  /** 同比变化 (百分比点数, 正 = 上升) */
  revenueTrend: number;
  orderTrend: number;
  avgValueTrend: number;
  memberTrend: number;
}

/** 待办任务 */
export interface PendingTask {
  id: string;
  title: string;
  type: 'inventory' | 'member' | 'order' | 'device' | 'alert';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  description?: string;
}

/** 设备状态摘要 */
export interface DeviceStatusSummary {
  total: number;
  online: number;
  offline: number;
  warning: number;
  lastCheckAt?: string;
}

/** 快速操作 */
export interface QuickAction {
  key: string;
  label: string;
  icon?: string;
  /** 是否为主要操作 (高亮) */
  primary?: boolean;
  onClick?: () => void;
}

/** 店长工作台 Props */
export interface StoreManagerDashboardProps {
  /** 今日运营指标 */
  dailyMetrics?: StoreDailyMetrics;
  /** 待办任务列表 */
  pendingTasks?: PendingTask[];
  /** 设备状态 */
  deviceStatus?: DeviceStatusSummary;
  /** 快速操作按钮 */
  quickActions?: QuickAction[];
  /** 门店名称 */
  storeName?: string;
  /** 最后同步时间 */
  lastSyncAt?: string;
  /** 加载中 */
  loading?: boolean;
  /** 紧凑模式 (移动端适配) */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ---- 默认样式常量 ----

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 24,
};

const SECTION_HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 14,
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#f1f5f9',
};

const SECTION_SUBTITLE_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
};

const ACTION_BAR_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 10,
  marginBottom: 20,
};

const ACTION_BUTTON_STYLE: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(15,23,42,0.38)',
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap' as const,
};

const PRIMARY_ACTION_STYLE: React.CSSProperties = {
  ...ACTION_BUTTON_STYLE,
  background: 'rgba(59,130,246,0.18)',
  borderColor: 'rgba(59,130,246,0.35)',
  color: '#93c5fd',
};

const TASK_CARD_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderRadius: 10,
  background: 'rgba(15,23,42,0.28)',
  border: '1px solid rgba(148,163,184,0.10)',
  marginBottom: 8,
};

const DEVICE_BAR_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '14px 18px',
  borderRadius: 10,
  background: 'rgba(15,23,42,0.28)',
  border: '1px solid rgba(148,163,184,0.10)',
  marginBottom: 20,
};

const HEADER_WRAPPER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 18,
  flexWrap: 'wrap' as const,
  gap: 10,
};

// ---- 工具函数 ----

/** 优先级 → 颜色/标签 */
function priorityMeta(priority: PendingTask['priority']): { label: string; variant: 'error' | 'warning' | 'neutral' } {
  switch (priority) {
    case 'high':
      return { label: '高', variant: 'error' };
    case 'medium':
      return { label: '中', variant: 'warning' };
    case 'low':
      return { label: '低', variant: 'neutral' };
  }
}

/** 任务类型 → 中文标签 */
function taskTypeLabel(type: PendingTask['type']): string {
  const map: Record<PendingTask['type'], string> = {
    inventory: '库存',
    member: '会员',
    order: '订单',
    device: '设备',
    alert: '告警',
  };
  return map[type] ?? type;
}

/** 格式化金额 */
function fmtCurrency(value: number): string {
  if (Math.abs(value) >= 10000) {
    return (value / 10000).toFixed(1) + '万';
  }
  return value.toLocaleString('zh-CN');
}

/** 格式化趋势 */
function fmtTrend(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

// ---- 列配置 ----

const TASK_COLUMNS: DataTableColumn<PendingTask>[] = [
  {
    key: 'type',
    header: '类型',
    width: '60px',
    render: (row) => (
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{taskTypeLabel(row.type)}</span>
    ),
  },
  {
    key: 'title',
    header: '任务',
    width: '200px',
    render: (row) => <span style={{ fontSize: 13, color: '#e2e8f0' }}>{row.title}</span>,
  },
  {
    key: 'priority',
    header: '优先级',
    width: '70px',
    render: (row) => {
      const m = priorityMeta(row.priority);
      return <StatusBadge label={m.label} variant={m.variant} size="sm" />;
    },
  },
  {
    key: 'createdAt',
    header: '时间',
    width: '80px',
    render: (row) => (
      <span style={{ fontSize: 11, color: '#64748b' }}>{row.createdAt}</span>
    ),
  },
];

// ---- 主组件 ----

/**
 * StoreManagerDashboard — 店长工作台
 *
 * 聚合店长日常运营所需的核心数据、待办任务、设备状态与快速操作入口。
 * 适用于 SaaS / 零售 / 餐饮门店管理场景。
 *
 * @example
 * <StoreManagerDashboard
 *   storeName="朝阳旗舰店"
 *   dailyMetrics={{ revenue: 52800, orderCount: 342, avgOrderValue: 154.4, newMembers: 12, revenueTrend: 5.2, orderTrend: -1.3, avgValueTrend: 3.1, memberTrend: 8.0 }}
 *   pendingTasks={[{ id: '1', title: 'SKU-089 库存不足', type: 'inventory', priority: 'high', createdAt: '10:45' }]}
 *   deviceStatus={{ total: 48, online: 42, offline: 3, warning: 3 }}
 *   quickActions={[{ key: 'scan', label: '扫码入库', primary: true }]}
 * />
 */
export function StoreManagerDashboard({
  dailyMetrics,
  pendingTasks,
  deviceStatus,
  quickActions,
  storeName,
  lastSyncAt,
  loading = false,
  compact = false,
  className,
}: StoreManagerDashboardProps) {
  if (loading) {
    return (
      <div className={className} style={{ padding: 24 }} data-testid="storedashboard-loading">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 14,
            marginBottom: 24,
          }}
        >
          {Array.from({ length: compact ? 2 : 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 88,
                borderRadius: 12,
                background: 'rgba(15,23,42,0.3)',
                border: '1px solid rgba(148,163,184,0.08)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          正在加载门店数据...
        </div>
      </div>
    );
  }

  // ---- 构建统计数据 ----

  const metricItems: QuickStatItem[] = dailyMetrics
    ? [
        {
          label: '今日营收',
          value: `¥${fmtCurrency(dailyMetrics.revenue)}`,
          helper: `同比 ${fmtTrend(dailyMetrics.revenueTrend)}`,
          valueColor: dailyMetrics.revenueTrend >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '订单数',
          value: dailyMetrics.orderCount,
          helper: `同比 ${fmtTrend(dailyMetrics.orderTrend)}`,
          valueColor: dailyMetrics.orderTrend >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '客单价',
          value: `¥${dailyMetrics.avgOrderValue.toFixed(1)}`,
          helper: `同比 ${fmtTrend(dailyMetrics.avgValueTrend)}`,
          valueColor: dailyMetrics.avgValueTrend >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '新增会员',
          value: dailyMetrics.newMembers,
          helper: `同比 ${fmtTrend(dailyMetrics.memberTrend)}`,
          valueColor: dailyMetrics.memberTrend >= 0 ? '#4ade80' : '#f87171',
        },
      ]
    : [
        { label: '营收', value: '--' },
        { label: '订单', value: '--' },
        { label: '客单价', value: '--' },
        { label: '新会员', value: '--' },
      ];

  // ---- 设备状态条 ----

  const renderDeviceBar = () => {
    if (!deviceStatus) return null;
    const onlinePct = deviceStatus.total > 0
      ? ((deviceStatus.online / deviceStatus.total) * 100).toFixed(0)
      : '0';
    return (
      <div style={DEVICE_BAR_STYLE}>
        <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
          设备状态
        </span>
        <span style={{ fontSize: 13, color: '#e2e8f0' }}>
          总计 {deviceStatus.total}
        </span>
        <StatusBadge
          label={`在线 ${deviceStatus.online}`}
          variant="success"
          size="sm"
        />
        {deviceStatus.offline > 0 && (
          <StatusBadge
            label={`离线 ${deviceStatus.offline}`}
            variant="error"
            size="sm"
          />
        )}
        {deviceStatus.warning > 0 && (
          <StatusBadge
            label={`告警 ${deviceStatus.warning}`}
            variant="warning"
            size="sm"
          />
        )}
        <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
          在线率 {onlinePct}%
        </span>
        {deviceStatus.lastCheckAt && (
          <span style={{ fontSize: 11, color: '#475569' }}>
            · {deviceStatus.lastCheckAt}
          </span>
        )}
      </div>
    );
  };

  // ---- 快速操作栏 ----

  const renderQuickActions = () => {
    if (!quickActions || quickActions.length === 0) return null;
    return (
      <div style={ACTION_BAR_STYLE}>
        {quickActions.map((action) => (
          <button
            key={action.key}
            type="button"
            style={action.primary ? PRIMARY_ACTION_STYLE : ACTION_BUTTON_STYLE}
            onClick={action.onClick}
          >
            {action.icon && <span style={{ marginRight: 6 }}>{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  // ---- 待办任务列表 ----

  const renderTasks = () => {
    if (!pendingTasks || pendingTasks.length === 0) {
      return (
        <div
          style={{
            padding: '24px 0',
            textAlign: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
        >
          暂无待办任务
        </div>
      );
    }

    if (compact) {
      return (
        <div>
          {pendingTasks.slice(0, 5).map((task) => {
            const pm = priorityMeta(task.priority);
            return (
              <div key={task.id} style={TASK_CARD_STYLE}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    [{taskTypeLabel(task.type)}]
                  </span>
                  <span style={{ fontSize: 13, color: '#e2e8f0' }}>
                    {task.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge
                    label={pm.label}
                    variant={pm.variant}
                    size="sm"
                  />
                  <span style={{ fontSize: 11, color: '#475569' }}>
                    {task.createdAt}
                  </span>
                </div>
              </div>
            );
          })}
          {pendingTasks.length > 5 && (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, paddingTop: 8 }}>
              ... 还有 {pendingTasks.length - 5} 条待办
            </div>
          )}
        </div>
      );
    }

    return (
      <DataTable
        columns={TASK_COLUMNS}
        rows={pendingTasks}
        rowKey={(task: PendingTask) => task.id}
        compact
        emptyText="暂无待办任务"
      />
    );
  };

  // ---- 组装渲染 ----

  return (
    <div
      className={className}
      style={{
        padding: compact ? 16 : 24,
        color: '#f8fafc',
      }}
      data-testid="storedashboard-root"
    >
      {/* ---- 头部 ---- */}
      <div style={HEADER_WRAPPER_STYLE}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }} data-testid="storedashboard-title">
            {storeName ?? '店长工作台'}
          </h2>
          {lastSyncAt && (
            <span style={{ fontSize: 11, color: '#475569', marginTop: 4, display: 'inline-block' }}>
              数据同步: {lastSyncAt}
            </span>
          )}
        </div>
      </div>

      {/* ---- 运营指标 ---- */}
      <div style={SECTION_STYLE}>
        <QuickStats
          items={metricItems}
          columns={compact ? 2 : 4}
          gap={compact ? 10 : 14}
          padding={compact ? 14 : 18}
        />
      </div>

      {/* ---- 快速操作 ---- */}
      <div data-testid="storedashboard-quick-actions">
      {renderQuickActions()}
      </div>

      {/* ---- 设备状态 ---- */}
      {deviceStatus && (
      <div data-testid="storedashboard-device-status">
      {renderDeviceBar()}
      </div>
      )}

      {/* ---- 待办任务 ---- */}
      <div style={SECTION_STYLE} data-testid="storedashboard-tasks">
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>
            待办任务
            {pendingTasks && pendingTasks.length > 0 && (
              <span style={{ ...SECTION_SUBTITLE_STYLE, marginLeft: 8 }}>
                ({pendingTasks.length})
              </span>
            )}
          </span>
        </div>
        {renderTasks()}
      </div>
    </div>
  );
}
