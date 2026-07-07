'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';
import { Tag } from './Tag';

// ---- 类型定义 ----

/** 排班/人员状态 */
export interface StaffScheduleEntry {
  id: string;
  name: string;
  role: string;
  /** 今日排班时段 */
  shift: string;
  /** 出勤状态 */
  attendance: 'on_time' | 'late' | 'absent' | 'leave' | 'finished';
  /** 今日业绩 (销售额) */
  todaySales?: number;
  /** 会员拉新数 */
  newMembers?: number;
  /** 服务评分 (1-5) */
  serviceScore?: number;
  /** 头像/代号 */
  avatar?: string;
}

/** 培训进度 */
export interface TrainingProgress {
  id: string;
  title: string;
  /** 参与人数 */
  enrolledCount: number;
  /** 完成人数 */
  completedCount: number;
  /** 截止日期 */
  deadline: string;
  /** 状态 */
  status: 'in_progress' | 'pending' | 'completed' | 'overdue';
}

/** 服务质量汇总 */
export interface QualityMetrics {
  /** 今日评价数 */
  totalReviews: number;
  /** 好评率 (0-100) */
  positiveRate: number;
  /** 差评数 */
  negativeCount: number;
  /** 待处理投诉 */
  pendingComplaints: number;
  /** 服务达标率 (0-100) */
  serviceCompliance: number;
  /** 神秘顾客评分 (0-100) */
  mysteryShopperScore?: number;
}

/** 交接班概览 */
export interface ShiftHandover {
  /** 当前班次 */
  currentShift: string;
  /** 交接事项目录 */
  items: HandoverItem[];
}

/** 交接事项 */
export interface HandoverItem {
  id: string;
  category: 'revenue' | 'inventory' | 'personnel' | 'device' | 'member' | 'other';
  summary: string;
  priority: 'high' | 'medium' | 'low';
  resolved: boolean;
}

/** 助理经理操作 */
export interface AsstQuickAction {
  key: string;
  label: string;
  icon?: string;
  primary?: boolean;
  onClick?: () => void;
}

/** 门店副店长/助理经理工作台 Props */
export interface AssistantManagerDashboardProps {
  /** 门店名称 */
  storeName?: string;
  /** 助理经理姓名 */
  assistantName?: string;
  /** 今日员工排班 & 考勤 */
  staffSchedules?: StaffScheduleEntry[];
  /** 培训任务进度 */
  trainingItems?: TrainingProgress[];
  /** 服务质量指标 */
  qualityMetrics?: QualityMetrics;
  /** 交接班事项 */
  handover?: ShiftHandover;
  /** 快速操作 */
  quickActions?: AsstQuickAction[];
  /** 人事运营汇总 */
  peopleSummary?: {
    totalStaff: number;
    onDuty: number;
    onLeave: number;
    trainingRate: number;
  };
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

const HANDOVER_CARD_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  borderRadius: 10,
  background: 'rgba(15,23,42,0.28)',
  border: '1px solid rgba(148,163,184,0.10)',
  marginBottom: 6,
};

const STAFF_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderRadius: 8,
  background: 'rgba(15,23,42,0.18)',
  marginBottom: 4,
  fontSize: 12,
};

// ---- 工具函数 ----

function attendanceMeta(
  att: StaffScheduleEntry['attendance'],
): { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' } {
  switch (att) {
    case 'on_time':
      return { label: '在岗', variant: 'success' };
    case 'late':
      return { label: '迟到', variant: 'warning' };
    case 'absent':
      return { label: '缺勤', variant: 'error' };
    case 'leave':
      return { label: '请假', variant: 'info' };
    case 'finished':
      return { label: '已下班', variant: 'neutral' };
  }
}

function handoverCategoryLabel(cat: HandoverItem['category']): string {
  const map: Record<HandoverItem['category'], string> = {
    revenue: '营收',
    inventory: '库存',
    personnel: '人员',
    device: '设备',
    member: '会员',
    other: '其他',
  };
  return map[cat] ?? cat;
}

function priorityTagMeta(
  p: HandoverItem['priority'],
): { label: string; variant: 'error' | 'warning' | 'default' } {
  switch (p) {
    case 'high':
      return { label: '重要', variant: 'error' };
    case 'medium':
      return { label: '一般', variant: 'warning' };
    case 'low':
      return { label: '普通', variant: 'default' };
  }
}

function trainingStatusMeta(
  s: TrainingProgress['status'],
): { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' } {
  switch (s) {
    case 'in_progress':
      return { label: '进行中', variant: 'info' };
    case 'pending':
      return { label: '待开始', variant: 'neutral' };
    case 'completed':
      return { label: '已完成', variant: 'success' };
    case 'overdue':
      return { label: '已超期', variant: 'error' };
  }
}

// ---- 列配置 ----

const TRAINING_COLUMNS: DataTableColumn<TrainingProgress>[] = [
  {
    key: 'title',
    header: '培训课程',
    width: '150px',
    render: (row) => (
      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{row.title}</span>
    ),
  },
  {
    key: 'progress',
    header: '进度',
    width: '100px',
    render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            width: 60,
            height: 6,
            borderRadius: 3,
            background: 'rgba(148,163,184,0.15)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${
                row.enrolledCount > 0
                  ? Math.round((row.completedCount / row.enrolledCount) * 100)
                  : 0
              }%`,
              height: '100%',
              borderRadius: 3,
              background:
                row.status === 'overdue'
                  ? '#ef4444'
                  : row.status === 'completed'
                  ? '#22c55e'
                  : '#3b82f6',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>
          {row.completedCount}/{row.enrolledCount}
        </span>
      </div>
    ),
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
    key: 'status',
    header: '状态',
    width: '72px',
    render: (row) => {
      const m = trainingStatusMeta(row.status);
      return <StatusBadge label={m.label} variant={m.variant} size="sm" />;
    },
  },
];

// ---- 主组件 ----

/**
 * AssistantManagerDashboard — 门店副店长/助理经理工作台
 *
 * 面向门店二把手角色，聚合人员排班考勤、培训进度、服务质量监控、交接班管理等核心工作。
 * 适用于零售门店 / 餐饮连锁 / 服务门店的管理场景。
 *
 * @example
 * <AssistantManagerDashboard
 *   storeName="朝阳旗舰店"
 *   assistantName="王强"
 *   peopleSummary={{ totalStaff: 28, onDuty: 16, onLeave: 3, trainingRate: 72 }}
 *   staffSchedules={[...]}
 *   qualityMetrics={{ totalReviews: 86, positiveRate: 94.2, negativeCount: 2, pendingComplaints: 1, serviceCompliance: 91.5 }}
 *   trainingItems={[...]}
 *   handover={{ currentShift: '早班', items: [...] }}
 *   quickActions={[{ key: 'schedule', label: '排班管理', primary: true }]}
 * />
 */
export function AssistantManagerDashboard({
  storeName,
  assistantName,
  staffSchedules,
  trainingItems,
  qualityMetrics,
  handover,
  quickActions,
  peopleSummary,
  lastSyncAt,
  loading = false,
  compact = false,
  className,
}: AssistantManagerDashboardProps) {
  // ---- 加载态 ----
  if (loading) {
    return (
      <div className={className} style={{ padding: 24 }} data-testid="asstmgr-loading">
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
          正在加载门店人事数据...
        </div>
      </div>
    );
  }

  // ---- 构建人员统计卡片 ----

  const metricItems: QuickStatItem[] = peopleSummary
    ? [
        {
          label: '在编员工',
          value: peopleSummary.totalStaff,
          helper: `${peopleSummary.onDuty} 人在岗`,
          valueColor: '#60a5fa',
        },
        {
          label: '今日在岗',
          value: peopleSummary.onDuty,
          helper: `请假 ${peopleSummary.onLeave} 人`,
          valueColor: '#4ade80',
        },
        {
          label: '培训完成率',
          value: `${peopleSummary.trainingRate}%`,
          helper: peopleSummary.trainingRate >= 80 ? '达标 ✓' : '待加强',
          valueColor: peopleSummary.trainingRate >= 80 ? '#4ade80' : '#facc15',
        },
      ]
    : [
        { label: '在编员工', value: '--' },
        { label: '今日在岗', value: '--' },
        { label: '培训完成率', value: '--' },
      ];

  // ---- 快速操作栏 ----

  const renderQuickActions = () => {
    if (!quickActions || quickActions.length === 0) return null;
    return (
      <div style={ACTION_BAR_STYLE} data-testid="asstmgr-quick-actions">
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

  // ---- 员工排班考勤 ----

  const renderStaffSchedules = () => {
    if (!staffSchedules || staffSchedules.length === 0) {
      return (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          暂无排班信息
        </div>
      );
    }

    const list = compact ? staffSchedules.slice(0, 5) : staffSchedules;

    return (
      <div>
        {list.map((staff) => {
          const att = attendanceMeta(staff.attendance);
          return (
            <div key={staff.id} style={STAFF_ROW_STYLE}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(59,130,246,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#93c5fd',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {staff.avatar || staff.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                    {staff.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{staff.role} · {staff.shift}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {staff.todaySales !== undefined && (
                  <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 500 }}>
                    ¥{staff.todaySales}
                  </span>
                )}
                {staff.serviceScore !== undefined && (
                  <span style={{ fontSize: 11, color: '#facc15' }}>
                    {'★'.repeat(Math.round(staff.serviceScore))}
                  </span>
                )}
                <StatusBadge label={att.label} variant={att.variant} size="sm" dot />
              </div>
            </div>
          );
        })}
        {!compact && staffSchedules.length > list.length && (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: 11, paddingTop: 6 }}>
            ... 还有 {staffSchedules.length - list.length} 人
          </div>
        )}
      </div>
    );
  };

  // ---- 服务质量卡片 ----

  const renderQualityMetrics = () => {
    if (!qualityMetrics) return null;

    const cols = compact ? 2 : 4;

    const items: QuickStatItem[] = [
      {
        label: '好评率',
        value: `${qualityMetrics.positiveRate}%`,
        helper: `今日 ${qualityMetrics.totalReviews} 条评价`,
        valueColor:
          qualityMetrics.positiveRate >= 95
            ? '#4ade80'
            : qualityMetrics.positiveRate >= 85
            ? '#facc15'
            : '#f87171',
      },
      {
        label: '服务达标率',
        value: `${qualityMetrics.serviceCompliance}%`,
        valueColor:
          qualityMetrics.serviceCompliance >= 90
            ? '#4ade80'
            : qualityMetrics.serviceCompliance >= 80
            ? '#facc15'
            : '#f87171',
      },
      {
        label: '待处理投诉',
        value: qualityMetrics.pendingComplaints,
        valueColor: qualityMetrics.pendingComplaints > 0 ? '#f87171' : '#4ade80',
      },
      {
        label: '差评',
        value: qualityMetrics.negativeCount,
        valueColor: qualityMetrics.negativeCount > 0 ? '#f87171' : '#94a3b8',
      },
    ];

    if (qualityMetrics.mysteryShopperScore !== undefined) {
      items.push({
        label: '神秘顾客评分',
        value: `${qualityMetrics.mysteryShopperScore}`,
        helper: qualityMetrics.mysteryShopperScore >= 90 ? '优秀' : qualityMetrics.mysteryShopperScore >= 75 ? '良好' : '待改善',
        valueColor:
          qualityMetrics.mysteryShopperScore >= 90
            ? '#4ade80'
            : qualityMetrics.mysteryShopperScore >= 75
            ? '#facc15'
            : '#f87171',
      });
    }

    return (
      <div style={SECTION_STYLE} data-testid="asstmgr-quality">
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>服务质量监控</span>
        </div>
        <QuickStats items={items} columns={cols} gap={10} padding={14} />
      </div>
    );
  };

  // ---- 培训进度表格 ----

  const renderTrainingSection = () => {
    if (!trainingItems || trainingItems.length === 0) {
      return (
        <div style={SECTION_STYLE}>
          <div style={SECTION_HEADER_STYLE}>
            <span style={SECTION_TITLE_STYLE}>培训任务</span>
          </div>
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            暂无培训任务
          </div>
        </div>
      );
    }

    return (
      <div style={SECTION_STYLE} data-testid="asstmgr-training">
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>
            培训任务
            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, fontWeight: 400 }}>
              ({trainingItems.length})
            </span>
          </span>
        </div>
        <DataTable
          columns={TRAINING_COLUMNS}
          rows={trainingItems}
          rowKey={(t) => t.id}
          compact
          emptyText="暂无培训任务"
        />
      </div>
    );
  };

  // ---- 交接班事项 ----

  const renderHandover = () => {
    if (!handover || handover.items.length === 0) return null;

    return (
      <div style={SECTION_STYLE} data-testid="asstmgr-handover">
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>
            交接班事项
            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, fontWeight: 400 }}>
              ·
              {' '}
              {handover.currentShift}
            </span>
          </span>
        </div>
        {handover.items.slice(0, 5).map((item) => {
          const pm = priorityTagMeta(item.priority);
          return (
            <div key={item.id} style={HANDOVER_CARD_STYLE}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Tag variant={pm.variant} size="sm">
                  {handoverCategoryLabel(item.category)}
                </Tag>
                <span
                  style={{
                    fontSize: 13,
                    color: item.resolved ? '#64748b' : '#e2e8f0',
                    textDecoration: item.resolved ? 'line-through' : 'none',
                  }}
                >
                  {item.summary}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusBadge label={pm.label} variant={pm.variant} size="sm" />
                {item.resolved && (
                  <StatusBadge label="已处理" variant="neutral" size="sm" />
                )}
              </div>
            </div>
          );
        })}
        {handover.items.length > 5 && (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: 11, paddingTop: 6 }}>
            ... 还有 {handover.items.length - 5} 项
          </div>
        )}
      </div>
    );
  };

  // ---- 人员排班区域 ----

  const renderStaffSection = () => {
    if (!staffSchedules) return null;

    return (
      <div style={SECTION_STYLE} data-testid="asstmgr-staff">
        <div style={SECTION_HEADER_STYLE}>
          <span style={SECTION_TITLE_STYLE}>
            今日排班考勤
            {staffSchedules.length > 0 && (
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, fontWeight: 400 }}>
                ({staffSchedules.length} 人)
              </span>
            )}
          </span>
        </div>
        {renderStaffSchedules()}
      </div>
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
      data-testid="asstmgr-root"
    >
      {/* ---- 头部 ---- */}
      <div style={HEADER_WRAPPER_STYLE}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }} data-testid="asstmgr-title">
            {storeName ?? '门店'} · 助理经理工作台
          </h2>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' as const }}>
            {assistantName && (
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                负责人: {assistantName}
              </span>
            )}
            {lastSyncAt && (
              <span style={{ fontSize: 11, color: '#475569' }}>
                同步: {lastSyncAt}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ---- 人员统计 ---- */}
      <div style={SECTION_STYLE}>
        <QuickStats items={metricItems} columns={compact ? 3 : 3} gap={12} padding={16} />
      </div>

      {/* ---- 快速操作 ---- */}
      {renderQuickActions()}

      {/* ---- 服务质量 ---- */}
      {renderQualityMetrics()}

      {/* ---- 员工排班 ---- */}
      {renderStaffSection()}

      {/* ---- 培训任务 ---- */}
      {renderTrainingSection()}

      {/* ---- 交接班 ---- */}
      {renderHandover()}
    </div>
  );
}
