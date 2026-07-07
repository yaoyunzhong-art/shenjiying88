/**
 * 门店任务中心页 — Store Task Center (Next.js App Router Page)
 * 角色视角: 👔店长 / 🏪全体门店员工
 * 类型: D-角色操作界面
 * 功能: 门店所有待办任务聚合展示，按类型和优先级分组
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  PageShell,
  KanbanBoard,
  type KanbanColumn,
  type KanbanCard,
  StatusBadge,
  EmptyState,
  StatCard,
  useToast,
} from '@m5/ui';

// ── 类型 ──

type TaskType = 'inventory' | 'member' | 'device' | 'schedule' | 'alert';
type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
type TaskStatus = 'pending' | 'in_progress' | 'done';

interface Task {
  id: string;
  title: string;
  subtitle: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  tags: string[];
  createdAt: string;
}

const TYPE_LABELS: Record<TaskType, string> = {
  inventory: '库存',
  member: '会员',
  device: '设备',
  schedule: '排班',
  alert: '告警',
};

const TYPE_COLORS: Record<TaskType, 'info' | 'warning' | 'danger' | 'success' | 'neutral'> = {
  inventory: 'info',
  member: 'success',
  device: 'warning',
  schedule: 'neutral',
  alert: 'danger',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待处理',
  in_progress: '处理中',
  done: '已完成',
};

// ── Mock 数据 ──

function generateMockTasks(): Task[] {
  const now = new Date('2026-06-30');
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return [
    {
      id: 't-001', title: 'SKU-089 库存不足预警',
      subtitle: '经典款 T 恤库存仅剩 3 件，低于安全库存线 20 件',
      type: 'inventory', priority: 'critical', status: 'pending',
      assignee: '库房管理员', dueDate: fmt(now), tags: ['补货', '预警'], createdAt: fmt(new Date(now.getTime() - 86400000)),
    },
    {
      id: 't-002', title: '钻石会员张先生投诉跟进',
      subtitle: '会员反馈产品质量问题，需在 24 小时内回复',
      type: 'member', priority: 'high', status: 'in_progress',
      assignee: '客服主管', dueDate: fmt(new Date(now.getTime() + 86400000)), tags: ['投诉', '紧急'], createdAt: fmt(new Date(now.getTime() - 172800000)),
    },
    {
      id: 't-003', title: 'POS-02 打印机缺纸',
      subtitle: '2 号收银台打印机缺纸，需补充热敏纸',
      type: 'device', priority: 'high', status: 'pending',
      assignee: '前台主管', dueDate: fmt(now), tags: ['耗材', '收银'], createdAt: fmt(new Date(now.getTime() - 43200000)),
    },
    {
      id: 't-004', title: '晚班排班表待确认',
      subtitle: '7 月 1 日晚班排班表尚未确认，现有 2 人未分配',
      type: 'schedule', priority: 'medium', status: 'pending',
      assignee: '店长', dueDate: fmt(new Date(now.getTime() + 86400000)), tags: ['排班', '晚班'], createdAt: fmt(new Date(now.getTime() - 21600000)),
    },
    {
      id: 't-005', title: '冷藏柜温度异常',
      subtitle: '3 号冷藏柜实时温度 8°C，超出标准范围 2-6°C',
      type: 'alert', priority: 'critical', status: 'pending',
      assignee: '设备管理员', dueDate: fmt(now), tags: ['温控', '紧急'], createdAt: fmt(now),
    },
    {
      id: 't-006', title: '会员生日礼包准备',
      subtitle: '7 月有 15 位会员生日，需准备生日礼包',
      type: 'member', priority: 'medium', status: 'pending',
      assignee: '导购组', dueDate: fmt(new Date(now.getTime() + 604800000)), tags: ['会员关怀', '活动'], createdAt: fmt(new Date(now.getTime() - 259200000)),
    },
    {
      id: 't-007', title: '月度盘点计划确认',
      subtitle: '6 月库存盘点计划已生成，需确认盘点时间',
      type: 'inventory', priority: 'medium', status: 'in_progress',
      assignee: '库房管理员', dueDate: fmt(new Date(now.getTime() + 172800000)), tags: ['盘点', '月度'], createdAt: fmt(new Date(now.getTime() - 604800000)),
    },
    {
      id: 't-008', title: '早班交接班记录审核',
      subtitle: '今日早班交接记录待店长签字确认',
      type: 'schedule', priority: 'low', status: 'done',
      assignee: '店长', dueDate: fmt(now), tags: ['交接班', '审核'], createdAt: fmt(new Date(now.getTime() - 86400000)),
    },
    {
      id: 't-009', title: 'ESL 电子价签批量更新',
      subtitle: '新一期促销活动需更新 43 个电子价签',
      type: 'device', priority: 'medium', status: 'pending',
      assignee: '运营专员', dueDate: fmt(new Date(now.getTime() + 259200000)), tags: ['价签', '促销'], createdAt: fmt(new Date(now.getTime() - 43200000)),
    },
    {
      id: 't-010', title: '洗手间清洁告警',
      subtitle: '洗手间传感器显示人流密集，建议增加清洁频次',
      type: 'alert', priority: 'low', status: 'done',
      assignee: '保洁组', dueDate: fmt(now), tags: ['环境', '清洁'], createdAt: fmt(new Date(now.getTime() - 3600000)),
    },
  ];
}

// ── 子组件 ──

function TaskTypeBadge({ type }: { type: TaskType }) {
  return (
    <StatusBadge
      label={TYPE_LABELS[type]}
      variant={TYPE_COLORS[type]}
    />
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config: Record<TaskPriority, { label: string; variant: 'danger' | 'warning' | 'info' | 'neutral' }> = {
    critical: { label: '紧急', variant: 'danger' },
    high: { label: '高', variant: 'warning' },
    medium: { label: '中', variant: 'info' },
    low: { label: '低', variant: 'neutral' },
  };
  return <StatusBadge label={config[priority].label} variant={config[priority].variant} />;
}

// ── 主页面 ──

export default function TaskCenterPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>(generateMockTasks);
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');

  // ── 转 Kanban 数据 ──

  const filtered = useMemo(
    () => (filterType === 'all' ? tasks : tasks.filter((t) => t.type === filterType)),
    [tasks, filterType],
  );

  const kanbanColumns: KanbanColumn[] = useMemo(
    () => [
      { id: 'pending', title: '待处理', count: filtered.filter((t) => t.status === 'pending').length, bgColor: '#FEF3C7' },
      { id: 'in_progress', title: '处理中', count: filtered.filter((t) => t.status === 'in_progress').length, bgColor: '#DBEAFE' },
      { id: 'done', title: '已完成', count: filtered.filter((t) => t.status === 'done').length, bgColor: '#D1FAE5' },
    ],
    [filtered],
  );

  const kanbanCards: KanbanCard[] = useMemo(
    () =>
      filtered.map((task) => ({
        id: task.id,
        title: task.title,
        subtitle: `${TYPE_LABELS[task.type]} · ${task.assignee} · ${task.dueDate}`,
        columnId: task.status,
        priority: task.priority,
        assignee: task.assignee,
        tags: task.tags,
        dueDate: task.dueDate,
      })),
    [filtered],
  );

  // ── 卡片拖拽 ──

  const handleCardMove = useCallback(
    (cardId: string, targetColumnId: string, _targetIndex: number) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== cardId) return t;
          const newStatus = targetColumnId as TaskStatus;
          return { ...t, status: newStatus };
        }),
      );
      const newLabel = STATUS_LABELS[targetColumnId as TaskStatus];
      toast.success(`任务状态已更新为「${newLabel}」`);
    },
    [toast],
  );

  // ── 统计 ──

  const stats = useMemo(() => {
    const critical = tasks.filter((t) => t.priority === 'critical' && t.status !== 'done').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const overdue = tasks.filter((t) => t.dueDate < '2026-06-30' && t.status !== 'done').length;
    return { critical, pending, inProgress, overdue };
  }, [tasks]);

  const filterOptions: { label: string; value: TaskType | 'all' }[] = [
    { label: '全部', value: 'all' },
    { label: '库存', value: 'inventory' },
    { label: '会员', value: 'member' },
    { label: '设备', value: 'device' },
    { label: '排班', value: 'schedule' },
    { label: '告警', value: 'alert' },
  ];

  return (
    <PageShell
      title="门店任务中心"
      description="所有门店待办任务的聚合看板，支持拖拽修改状态、按类型筛选"
    >
      {/* 统计卡片 */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard label="紧急任务" value={stats.critical} variant="error" />
        <StatCard label="待处理" value={stats.pending} variant="warning" />
        <StatCard label="处理中" value={stats.inProgress} variant="info" />
        <StatCard label="已超期" value={stats.overdue} variant="error" />
      </div>

      {/* 筛选栏 */}
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="任务类型筛选">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilterType(opt.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filterType === opt.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 看板 */}
      <div data-testid="task-center-kanban">
        {kanbanCards.length === 0 ? (
          <EmptyState
            title="暂无任务"
            description="当前筛选条件下没有待处理任务，一切正常！"
          />
        ) : (
          <KanbanBoard
            columns={kanbanColumns}
            cards={kanbanCards}
            onCardMove={handleCardMove}
          />
        )}
      </div>
    </PageShell>
  );
}
