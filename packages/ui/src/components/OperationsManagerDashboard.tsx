'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 辖区门店概览 */
export interface DistrictStoreSnapshot {
  id: string;
  name: string;
  /** 区域 */
  region: string;
  /** 门店状态 */
  status: 'operating' | 'closed_today' | 'paused' | 'offline';
  /** 今日营收 */
  todayRevenue: number;
  /** 营收达标率 (0-100) */
  revenueRate: number;
  /** 客流量 */
  visitorCount: number;
  /** 本月KPI完成率 */
  monthlyKpiRate: number;
  /** 活跃告警数 */
  alertCount: number;
  /** 在岗人数 */
  staffOnDuty: number;
  /** 上次巡检时间 */
  lastInspectionAt?: string;
}

/** 辖区汇总指标 */
export interface DistrictSummary {
  /** 管辖门店数 */
  totalStores: number;
  /** 营业中 */
  operatingStores: number;
  /** 今日总营收 */
  totalRevenue: number;
  /** 营收环比 (百分比点数) */
  revenueQoQ: number;
  /** 总客流量 */
  totalVisitors: number;
  /** 客流环比 */
  visitorsQoQ: number;
  /** 平均KPI达成率 */
  avgKpiRate: number;
  /** KPI环比 */
  kpiRateQoQ: number;
  /** 待处理告警总数 */
  pendingAlerts: number;
  /** 告警环比 */
  alertsQoQ: number;
}

/** 巡店任务 */
export interface InspectionTask {
  id: string;
  storeId: string;
  storeName: string;
  /** 巡检类型 */
  type: 'routine' | 'spot_check' | 'compliance' | 'hygiene' | 'device';
  /** 优先级 */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** 状态 */
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'overdue';
  /** 截止时间 */
  deadline: string;
  /** 指派人 */
  assignee?: string;
  /** 结果备注 */
  result?: string;
}

/** 快速动作 */
export interface OpsQuickAction {
  key: string;
  label: string;
  icon?: string;
  primary?: boolean;
  onClick?: () => void;
}

/** 运营主管工作台 Props */
export interface OperationsManagerDashboardProps {
  /** 辖区汇总指标 */
  districtSummary?: DistrictSummary;
  /** 辖区门店概览列表 */
  stores?: DistrictStoreSnapshot[];
  /** 巡店任务列表 */
  inspectionTasks?: InspectionTask[];
  /** 快速操作 */
  quickActions?: OpsQuickAction[];
  /** 运营主管名称 */
  managerName?: string;
  /** 管辖区域名称 */
  districtName?: string;
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

const SECTION_HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#f1f5f9',
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

const HEADER_WRAPPER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 18,
  flexWrap: 'wrap' as const,
  gap: 10,
};

// ---- 工具函数 ----

function fmtCurrency(value: number): string {
  if (Math.abs(value) >= 10000) {
    return (value / 10000).toFixed(1) + '万';
  }
  return value.toLocaleString('zh-CN');
}

function fmtTrend(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function fmtRate(rate: number): string {
  return rate.toFixed(1) + '%';
}

function storeStatusMeta(
  status: DistrictStoreSnapshot['status'],
): { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' } {
  switch (status) {
    case 'operating':
      return { label: '营业中', variant: 'success' };
    case 'closed_today':
      return { label: '今日休', variant: 'neutral' };
    case 'paused':
      return { label: '暂停', variant: 'warning' };
    case 'offline':
      return { label: '离线', variant: 'error' };
  }
}

function inspectionStatusMeta(
  status: InspectionTask['status'],
): { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' | 'info' } {
  switch (status) {
    case 'pending':
      return { label: '待处理', variant: 'neutral' };
    case 'assigned':
      return { label: '已指派', variant: 'info' };
    case 'in_progress':
      return { label: '巡检中', variant: 'info' };
    case 'completed':
      return { label: '已完成', variant: 'success' };
    case 'overdue':
      return { label: '已超期', variant: 'error' };
  }
}

function inspectionTypeLabel(type: InspectionTask['type']): string {
  const map: Record<InspectionTask['type'], string> = {
    routine: '常规巡店',
    spot_check: '突击检查',
    compliance: '合规审查',
    hygiene: '卫生检查',
    device: '设备巡检',
  };
  return map[type] ?? type;
}

function priorityMeta(
  priority: InspectionTask['priority'],
): { label: string; variant: 'error' | 'warning' | 'neutral' } {
  switch (priority) {
    case 'critical':
      return { label: '紧急', variant: 'error' };
    case 'high':
      return { label: '高', variant: 'error' };
    case 'medium':
      return { label: '中', variant: 'warning' };
    case 'low':
      return { label: '低', variant: 'neutral' };
  }
}

// ---- 列配置 ----

const STORE_COLUMNS: DataTableColumn<DistrictStoreSnapshot>[] = [
  {
    key: 'name',
    header: '门店',
    width: '130px',
    render: (row) => (
      <div>
        <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{row.name}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{row.region}</div>
      </div>
    ),
  },
  {
    key: 'status',
    header: '状态',
    width: '72px',
    render: (row) => {
      const m = storeStatusMeta(row.status);
      return <StatusBadge label={m.label} variant={m.variant} size="sm" />;
    },
  },
  {
    key: 'todayRevenue',
    header: '今日营收',
    width: '100px',
    render: (row) => (
      <div>
        <div style={{ fontSize: 13, color: '#e2e8f0' }}>¥{fmtCurrency(row.todayRevenue)}</div>
        <div style={{ fontSize: 11, color: row.revenueRate >= 80 ? '#4ade80' : '#f87171' }}>
          达标率 {fmtRate(row.revenueRate)}
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    key: 'monthlyKpiRate',
    header: 'KPI',
    width: '80px',
    render: (row) => (
      <span style={{
        fontSize: 13,
        color: row.monthlyKpiRate >= 80 ? '#4ade80' : row.monthlyKpiRate >= 60 ? '#facc15' : '#f87171',
        fontWeight: 600,
      }}>
        {fmtRate(row.monthlyKpiRate)}
      </span>
    ),
    sortable: true,
  },
  {
    key: 'alertCount',
    header: '告警',
    width: '60px',
    render: (row) => (
      row.alertCount > 0 ? (
        <StatusBadge label={`${row.alertCount}`} variant="error" size="sm" dot />
      ) : (
        <span style={{ fontSize: 12, color: '#475569' }}>0</span>
      )
    ),
  },
  {
    key: 'staffOnDuty',
    header: '在岗',
    width: '54px',
    render: (row) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{row.staffOnDuty}</span>
    ),
  },
];

const INSPECTION_COLUMNS: DataTableColumn<InspectionTask>[] = [
  {
    key: 'type',
    header: '类型',
    width: '80px',
    render: (row) => (
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{inspectionTypeLabel(row.type)}</span>
    ),
  },
  {
    key: 'storeName',
    header: '门店',
    width: '110px',
    render: (row) => (
      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{row.storeName}</span>
    ),
  },
  {
    key: 'priority',
    header: '优先级',
    width: '60px',
    render: (row) => {
      const m = priorityMeta(row.priority);
      return <StatusBadge label={m.label} variant={m.variant} size="sm" />;
    },
  },
  {
    key: 'status',
    header: '状态',
    width: '72px',
    render: (row) => {
      const m = inspectionStatusMeta(row.status);
      return <StatusBadge label={m.label} variant={m.variant} size="sm" />;
    },
  },
  {
    key: 'deadline',
    header: '截止',
    width: '80px',
    render: (row) => (
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{row.deadline}</span>
    ),
  },
  {
    key: 'assignee',
    header: '负责人',
    width: '74px',
    render: (row) => (
      <span style={{ fontSize: 12, color: row.assignee ? '#e2e8f0' : '#475569' }}>
        {row.assignee ?? '—'}
      </span>
    ),
  },
];

// ---- 主组件 ----

/**
 * OperationsManagerDashboard — 运营主管工作台
 *
 * 面向多门店运营主管角色，聚合辖区运营概览、门店KPI对比、巡店任务管理和快速操作入口。
 * 适用于连锁零售/SaaS多门店管理场景。
 *
 * @example
 * <OperationsManagerDashboard
 *   managerName="李明"
 *   districtName="华东区"
 *   districtSummary={{ totalStores: 12, operatingStores: 11, totalRevenue: 526800, revenueQoQ: 3.2, totalVisitors: 8420, visitorsQoQ: 5.1, avgKpiRate: 87.3, kpiRateQoQ: 2.8, pendingAlerts: 7, alertsQoQ: -12.5 }}
 *   stores={[{ id: 's1', name: '朝阳旗舰店', region: '北京', status: 'operating', todayRevenue: 52800, revenueRate: 92, visitorCount: 1280, monthlyKpiRate: 88.5, alertCount: 2, staffOnDuty: 8 }]}
 *   inspectionTasks={[{ id: 't1', storeId: 's1', storeName: '朝阳旗舰店', type: 'routine', priority: 'high', status: 'pending', deadline: '2026-06-23' }]}
 *   quickActions={[{ key: 'patrol', label: '发起巡店', primary: true }]}
 * />
 */
export function OperationsManagerDashboard({
  districtSummary,
  stores,
  inspectionTasks,
  quickActions,
  managerName,
  districtName,
  lastSyncAt,
  loading = false,
  compact = false,
  className,
}: OperationsManagerDashboardProps) {
  if (loading) {
    return (
      <div className={className} style={{ padding: 24 }}>
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
          正在加载运营数据...
        </div>
      </div>
    );
  }

  // ---- 构建统计卡片 ----

  const metricItems: QuickStatItem[] = districtSummary
    ? [
        {
          label: '管辖门店',
          value: `${districtSummary.operatingStores}/${districtSummary.totalStores}`,
          helper: '营业中 / 总计',
          valueColor: '#4ade80',
        },
        {
          label: '今日总营收',
          value: `¥${fmtCurrency(districtSummary.totalRevenue)}`,
          helper: `环比 ${fmtTrend(districtSummary.revenueQoQ)}`,
          valueColor: districtSummary.revenueQoQ >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '总客流量',
          value: districtSummary.totalVisitors.toLocaleString('zh-CN'),
          helper: `环比 ${fmtTrend(districtSummary.visitorsQoQ)}`,
          valueColor: districtSummary.visitorsQoQ >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '平均KPI达成',
          value: fmtRate(districtSummary.avgKpiRate),
          helper: `环比 ${fmtTrend(districtSummary.kpiRateQoQ)}`,
          valueColor: districtSummary.avgKpiRate >= 80 ? '#4ade80' : districtSummary.avgKpiRate >= 60 ? '#facc15' : '#f87171',
        },
        {
          label: '待处理告警',
          value: districtSummary.pendingAlerts,
          helper: `环比 ${fmtTrend(districtSummary.alertsQoQ)}`,
          valueColor: districtSummary.pendingAlerts === 0 ? '#4ade80' : districtSummary.alertsQoQ <= 0 ? '#facc15' : '#f87171',
        },
      ]
    : [
        { label: '管辖门店', value: '--' },
        { label: '总营收', value: '--' },
        { label: '客流量', value: '--' },
        { label: 'KPI达成', value: '--' },
        { label: '待处理告警', value: '--' },
      ];

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

  // ---- 门店概览表格 ----

  const renderStoresTable = () => {
    if (!stores || stores.length === 0) {
      return (
        <div
          style={{
            padding: '24px 0',
            textAlign: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
        >
          暂无门店数据
        </div>
      );
    }
    return (
      <DataTable
        columns={STORE_COLUMNS}
        rows={stores}
        rowKey={(s) => s.id}
        compact
        emptyText="暂无门店数据"
      />
    );
  };

  // ---- 巡店任务表格 ----

  const renderInspectionTable = () => {
    if (!inspectionTasks || inspectionTasks.length === 0) {
      return (
        <div
          style={{
            padding: '24px 0',
            textAlign: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
        >
          暂无巡店任务
        </div>
      );
    }
    return (
      <DataTable
        columns={INSPECTION_COLUMNS}
        rows={inspectionTasks}
        rowKey={(t) => t.id}
        compact
        emptyText="暂无巡店任务"
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
    >
      {/* ---- 头部 ---- */}
      <div style={HEADER_WRAPPER_STYLE}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>
            {districtName ? `${districtName} · ` : ''}运营主管工作台
          </h2>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' as const }}>
            {managerName && (
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                主管: {managerName}
              </span>
            )}
            {lastSyncAt && (
              <span style={{ fontSize: 11, color: '#475569' }}>
                数据同步: {lastSyncAt}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ---- 辖区运营指标 ---- */}
      <div style={SECTION_STYLE}>
        <QuickStats
          items={metricItems}
          columns={compact ? 2 : 5}
          gap={compact ? 10 : 12}
          padding={compact ? 14 : 16}
        />
      </div>

      {/* ---- 快速操作 ---- */}
      {renderQuickActions()}

      {/* ---- 辖区门店概览 ---- */}
      <div style={SECTION_STYLE}>
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>
            辖区门店概览
            {stores && stores.length > 0 && (
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, fontWeight: 400 }}>
                ({stores.length})
              </span>
            )}
          </span>
        </div>
        {renderStoresTable()}
      </div>

      {/* ---- 巡店任务 ---- */}
      <div style={SECTION_STYLE}>
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>
            巡店任务
            {inspectionTasks && inspectionTasks.length > 0 && (
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, fontWeight: 400 }}>
                ({inspectionTasks.length})
              </span>
            )}
          </span>
        </div>
        {renderInspectionTable()}
      </div>
    </div>
  );
}
