'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 今日服务指标 */
export interface GuideDailyMetrics {
  /** 接待人次 */
  guestCount: number;
  /** 游玩时长 (分钟) */
  avgPlayDuration: number;
  /** 满意度评分 (1-5) */
  satisfactionScore: number;
  /** 引导转化 (引导办卡/充值) */
  conversionCount: number;
  /** 同比变化 */
  guestTrend: number;
  durationTrend: number;
  satisfactionTrend: number;
  conversionTrend: number;
}

/** 当前接待任务 */
export interface GuestTask {
  id: string;
  /** 客人年龄组: 儿童/青少年/成人/家庭 */
  guestType: 'child' | 'teen' | 'adult' | 'family';
  /** 客人数量 */
  guestCount: number;
  /** 游玩区域 / 项目 */
  area: string;
  /** 状态 */
  status: 'accompanying' | 'waiting' | 'completed';
  /** 开始时间 */
  startedAt: string;
  /** 备注 */
  note?: string;
}

/** 游玩区域状态 */
export interface AreaStatus {
  id: string;
  name: string;
  /** 当前游客数 */
  currentGuests: number;
  /** 最大容量 */
  capacity: number;
  /** 排队人数 */
  queueLength: number;
  /** 是否需要清洁/维护 */
  needsMaintenance: boolean;
  /** 设备运行状态 */
  deviceOnline: boolean;
}

/** 道具/玩具借用 */
export interface PropRental {
  id: string;
  propName: string;
  borrowedAt: string;
  expectedReturnAt: string;
  guestName: string;
  status: 'active' | 'overdue' | 'returned';
}

/** 导玩员工作台 Props */
export interface EntertainmentGuideDashboardProps {
  /** 今日服务指标 */
  dailyMetrics?: GuideDailyMetrics;
  /** 当前接待任务 */
  guestTasks?: GuestTask[];
  /** 区域状态 */
  areaStatuses?: AreaStatus[];
  /** 道具借用 */
  propRentals?: PropRental[];
  /** 导玩员姓名 */
  guideName?: string;
  /** 当班区域 */
  assignedArea?: string;
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

const AREA_CARD_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderRadius: 10,
  background: 'rgba(15,23,42,0.28)',
  border: '1px solid rgba(148,163,184,0.10)',
  marginBottom: 8,
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
  flexWrap: 'wrap' as const,
  gap: 8,
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

/** 客人类型标签 */
function guestTypeLabel(t: GuestTask['guestType']): string {
  const map: Record<GuestTask['guestType'], string> = {
    child: '👶 儿童',
    teen: '🧑 青少年',
    adult: '🧑‍💼 成人',
    family: '👨‍👩‍👧‍👦 家庭',
  };
  return map[t] ?? t;
}

/** 任务状态标签 */
function taskStatusMeta(status: GuestTask['status']): { label: string; variant: 'info' | 'warning' | 'success' } {
  switch (status) {
    case 'accompanying':
      return { label: '陪同中', variant: 'info' };
    case 'waiting':
      return { label: '待接待', variant: 'warning' };
    case 'completed':
      return { label: '已完成', variant: 'success' };
  }
}

/** 道具借用状态标签 */
function rentalStatusMeta(status: PropRental['status']): { label: string; variant: 'success' | 'error' | 'neutral' } {
  switch (status) {
    case 'active':
      return { label: '使用中', variant: 'success' };
    case 'overdue':
      return { label: '逾期', variant: 'error' };
    case 'returned':
      return { label: '已归还', variant: 'neutral' };
  }
}

/** 格式化百分比 */
function fmtPct(used: number, total: number): string {
  if (total === 0) return '0%';
  return ((used / total) * 100).toFixed(0) + '%';
}

/** 格式化趋势 */
function fmtTrend(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

// ---- 列配置 ----

const PROP_COLUMNS: DataTableColumn<PropRental>[] = [
  {
    key: 'propName',
    header: '道具名称',
    render: (row) => (
      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{row.propName}</span>
    ),
  },
  {
    key: 'guestName',
    header: '客人',
    render: (row) => (
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{row.guestName}</span>
    ),
  },
  {
    key: 'status',
    header: '状态',
    width: '80px',
    render: (row) => {
      const m = rentalStatusMeta(row.status);
      return <StatusBadge label={m.label} variant={m.variant} size="sm" />;
    },
  },
  {
    key: 'borrowedAt',
    header: '借用时间',
    width: '90px',
    render: (row) => (
      <span style={{ fontSize: 11, color: '#64748b' }}>{row.borrowedAt}</span>
    ),
  },
];

// ---- 主组件 ----

/**
 * EntertainmentGuideDashboard — 导玩员工作台
 *
 * 聚合导玩员日常所需的核心服务指标、接待任务、区域状态与道具管理。
 * 适用于室内儿童乐园 / 游乐场等场景的导玩员角色。
 *
 * @example
 * <EntertainmentGuideDashboard
 *   guideName="王小明"
 *   assignedArea="淘气堡区"
 *   dailyMetrics={{ guestCount: 68, avgPlayDuration: 42, satisfactionScore: 4.8, conversionCount: 5, guestTrend: 12.3, durationTrend: -2.1, satisfactionTrend: 0.3, conversionTrend: 25.0 }}
 *   guestTasks={[{ id: '1', guestType: 'family', guestCount: 3, area: '淘气堡', status: 'accompanying', startedAt: '10:30' }]}
 * />
 */
export function EntertainmentGuideDashboard({
  dailyMetrics,
  guestTasks,
  areaStatuses,
  propRentals,
  guideName,
  assignedArea,
  lastSyncAt,
  loading = false,
  compact = false,
  className,
}: EntertainmentGuideDashboardProps) {
  if (loading) {
    return (
      <div className={className} style={{ padding: 24 }} data-testid="guidedashboard-loading">
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
          正在加载导玩数据...
        </div>
      </div>
    );
  }

  // ---- 构建统计数据 ----

  const metricItems: QuickStatItem[] = dailyMetrics
    ? [
        {
          label: '接待人次',
          value: dailyMetrics.guestCount,
          helper: `同比 ${fmtTrend(dailyMetrics.guestTrend)}`,
          valueColor: dailyMetrics.guestTrend >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '平均游玩',
          value: `${dailyMetrics.avgPlayDuration}min`,
          helper: `同比 ${fmtTrend(dailyMetrics.durationTrend)}`,
          valueColor: dailyMetrics.durationTrend >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '满意评分',
          value: dailyMetrics.satisfactionScore.toFixed(1),
          helper: `同比 ${fmtTrend(dailyMetrics.satisfactionTrend)}`,
          valueColor: dailyMetrics.satisfactionTrend >= 0 ? '#4ade80' : '#f87171',
        },
        {
          label: '转化数',
          value: dailyMetrics.conversionCount,
          helper: `同比 ${fmtTrend(dailyMetrics.conversionTrend)}`,
          valueColor: dailyMetrics.conversionTrend >= 0 ? '#4ade80' : '#f87171',
        },
      ]
    : [
        { label: '接待', value: '--' },
        { label: '时长', value: '--' },
        { label: '评分', value: '--' },
        { label: '转化', value: '--' },
      ];

  // ---- 区域状态 ----

  const renderAreaStatuses = () => {
    if (!areaStatuses || areaStatuses.length === 0) {
      return (
        <div style={{ padding: '16px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          暂无区域数据
        </div>
      );
    }
    return (
      <div>
        {areaStatuses.map((area) => {
          const loadPct = fmtPct(area.currentGuests, area.capacity);
          return (
            <div key={area.id} style={AREA_CARD_STYLE}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                    {area.name}
                  </span>
                  {!area.deviceOnline && (
                    <StatusBadge label="离线" variant="error" size="sm" />
                  )}
                  {area.needsMaintenance && (
                    <StatusBadge label="维护" variant="warning" size="sm" />
                  )}
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  容量 {loadPct} ({area.currentGuests}/{area.capacity})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {area.queueLength > 0 && (
                  <StatusBadge
                    label={`排队 ${area.queueLength}`}
                    variant={area.queueLength > 5 ? 'error' : 'warning'}
                    size="sm"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ---- 接待任务 ----

  const renderGuestTasks = () => {
    if (!guestTasks || guestTasks.length === 0) {
      return (
        <div style={{ padding: '16px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          当前无接待任务
        </div>
      );
    }

    return (
      <div>
        {guestTasks.map((task) => {
          const sm = taskStatusMeta(task.status);
          return (
            <div key={task.id} style={TASK_CARD_STYLE}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14 }}>{guestTypeLabel(task.guestType)}</span>
                <span style={{ fontSize: 13, color: '#e2e8f0' }}>
                  {task.guestCount}人 · {task.area}
                </span>
                {task.note && (
                  <span style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.note}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusBadge label={sm.label} variant={sm.variant} size="sm" />
                <span style={{ fontSize: 11, color: '#475569' }}>{task.startedAt}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ---- 道具管理 ----

  const renderPropRentals = () => {
    if (!propRentals || propRentals.length === 0) {
      return (
        <div style={{ padding: '16px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          无道具借用记录
        </div>
      );
    }

    if (compact) {
      return (
        <div>
          {propRentals.slice(0, 4).map((r) => {
            const sm = rentalStatusMeta(r.status);
            return (
              <div key={r.id} style={TASK_CARD_STYLE}>
                <span style={{ fontSize: 13, color: '#e2e8f0' }}>{r.propName}</span>
                <StatusBadge label={sm.label} variant={sm.variant} size="sm" />
                <span style={{ fontSize: 11, color: '#475569' }}>{r.borrowedAt}</span>
              </div>
            );
          })}
          {propRentals.length > 4 && (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, paddingTop: 6 }}>
              +{propRentals.length - 4} 更多
            </div>
          )}
        </div>
      );
    }

    return (
      <DataTable
        columns={PROP_COLUMNS}
        rows={propRentals}
        rowKey={(r: PropRental) => r.id}
        compact
        emptyText="无道具借用记录"
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
      data-testid="guidedashboard-root"
    >
      {/* ---- 头部 ---- */}
      <div style={HEADER_WRAPPER_STYLE}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }} data-testid="guidedashboard-title">
            {guideName ? `${guideName} 工作台` : '导玩员工作台'}
          </h2>
          {(assignedArea || lastSyncAt) && (
            <div style={{ marginTop: 4, display: 'flex', gap: 12, alignItems: 'center' }}>
              {assignedArea && (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  当前区域: {assignedArea}
                </span>
              )}
              {lastSyncAt && (
                <span style={{ fontSize: 11, color: '#475569' }}>
                  同步: {lastSyncAt}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---- 服务指标 ---- */}
      <div style={SECTION_STYLE} data-testid="guidedashboard-metrics">
        <QuickStats
          items={metricItems}
          columns={compact ? 2 : 4}
          gap={compact ? 10 : 14}
          padding={compact ? 14 : 18}
        />
      </div>

      {/* ---- 接待任务 ---- */}
      <div style={SECTION_STYLE} data-testid="guidedashboard-tasks">
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>
            接待任务
            {guestTasks && guestTasks.length > 0 && (
              <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>
                ({guestTasks.length})
              </span>
            )}
          </span>
        </div>
        {renderGuestTasks()}
      </div>

      {/* ---- 区域状态 ---- */}
      <div style={SECTION_STYLE} data-testid="guidedashboard-areas">
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>区域状态</span>
        </div>
        {renderAreaStatuses()}
      </div>

      {/* ---- 道具管理 ---- */}
      {propRentals && propRentals.length > 0 && (
        <div style={SECTION_STYLE} data-testid="guidedashboard-props">
          <div style={SECTION_HEADER_STYLE}>
            <span style={SECTION_TITLE_STYLE}>
              道具借用
              <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>
                ({propRentals.length})
              </span>
            </span>
          </div>
          {renderPropRentals()}
        </div>
      )}
    </div>
  );
}
