'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 回访任务优先级 */
export type FollowUpPriority = 'urgent' | 'high' | 'medium' | 'low';

/** 回访任务状态 */
export type FollowUpTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

/** 回访分类 */
export type FollowUpCategory = 'birthday' | 'renewal' | 'visit' | 'complaint' | 'survey' | 'promotion' | 'general';

/** 回访记录 */
export interface FollowUpRecord {
  /** 会员姓名 */
  memberName: string;
  /** 会员手机号 */
  memberPhone: string;
  /** 会员等级 */
  memberTier?: string;
  /** 任务标题 */
  title: string;
  /** 任务描述 */
  description: string;
  /** 优先级 */
  priority: FollowUpPriority;
  /** 状态 */
  status: FollowUpTaskStatus;
  /** 回访分类 */
  category: FollowUpCategory;
  /** 截止日期 */
  dueDate: string;
  /** 分配人 */
  assignee: string;
  /** 备注 */
  note?: string;
  /** 上次回访时间 */
  lastContactDate?: string;
}

// ==================== 优先级映射 ====================

const priorityLabel: Record<FollowUpPriority, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

const priorityColor: Record<FollowUpPriority, string> = {
  urgent: 'var(--color-danger, #e53e3e)',
  high: 'var(--color-warning, #dd6b20)',
  medium: 'var(--color-info, #3182ce)',
  low: 'var(--color-muted, #a0aec0)',
};

const categoryLabel: Record<FollowUpCategory, string> = {
  birthday: '生日关怀',
  renewal: '续费提醒',
  visit: '到店回访',
  complaint: '投诉跟进',
  survey: '满意度调查',
  promotion: '活动推广',
  general: '常规回访',
};

const statusLabel: Record<FollowUpTaskStatus, string> = {
  pending: '待处理',
  in_progress: '处理中',
  completed: '已完成',
  skipped: '已跳过',
};

const statusColor: Record<FollowUpTaskStatus, string> = {
  pending: 'var(--color-muted, #a0aec0)',
  in_progress: 'var(--color-info, #3182ce)',
  completed: 'var(--color-success, #38a169)',
  skipped: 'var(--color-muted-light, #cbd5e0)',
};

// ==================== 样式 ====================

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'var(--bg-card, #fff)',
    borderRadius: '12px',
    border: '1px solid var(--border-color, #e2e8f0)',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color, #e2e8f0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary, #1a202c)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerBadge: {
    fontSize: '12px',
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: '10px',
    background: 'var(--color-danger-light, #fff5f5)',
    color: 'var(--color-danger, #e53e3e)',
  },
  summaryRow: {
    display: 'flex',
    gap: '16px',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border-color, #e2e8f0)',
    background: 'var(--bg-subtle, #f7fafc)',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  summaryCount: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary, #1a202c)',
  },
  summaryLabel: {
    fontSize: '11px',
    color: 'var(--text-muted, #718096)',
  },
  list: {
    padding: '0',
    margin: '0',
    listStyle: 'none',
  },
  listItem: {
    padding: '14px 20px',
    borderBottom: '1px solid var(--border-color, #e2e8f0)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  priorityDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: '5px',
  },
  taskContent: {
    flex: 1,
    minWidth: 0,
  },
  taskHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  taskTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary, #1a202c)',
  },
  taskCategory: {
    fontSize: '11px',
    padding: '1px 6px',
    borderRadius: '4px',
    background: 'var(--bg-tag, #edf2f7)',
    color: 'var(--text-muted, #718096)',
  },
  taskMember: {
    fontSize: '13px',
    color: 'var(--text-primary, #2d3748)',
    marginBottom: '2px',
  },
  taskMeta: {
    fontSize: '12px',
    color: 'var(--text-muted, #718096)',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  taskActions: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
  },
  actionBtn: {
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid var(--border-color, #e2e8f0)',
    background: 'var(--bg-card, #fff)',
    cursor: 'pointer',
    color: 'var(--text-primary, #2d3748)',
  },
  actionBtnPrimary: {
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '6px',
    border: 'none',
    background: 'var(--color-primary, #3182ce)',
    color: '#fff',
    cursor: 'pointer',
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center',
    color: 'var(--text-muted, #718096)',
    fontSize: '14px',
  },
};

// ==================== 工具函数 ====================

function formatPhone(phone: string): string {
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}****${phone.slice(7)}`;
  }
  return phone.length > 6 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone;
}

function getDaysUntil(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDueLabel(days: number): string {
  if (days < 0) return `已逾期 ${Math.abs(days)} 天`;
  if (days === 0) return '今天截止';
  if (days === 1) return '明天截止';
  return `剩余 ${days} 天`;
}

// ==================== 主组件 ====================

export interface MemberFollowUpTaskPanelProps {
  /** 导购/前台姓名 */
  staffName: string;
  /** 今日待完成任务列表 */
  tasks: FollowUpRecord[];
  /** 总待处理数 */
  totalPending?: number;
  /** 今日已完成数 */
  completedToday?: number;
  /** 逾期任务数 */
  overdueCount?: number;
  /** 开始回访回调 */
  onStartFollowUp?: (task: FollowUpRecord) => void;
  /** 标记完成回调 */
  onMarkComplete?: (task: FollowUpRecord) => void;
  /** 跳过回调 */
  onSkip?: (task: FollowUpRecord) => void;
  /** 查看更多回调 */
  onViewAll?: () => void;
}

export function MemberFollowUpTaskPanel({
  staffName,
  tasks,
  totalPending = tasks.length,
  completedToday = 0,
  overdueCount = 0,
  onStartFollowUp,
  onMarkComplete,
  onSkip,
  onViewAll,
}: MemberFollowUpTaskPanelProps) {
  const pendingCount = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const displayTasks = tasks.slice(0, 5);

  return (
    <div style={styles.container} data-testid="member-followup-task-panel">
      {/* 头部 */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <span>📋 回访任务</span>
          <span style={styles.headerBadge}>{pendingCount} 待处理</span>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted, #718096)' }}>
          {staffName}
        </span>
      </div>

      {/* 统计条 */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryCount}>{totalPending}</span>
          <span style={styles.summaryLabel}>待处理</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryCount}>{completedToday}</span>
          <span style={styles.summaryLabel}>今日完成</span>
        </div>
        {overdueCount > 0 && (
          <div style={styles.summaryItem}>
            <span style={{ ...styles.summaryCount, color: 'var(--color-danger, #e53e3e)' }}>
              {overdueCount}
            </span>
            <span style={styles.summaryLabel}>逾期</span>
          </div>
        )}
      </div>

      {/* 任务列表 */}
      {displayTasks.length === 0 ? (
        <div style={styles.empty}>
          🎉 暂无待处理的回访任务
        </div>
      ) : (
        <ul style={styles.list}>
          {displayTasks.map((task, idx) => {
            const days = getDaysUntil(task.dueDate);
            const isOverdue = days < 0;
            return (
              <li key={`${task.memberPhone}-${task.category}-${idx}`} style={styles.listItem}>
                {/* 优先级色点 */}
                <div style={{ ...styles.priorityDot, background: priorityColor[task.priority] }} />

                {/* 任务内容 */}
                <div style={styles.taskContent}>
                  <div style={styles.taskHeader}>
                    <span style={styles.taskTitle}>{task.title}</span>
                    <span style={styles.taskCategory}>{categoryLabel[task.category]}</span>
                    {task.memberTier && (
                      <span style={{ fontSize: '11px', color: 'var(--color-warning, #dd6b20)' }}>
                        {task.memberTier}
                      </span>
                    )}
                  </div>
                  <div style={styles.taskMember}>
                    {task.memberName} | {formatPhone(task.memberPhone)}
                  </div>
                  <div style={styles.taskMeta}>
                    <span style={{ color: isOverdue ? 'var(--color-danger, #e53e3e)' : undefined }}>
                      {getDueLabel(days)}
                    </span>
                    <span>{task.assignee}</span>
                    {task.description && <span title={task.description}>{task.description.slice(0, 20)}...</span>}
                  </div>

                  {/* 操作按钮 */}
                  {task.status !== 'completed' && task.status !== 'skipped' && (
                    <div style={styles.taskActions}>
                      <button
                        style={styles.actionBtnPrimary}
                        onClick={() => onStartFollowUp?.(task)}
                        type="button"
                      >
                        开始回访
                      </button>
                      <button
                        style={styles.actionBtn}
                        onClick={() => onMarkComplete?.(task)}
                        type="button"
                      >
                        标记完成
                      </button>
                      <button
                        style={styles.actionBtn}
                        onClick={() => onSkip?.(task)}
                        type="button"
                      >
                        跳过
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 查看更多 */}
      {onViewAll && tasks.length > 5 && (
        <div style={{ padding: '10px 20px', textAlign: 'center', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
          <button
            onClick={onViewAll}
            type="button"
            style={{
              fontSize: '13px',
              color: 'var(--color-primary, #3182ce)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            查看全部 {tasks.length} 个任务 →
          </button>
        </div>
      )}
    </div>
  );
}

export default MemberFollowUpTaskPanel;
