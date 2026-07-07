'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';
import type { InspectionItemStatus } from './InspectionChecklist';

// ---- 类型定义 ----

/** 检查分类 */
export type InspectionCategory = 'environment' | 'device' | 'staff' | 'safety' | 'hygiene';

/** 检查任务状态 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

/** 质量问题严重度 */
export type IssueSeverity = 'critical' | 'major' | 'minor';

/** 巡检区域 */
export interface InspectionArea {
  id: string;
  name: string;
  /** 待检项总数 */
  total: number;
  /** 已通过 */
  passed: number;
  /** 不合格 */
  failed: number;
  /** 通过率 */
  passRate: number;
}

/** 待处理问题 */
export interface QualityIssue {
  id: string;
  title: string;
  area: string;
  severity: IssueSeverity;
  status: InspectionItemStatus;
  reporter: string;
  createdAt: string;
  deadline: string;
  description?: string;
}

/** 今日质检指标 */
export interface InspectorDailyMetrics {
  /** 今日检查门店数 */
  storeCount: number;
  /** 检查总项数 */
  totalItems: number;
  /** 通过项 */
  passedItems: number;
  /** 不合格项 */
  failedItems: number;
  /** 整体通过率 (%) */
  passRate: number;
  /** 发现重大问题数 */
  criticalIssues: number;
}

/** 今日检查任务 */
export interface InspectionTask {
  id: string;
  storeName: string;
  area: string;
  status: TaskStatus;
  checkedCount: number;
  totalCount: number;
  scheduledAt: string;
  priority: 'normal' | 'urgent';
  deadline: string;
}

/** 质检员工作台 Props */
export interface QualityInspectorDashboardProps {
  /** 今日质检指标 */
  dailyMetrics?: InspectorDailyMetrics;
  /** 今日检查任务列表 */
  tasks?: InspectionTask[];
  /** 待处理质量问题 */
  issues?: QualityIssue[];
  /** 区域巡检概况 */
  areas?: InspectionArea[];
  /** 质检员姓名 */
  inspectorName?: string;
  /** 工号 */
  employeeId?: string;
  /** 负责区域 */
  region?: string;
  /** 最后同步时间 */
  lastSyncAt?: string;
  /** 加载中 */
  loading?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 点击开始检查 */
  onStartInspection?: (taskId: string) => void;
  /** 点击处理问题 */
  onHandleIssue?: (issueId: string) => void;
  /** 点击查看详情 */
  onViewTaskDetail?: (taskId: string) => void;
  /** 点击上报问题 */
  onReportIssue?: (issueId: string) => void;
}

// ---- 默认样式 ----

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 24,
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 12,
  color: '#1a1a2e',
};

const CARD: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,.06)',
  padding: 16,
};

const HEADER_BAR: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
};

const HEADER_INFO: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const AVATAR: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #43a047, #66bb6a)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 700,
  fontSize: 18,
};

const ONLINE_BADGE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
  background: '#e8f5e9',
  color: '#2e7d32',
};

const TASK_CARD: React.CSSProperties = {
  ...CARD,
  marginBottom: 8,
  border: '1px solid #eee',
};

const ISSUE_ITEM: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid #f0f0f0',
};

const SEVERITY_DOT: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  marginTop: 6,
  flexShrink: 0,
};

const ACTION_BUTTON_BASE: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'default',
  border: 'none',
};

const PRIMARY_BTN: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  background: '#43a047',
  color: '#fff',
};

const OUTLINE_BTN: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  background: '#f5f5f5',
  color: '#333',
  border: '1px solid #ddd',
};

const DANGER_BTN: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  background: '#fce4ec',
  color: '#c62828',
};

const AREA_ROW: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid #f5f5f5',
};

const PROGRESS_BAR_OUTER: React.CSSProperties = {
  width: 80,
  height: 6,
  borderRadius: 3,
  background: '#eee',
  overflow: 'hidden',
};

// ---- 状态映射 ----

const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  critical: '#c62828',
  major: '#f57c00',
  minor: '#fdd835',
};

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  critical: '严重',
  major: '主要',
  minor: '轻微',
};

const TASK_STATUS_MAP: Record<TaskStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'error' }> = {
  pending: { label: '待检查', variant: 'warning' },
  in_progress: { label: '检查中', variant: 'info' },
  completed: { label: '已完成', variant: 'success' },
  overdue: { label: '已逾期', variant: 'error' },
};

const ISSUE_STATUS_MAP: Record<InspectionItemStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'error' | 'neutral' }> = {
  pending: { label: '待处理', variant: 'warning' },
  fail: { label: '不合格', variant: 'error' },
  pass: { label: '已整改', variant: 'success' },
};

const AREA_LABELS: Record<InspectionCategory | string, string> = {
  environment: '环境',
  device: '设备',
  staff: '人员',
  safety: '安全',
  hygiene: '卫生',
};

// ---- 组件 ----

/**
 * 质量巡检员工作台
 *
 * 为质量巡检/品控人员提供每日检查概览、任务管理和问题跟踪功能。
 */
export const QualityInspectorDashboard: React.FC<QualityInspectorDashboardProps> = ({
  dailyMetrics,
  tasks,
  issues,
  areas,
  inspectorName = '质检员',
  employeeId,
  region,
  lastSyncAt,
  loading = false,
  compact = false,
  className,
  onStartInspection,
  onHandleIssue,
  onViewTaskDetail,
  onReportIssue,
}) => {
  if (loading) {
    return (
      <div style={{ padding: 16 }} className={className} data-testid="quality-inspector-dashboard-loading">
        <div style={{ height: 44, background: '#f0f0f0', borderRadius: 8, marginBottom: 16 }} />
        <div style={{ height: 80, background: '#f0f0f0', borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 80, background: '#f0f0f0', borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 120, background: '#f0f0f0', borderRadius: 8 }} />
      </div>
    );
  }

  // ── 统计指标 ──
  const statItems: QuickStatItem[] = dailyMetrics
    ? [
        { label: '检查门店', value: dailyMetrics.storeCount, trend: 0 },
        { label: '检查项', value: dailyMetrics.totalItems, trend: 0 },
        { label: '通过', value: dailyMetrics.passedItems, trend: dailyMetrics.passRate > 90 ? dailyMetrics.passRate : -Math.abs(100 - dailyMetrics.passRate) },
        { label: '不合格', value: dailyMetrics.failedItems, trend: dailyMetrics.failedItems > 0 ? -Math.abs(dailyMetrics.failedItems) : 0 },
        { label: '通过率', value: `${Math.round(dailyMetrics.passRate)}%`, trend: 0 },
        { label: '重大问题', value: dailyMetrics.criticalIssues, trend: dailyMetrics.criticalIssues > 0 ? -Math.abs(dailyMetrics.criticalIssues) : 0 },
      ]
    : [];

  // ── 紧急任务 ──
  const urgentTasks = tasks?.filter((t) => t.priority === 'urgent' && t.status !== 'completed') || [];

  // ── 任务表格列 ──
  const taskColumns: DataTableColumn<InspectionTask>[] = [
    { key: 'storeName', header: '门店', width: compact ? '80' : '100' },
    {
      key: 'area',
      header: '区域',
      width: compact ? '60' : '80',
      render: (row) => AREA_LABELS[row.area] || row.area,
    },
    {
      key: 'status',
      header: '状态',
      width: compact ? '60' : '80',
      render: (row) => {
        const s = TASK_STATUS_MAP[row.status] || { label: row.status, variant: 'neutral' as const };
        return <StatusBadge variant={s.variant} label={s.label} />;
      },
    },
    {
      key: 'checkedCount',
      header: '进度',
      width: compact ? '60' : '80',
      render: (row) => `${row.checkedCount}/${row.totalCount}`,
    },
    {
      key: 'deadline',
      header: '截止',
      width: compact ? '60' : '80',
    },
    {
      key: 'actions',
      header: compact ? '' : '操作',
      width: compact ? '50' : '120',
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {row.status === 'pending' && (
            <button style={PRIMARY_BTN} onClick={() => onStartInspection?.(row.id)}>开始</button>
          )}
          {row.status === 'in_progress' && (
            <button style={OUTLINE_BTN} onClick={() => onViewTaskDetail?.(row.id)}>继续</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} className={className}>
      {/* ── 质检员信息头部 ── */}
      <div style={HEADER_BAR}>
        <div style={HEADER_INFO}>
          <div style={AVATAR}>
            {inspectorName.charAt(0)}
          </div>
          <div>
            <div data-testid="qualityinspector-title" style={{ fontWeight: 600, fontSize: 16 }}>
              质检员工作台
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
              {inspectorName}
              {employeeId && ` · ${employeeId}`}
              {region && ` · ${region}`}
            </div>
          </div>
        </div>
        <div>
          <span style={ONLINE_BADGE}>🟢 在岗</span>
        </div>
      </div>

      {/* ── 统计数据 ── */}
      {dailyMetrics && (
        <div style={SECTION_STYLE}>
          <div style={SECTION_TITLE}>今日质检概览</div>
          <QuickStats items={statItems} columns={compact ? 2 : 3} />
        </div>
      )}

      {/* ── 紧急检查任务 ── */}
      {urgentTasks.length > 0 && (
        <div style={SECTION_STYLE}>
          <div style={{ ...SECTION_TITLE, color: '#c62828' }}>🔴 紧急检查任务 ({urgentTasks.length})</div>
          {urgentTasks.map((task) => (
            <div key={task.id} style={{ ...TASK_CARD, borderLeft: '3px solid #c62828' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{task.storeName}</span>
                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500, background: '#fce4ec', color: '#c62828' }}>
                  紧急
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                {AREA_LABELS[task.area] || task.area} · 进度 {task.checkedCount}/{task.totalCount}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>截止: {task.deadline}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button style={PRIMARY_BTN} onClick={() => onStartInspection?.(task.id)}>开始检查</button>
                <button style={OUTLINE_BTN} onClick={() => onViewTaskDetail?.(task.id)}>详情</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 区域巡检概况 ── */}
      {areas && areas.length > 0 && (
        <div style={SECTION_STYLE}>
          <div style={SECTION_TITLE}>区域巡检概况</div>
          <div style={CARD}>
            {areas.map((area) => (
              <div key={area.id} style={AREA_ROW}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{AREA_LABELS[area.name] || area.name}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    {area.passed}/{area.total} 通过 · {area.failed} 不合格
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={PROGRESS_BAR_OUTER}>
                    <div
                      style={{
                        height: '100%',
                        width: `${area.passRate}%`,
                        borderRadius: 3,
                        background: area.passRate >= 90 ? '#4caf50' : area.passRate >= 70 ? '#f57c00' : '#c62828',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{Math.round(area.passRate)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 待处理问题 ── */}
      {issues && issues.length > 0 && (
        <div style={SECTION_STYLE}>
          <div style={{ ...SECTION_TITLE, color: '#c62828' }}>
            待处理质量问题 ({issues.filter((i) => i.status === 'pending' || i.status === 'fail').length})
          </div>
          <div style={CARD}>
            {issues.map((issue) => (
              <div key={issue.id} style={ISSUE_ITEM}>
                <div style={{ ...SEVERITY_DOT, background: SEVERITY_COLORS[issue.severity] }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{issue.title}</span>
                    <span style={{ fontSize: 11, color: SEVERITY_COLORS[issue.severity], fontWeight: 500 }}>
                      {SEVERITY_LABELS[issue.severity]}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {issue.area} · {issue.reporter} · {issue.createdAt}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    截止: {issue.deadline}
                  </div>
                  {issue.description && (
                    <div style={{ fontSize: 12, color: '#555', marginTop: 4, background: '#f9f9f9', padding: '6px 8px', borderRadius: 6 }}>
                      {issue.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {issue.status === 'pending' && (
                      <button style={DANGER_BTN} onClick={() => onHandleIssue?.(issue.id)}>处理</button>
                    )}
                    <button style={OUTLINE_BTN} onClick={() => onReportIssue?.(issue.id)}>上报</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 检查任务列表 ── */}
      {tasks && tasks.length > 0 && (
        <div style={SECTION_STYLE}>
          <div style={SECTION_TITLE}>今日检查任务</div>
          <DataTable
            data={tasks}
            columns={taskColumns}
            rowKey={(task: InspectionTask) => task.id}
            compact={compact}
          />
        </div>
      )}

      {/* ── 空状态 ── */}
      {!tasks && !issues && !dailyMetrics && (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div>暂无质检任务</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>今日检查数据将在任务分配后显示</div>
        </div>
      )}

      {/* ── 底部同步时间 ── */}
      {lastSyncAt && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#ccc', padding: '12px 0' }}>
          数据同步于 {lastSyncAt}
        </div>
      )}
    </div>
  );
};

// Re-export with unique names to avoid conflicts with other modules
/** @deprecated Use QualityInspectionTask instead - conflicts with OperationsManagerDashboard */
export type QualityInspectionTask = InspectionTask;
/** @deprecated Use QcTaskStatus instead - conflicts with other modules */
export type QcTaskStatus = TaskStatus;

export default QualityInspectorDashboard;
