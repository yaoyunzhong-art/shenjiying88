'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 区域门店概况 */
export interface RegionStoreSnapshot {
  id: string;
  name: string;
  /** 所在城市 */
  city: string;
  /** 经营状态 */
  status: 'operating' | 'closed_today' | 'paused' | 'offline';
  /** 今日营收 */
  todayRevenue: number;
  /** 营收达标率 (0-100) */
  revenueRate: number;
  /** 会员增长 */
  memberGrowth: number;
  /** 本月KPI完成率 */
  monthlyKpiRate: number;
  /** 活跃告警 */
  alertCount: number;
  /** 在岗人数 */
  staffOnDuty: number;
}

/** 区域汇总指标 */
export interface RegionalSummary {
  /** 管辖区域数 */
  totalRegions: number;
  /** 管辖门店总数 */
  totalStores: number;
  /** 营业中门店 */
  operatingStores: number;
  /** 今日总营收 */
  totalRevenue: number;
  /** 营收周环比 */
  revenueWoW: number;
  /** 总会员增长 */
  totalMemberGrowth: number;
  /** 会员增长周环比 */
  memberWoW: number;
  /** 平均KPI达成率 */
  avgKpiRate: number;
  /** 待处理告警 */
  pendingAlerts: number;
  /** 告警趋势 (- 表示好转) */
  alertTrend: number;
}

/** 区域经理快速动作 */
export interface RegionalQuickAction {
  key: string;
  label: string;
  icon?: string;
  primary?: boolean;
  onClick?: () => void;
}

/** 月度目标进度 */
export interface MonthlyTarget {
  label: string;
  current: number;
  target: number;
  unit?: string;
}

/** 区域经理工作台 Props */
export interface RegionalManagerDashboardProps {
  /** 区域汇总指标 */
  regionalSummary?: RegionalSummary;
  /** 门店概览列表 */
  stores?: RegionStoreSnapshot[];
  /** 月度目标进度 */
  monthlyTargets?: MonthlyTarget[];
  /** 快速操作 */
  quickActions?: RegionalQuickAction[];
  /** 经理名称 */
  managerName?: string;
  /** 管辖大区名称 */
  regionName?: string;
  /** 最后同步时间 */
  lastSyncAt?: string;
  /** 加载中 */
  loading?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ---- 样式常量 ----

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

const HEADER_WRAPPER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 18,
  flexWrap: 'wrap' as const,
  gap: 10,
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
  background: 'rgba(139,92,246,0.18)',
  borderColor: 'rgba(139,92,246,0.35)',
  color: '#c4b5fd',
};

const TARGET_BAR_WRAPPER: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
};

const TARGET_CARD_STYLE: React.CSSProperties = {
  background: 'rgba(15,23,42,0.3)',
  border: '1px solid rgba(148,163,184,0.1)',
  borderRadius: 12,
  padding: '14px 16px',
};

const PROGRESS_BAR_TRACK: React.CSSProperties = {
  height: 6,
  borderRadius: 3,
  background: 'rgba(148,163,184,0.15)',
  marginTop: 8,
  overflow: 'hidden',
};

// ---- 工具函数 ----

function fmtCurrency(value: number): string {
  if (Math.abs(value) >= 10000) {
    return (value / 10000).toFixed(1) + '万';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + 'k';
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
  status: RegionStoreSnapshot['status'],
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

function progressColor(ratio: number): string {
  if (ratio >= 0.8) return '#a78bfa';
  if (ratio >= 0.5) return '#facc15';
  return '#f87171';
}

// ---- 列配置 ----

const STORE_COLUMNS: DataTableColumn<RegionStoreSnapshot>[] = [
  {
    key: 'name',
    header: '门店',
    width: '120px',
    render: (row) => (
      <div>
        <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{row.name}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{row.city}</div>
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
    width: '70px',
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
    key: 'memberGrowth',
    header: '会员增',
    width: '64px',
    render: (row) => (
      <span style={{ fontSize: 13, color: row.memberGrowth >= 0 ? '#4ade80' : '#f87171' }}>
        {row.memberGrowth >= 0 ? '+' : ''}{row.memberGrowth}
      </span>
    ),
  },
  {
    key: 'alertCount',
    header: '告警',
    width: '56px',
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
    width: '50px',
    render: (row) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{row.staffOnDuty}</span>
    ),
  },
];

// ---- 主组件 ----

/**
 * RegionalManagerDashboard — 区域经理工作台
 *
 * 面向大区/区域经理角色，聚合跨区域汇总指标、各门店业绩对比、月度目标进度追踪。
 * 适用于连锁管理、区域督导、多店运营场景。
 *
 * @example
 * <RegionalManagerDashboard
 *   managerName="王强"
 *   regionName="华北区"
 *   regionalSummary={...}
 *   stores={[...]}
 *   monthlyTargets={[...]}
 * />
 */
export function RegionalManagerDashboard({
  regionalSummary,
  stores,
  monthlyTargets,
  quickActions,
  managerName,
  regionName,
  lastSyncAt,
  loading = false,
  compact = false,
  className,
}: RegionalManagerDashboardProps) {
  if (loading) {
    return (
      <div
        className={className}
        data-testid="regionaldash-loading"
        style={{ padding: 24 }}
      >
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
          正在加载区域数据...
        </div>
      </div>
    );
  }

  // ---- 构建汇总指标 ----

  const metricItems: QuickStatItem[] = regionalSummary
    ? [
        {
          label: '管辖范围',
          value: `${regionalSummary.totalRegions}区${regionalSummary.totalStores}店`,
          helper: `营业中 ${regionalSummary.operatingStores}`,
          valueColor: '#a78bfa',
        },
        {
          label: '今日总营收',
          value: `¥${fmtCurrency(regionalSummary.totalRevenue)}`,
          helper: `周环比 ${fmtTrend(regionalSummary.revenueWoW)}`,
          valueColor: regionalSummary.revenueWoW >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '会员增长',
          value: `${regionalSummary.totalMemberGrowth}`,
          helper: `周环比 ${fmtTrend(regionalSummary.memberWoW)}`,
          valueColor: regionalSummary.memberWoW >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '平均KPI达成',
          value: fmtRate(regionalSummary.avgKpiRate),
          helper: '月度综合',
          valueColor: regionalSummary.avgKpiRate >= 80 ? '#4ade80' : regionalSummary.avgKpiRate >= 60 ? '#facc15' : '#f87171',
        },
        {
          label: '待处理告警',
          value: regionalSummary.pendingAlerts,
          helper: `趋势 ${fmtTrend(regionalSummary.alertTrend)}`,
          valueColor: regionalSummary.pendingAlerts === 0 ? '#4ade80' : regionalSummary.alertTrend <= 0 ? '#facc15' : '#f87171',
        },
      ]
    : [
        { label: '管辖范围', value: '--' },
        { label: '总营收', value: '--' },
        { label: '会员增长', value: '--' },
        { label: 'KPI达成', value: '--' },
        { label: '告警', value: '--' },
      ];

  // ---- 月度目标进度条 ----

  const renderTargets = () => {
    if (!monthlyTargets || monthlyTargets.length === 0) return null;
    return (
      <div style={{ ...SECTION_STYLE, marginTop: 0 }}>
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>月度目标进度</span>
        </div>
        <div style={TARGET_BAR_WRAPPER}>
          {monthlyTargets.map((t, i) => {
            const ratio = t.target > 0 ? Math.min(t.current / t.target, 1) : 0;
            const pct = (ratio * 100).toFixed(0);
            return (
              <div key={i} style={TARGET_CARD_STYLE}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.label}</span>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: progressColor(ratio),
                  }}>
                    {pct}%
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {t.current.toLocaleString()}{t.unit ?? ''} / {t.target.toLocaleString()}{t.unit ?? ''}
                </div>
                <div style={PROGRESS_BAR_TRACK}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: 3,
                      background: progressColor(ratio),
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ---- 快速操作 ----

  const renderQuickActions = () => {
    if (!quickActions || quickActions.length === 0) return null;
    return (
      <div style={ACTION_BAR_STYLE} data-testid="regionaldash-quick-actions">
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

  // ---- 门店概览 ----

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

  // ---- 组装 ----

  return (
    <div
      className={className}
      data-testid="regionaldash-root"
      style={{
        padding: compact ? 16 : 24,
        color: '#f8fafc',
      }}
    >
      {/* 头部 */}
      <div style={HEADER_WRAPPER_STYLE}>
        <div>
          <h2
            data-testid="regionaldash-title"
            style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }}
          >
            {regionName ? `${regionName} · ` : ''}区域经理工作台
          </h2>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' as const }}>
            {managerName && (
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                经理: {managerName}
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

      {/* 汇总指标 */}
      <div style={SECTION_STYLE}>
        <QuickStats
          items={metricItems}
          columns={compact ? 2 : 5}
          gap={compact ? 10 : 12}
          padding={compact ? 14 : 16}
        />
      </div>

      {/* 快速操作 */}
      {renderQuickActions()}

      {/* 月度目标进度 */}
      {renderTargets()}

      {/* 门店概览 */}
      <div style={SECTION_STYLE}>
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>
            门店概览
            {stores && stores.length > 0 && (
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, fontWeight: 400 }}>
                ({stores.length})
              </span>
            )}
          </span>
        </div>
        {renderStoresTable()}
      </div>
    </div>
  );
}
