/**
 * StoreDailyOperationsPanel — 门店日常运营面板（店长工作台）
 *
 * 功能:
 * - 今日核心指标概览（营收 / 订单数 / 客流量 / 客单价）
 * - 待办任务列表（异常告警 / 审核 / 交接事项）
 * - 当班员工状态
 * - 快速操作入口（收银 / 盘点 / 调货 / 会员查询）
 *
 * 使用场景:
 * - 店长每日登陆首屏
 * - 门店管理后台运营面板
 * - 权限角色: store_manager
 */
'use client';

import React from 'react';
import { Badge } from './Badge';
import type { BadgeVariant } from './Badge';

// ---- 类型定义 ----

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type StaffStatus = 'on_duty' | 'break' | 'off_duty';

export interface DailyMetric {
  label: string;
  value: string;
  unit?: string;
  change: number; // 较昨日百分比
  trend: 'up' | 'down' | 'neutral';
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt?: string;
  from?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: StaffStatus;
  avatar?: string;
}

export interface StoreDailyOperationsPanelProps {
  /** 门店名称 */
  storeName: string;
  /** 当前日期 ISO 字符串 */
  date: string;
  /** 今日指标 */
  metrics: DailyMetric[];
  /** 待办任务 */
  tasks: TaskItem[];
  /** 当班员工 */
  staffOnDuty: StaffMember[];
  /** 快速操作按钮配置 */
  quickActions?: { label: string; icon?: string; onClick: () => void }[];
  /** 任务点击回调 */
  onTaskClick?: (taskId: string) => void;
  /** 员工点击回调 */
  onStaffClick?: (staffId: string) => void;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 自定义类名 */
  className?: string;
}

// ---- 样式常量 ----

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; variant: BadgeVariant }> = {
  high: { label: '紧急', variant: 'danger' },
  medium: { label: '重要', variant: 'warning' },
  low: { label: '普通', variant: 'info' },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#f59e0b' },
  in_progress: { label: '处理中', color: '#3b82f6' },
  completed: { label: '已完成', color: '#22c55e' },
};

const STAFF_STATUS_CONFIG: Record<StaffStatus, { label: string; color: string; dotColor: string }> = {
  on_duty: { label: '在岗', color: '#22c55e', dotColor: '#22c55e' },
  break: { label: '休息', color: '#f59e0b', dotColor: '#f59e0b' },
  off_duty: { label: '已下班', color: '#94a3b8', dotColor: '#94a3b8' },
};

const TREND_ARROW: Record<string, string> = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

const TREND_COLOR: Record<string, string> = {
  up: '#22c55e',
  down: '#ef4444',
  neutral: '#94a3b8',
};

/** 格式化日期为中文 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`;
}

function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// ---- 内联样式 ----

const S: Record<string, React.CSSProperties> = {
  container: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    background: '#fff',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: 2 },
  storeName: { fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 },
  dateText: { fontSize: 13, color: '#94a3b8' },
  refreshBtn: {
    border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px',
    background: '#fff', fontSize: 13, color: '#64748b', cursor: 'pointer',
    fontWeight: 500, transition: 'background 0.15s',
  },
  sectionTitle: {
    fontSize: 14, fontWeight: 600, color: '#334155', margin: 0, marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12,
  },
  metricCard: {
    border: '1px solid #f1f5f9', borderRadius: 10, padding: '12px 14px',
    background: '#fafbfc',
  },
  metricLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  metricValueRow: { display: 'flex', alignItems: 'baseline', gap: 6 },
  metricValue: { fontSize: 22, fontWeight: 700, color: '#1e293b' },
  metricUnit: { fontSize: 13, color: '#94a3b8', fontWeight: 400 },
  metricChange: { fontSize: 12, fontWeight: 600, marginLeft: 'auto' },
  tasksSection: { display: 'flex', flexDirection: 'column', gap: 8 },
  taskItem: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 12px', borderRadius: 8, border: '1px solid #f1f5f9',
    cursor: 'pointer', transition: 'background 0.15s',
  },
  taskContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  taskTitleRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const },
  taskTitle: { fontSize: 14, fontWeight: 500, color: '#1e293b' },
  taskDesc: { fontSize: 12, color: '#64748b', lineHeight: 1.4 },
  taskMeta: { fontSize: 11, color: '#94a3b8', display: 'flex', gap: 12, flexWrap: 'wrap' as const },
  staffGrid: {
    display: 'flex', gap: 10, flexWrap: 'wrap' as const,
  },
  staffChip: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', borderRadius: 8, border: '1px solid #f1f5f9',
    cursor: 'pointer', transition: 'background 0.15s',
  },
  staffDot: {
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
  },
  staffInfo: { display: 'flex', flexDirection: 'column' as const, gap: 1 },
  staffName: { fontSize: 13, fontWeight: 500, color: '#1e293b' },
  staffRole: { fontSize: 11, color: '#94a3b8' },
  staffStatusLabel: { fontSize: 11, fontWeight: 500 },
  actionsRow: {
    display: 'flex', gap: 10, flexWrap: 'wrap' as const,
  },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
    background: '#fff', fontSize: 13, fontWeight: 500, color: '#475569',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  divider: { height: 1, background: '#f1f5f9', margin: '4px 0' },
  badgeIcon: { fontSize: 14 },
  emptyText: { fontSize: 13, color: '#94a3b8', padding: '8px 0' },
};

// ---- 子组件 ----

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function StatusIndicator({ status }: { status: TaskStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{ fontSize: 11, color: cfg.color, fontWeight: 500 }}>
      ● {cfg.label}
    </span>
  );
}

// ---- 主组件 ----

export function StoreDailyOperationsPanel({
  storeName,
  date,
  metrics,
  tasks,
  staffOnDuty,
  quickActions,
  onTaskClick,
  onStaffClick,
  onRefresh,
  className,
}: StoreDailyOperationsPanelProps) {
  const handleTaskClick = (taskId: string) => {
    onTaskClick?.(taskId);
  };

  const handleStaffClick = (staffId: string) => {
    onStaffClick?.(staffId);
  };

  return (
    <div className={className} style={S.container} role="region" aria-label={`${storeName} 运营面板`}>
      {/* 头部 */}
      <div style={S.headerRow}>
        <div style={S.headerLeft}>
          <h2 style={S.storeName}>{storeName}</h2>
          <span style={S.dateText}>{formatDate(date)}</span>
        </div>
        {onRefresh && (
          <button
            style={S.refreshBtn}
            onClick={onRefresh}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f1f5f9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
            aria-label="刷新数据"
          >
            ↻ 刷新
          </button>
        )}
      </div>

      {/* 核心指标 */}
      {metrics.length > 0 && (
        <section aria-label="今日核心指标">
          <h3 style={S.sectionTitle}>📊 今日数据概览</h3>
          <div style={S.metricsGrid}>
            {metrics.map((m, i) => (
              <div key={i} style={S.metricCard}>
                <div style={S.metricLabel}>{m.label}</div>
                <div style={S.metricValueRow}>
                  <span style={S.metricValue}>{m.value}</span>
                  {m.unit && <span style={S.metricUnit}>{m.unit}</span>}
                  <span style={{ ...S.metricChange, color: TREND_COLOR[m.trend] }}>
                    {TREND_ARROW[m.trend]} {formatChange(m.change)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={S.divider} />

      {/* 待办任务 */}
      <section aria-label="待办任务">
        <h3 style={S.sectionTitle}>📋 待办事项 ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p style={S.emptyText}>暂无待办事项 ✓</p>
        ) : (
          <div style={S.tasksSection}>
            {tasks.map((task) => {
              const statusCfg = STATUS_CONFIG[task.status];
              return (
                <div
                  key={task.id}
                  style={S.taskItem}
                  onClick={() => handleTaskClick(task.id)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#fafbfc';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTaskClick(task.id); }}
                  aria-label={`任务: ${task.title}`}
                >
                  <div style={S.taskContent}>
                    <div style={S.taskTitleRow}>
                      <span style={S.taskTitle}>{task.title}</span>
                      <PriorityBadge priority={task.priority} />
                      <StatusIndicator status={task.status} />
                    </div>
                    {task.description && <p style={S.taskDesc}>{task.description}</p>}
                    <div style={S.taskMeta}>
                      {task.from && <span>来自: {task.from}</span>}
                      {task.dueAt && <span>截止: {new Date(task.dueAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div style={S.divider} />

      {/* 当班员工 */}
      <section aria-label="当班员工">
        <h3 style={S.sectionTitle}>👥 在岗员工 ({staffOnDuty.length})</h3>
        {staffOnDuty.length === 0 ? (
          <p style={S.emptyText}>暂无在岗员工记录</p>
        ) : (
          <div style={S.staffGrid}>
            {staffOnDuty.map((staff) => {
              const stCfg = STAFF_STATUS_CONFIG[staff.status];
              return (
                <div
                  key={staff.id}
                  style={S.staffChip}
                  onClick={() => handleStaffClick(staff.id)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#fafbfc';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#fff';
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStaffClick(staff.id); }}
                  aria-label={`员工 ${staff.name} — ${stCfg.label}`}
                >
                  <div style={{ ...S.staffDot, background: stCfg.dotColor }} />
                  <div style={S.staffInfo}>
                    <span style={S.staffName}>{staff.name}</span>
                    <span style={S.staffRole}>{staff.role}</span>
                  </div>
                  <span style={{ ...S.staffStatusLabel, color: stCfg.color }}>{stCfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 快速操作 */}
      {quickActions && quickActions.length > 0 && (
        <>
          <div style={S.divider} />
          <section aria-label="快捷操作">
            <h3 style={S.sectionTitle}>⚡ 快捷操作</h3>
            <div style={S.actionsRow}>
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  style={S.actionBtn}
                  onClick={action.onClick}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#c7d2fe';
                    (e.currentTarget as HTMLElement).style.color = '#6366f1';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                    (e.currentTarget as HTMLElement).style.color = '#475569';
                  }}
                  aria-label={action.label}
                >
                  {action.icon && <span style={S.badgeIcon}>{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default StoreDailyOperationsPanel;
