/**
 * 门店任务详情页 — Task Detail Page (Next.js App Router)
 * 角色视角: 👔店长 / 🏪全体门店员工
 * 类型: B-页面创建
 * 功能: 任务详情展示、状态流转(待处理→处理中→已完成)、编辑/删除操作
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PageShell,
  StatusBadge,
  Breadcrumb,
  DetailShell,
  DetailActionBar,
  type DetailActionBarAction,
  Button,
  Modal,
  Tag,
  TagGroup,
  Timeline,
  type TimelineItem,
  useToast,
  EmptyState,
  Card,
} from '@m5/ui';

// ── 类型 ──

type TaskType = 'inventory' | 'member' | 'device' | 'schedule' | 'alert';
type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
type TaskStatus = 'pending' | 'in_progress' | 'done';

interface TaskLog {
  key: string;
  heading: string;
  subtitle: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

interface TaskDetail {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  reviewer: string;
  dueDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  attachments: { name: string; url: string }[];
  logs: TaskLog[];
}

// ── 常量 ──

const TYPE_LABELS: Record<TaskType, string> = {
  inventory: '库存',
  member: '会员',
  device: '设备',
  schedule: '排班',
  alert: '告警',
};

const TYPE_COLORS: Record<TaskType, 'info' | 'success' | 'warning' | 'neutral' | 'danger'> = {
  inventory: 'info',
  member: 'success',
  device: 'warning',
  schedule: 'neutral',
  alert: 'danger',
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; variant: 'danger' | 'warning' | 'info' | 'neutral' }> = {
  critical: { label: '紧急', variant: 'danger' },
  high: { label: '高', variant: 'warning' },
  medium: { label: '中', variant: 'info' },
  low: { label: '低', variant: 'neutral' },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; variant: 'warning' | 'info' | 'success' }> = {
  pending: { label: '待处理', variant: 'warning' },
  in_progress: { label: '处理中', variant: 'info' },
  done: { label: '已完成', variant: 'success' },
};

const STATUS_TRANSITIONS: Record<TaskStatus, { next: TaskStatus; label: string }[]> = {
  pending: [{ next: 'in_progress', label: '开始处理' }],
  in_progress: [
    { next: 'done', label: '标记完成' },
    { next: 'pending', label: '退回待处理' },
  ],
  done: [{ next: 'in_progress', label: '重新打开' }],
};

// ── Mock 数据 ──

const MOCK_TASKS: Record<string, TaskDetail> = {
  't-001': {
    id: 't-001', title: 'SKU-089 库存不足预警',
    subtitle: '经典款 T 恤库存仅剩 3 件，低于安全库存线 20 件',
    description: '发现 SKU-089（经典款 T 恤-白色-M 码）当前库存仅剩 3 件，远低于设定的安全库存线 20 件。需立即安排补货，联系供应商确认交期，避免断货影响销售。建议优先联系主力供应商。',
    type: 'inventory', priority: 'critical', status: 'pending',
    assignee: '库房管理员', reviewer: '店长',
    dueDate: '2026-06-30', tags: ['补货', '预警'],
    createdAt: '2026-06-29', updatedAt: '2026-06-29',
    attachments: [{ name: '库存报表_6月.xlsx', url: '#' }, { name: '供应商通讯录.pdf', url: '#' }],
    logs: [
      { key: 'log-1', heading: '系统自动创建任务', subtitle: '库存预警系统检测到 SKU-089 库存低于安全线 · 2026-06-29 08:00', variant: 'info' },
    ],
  },
  't-002': {
    id: 't-002', title: '钻石会员张先生投诉跟进',
    subtitle: '会员反馈产品质量问题，需在 24 小时内回复',
    description: '钻石会员张先生（会员号: 88012345）反馈上周购买的智能水杯存在密封圈脱落问题。客户情绪较为激动，要求在 24 小时内给予解决方案。建议先致电致歉，同步安排退款或换货。',
    type: 'member', priority: 'high', status: 'in_progress',
    assignee: '客服主管', reviewer: '店长',
    dueDate: '2026-07-01', tags: ['投诉', '紧急'],
    createdAt: '2026-06-28', updatedAt: '2026-06-29',
    attachments: [{ name: '投诉记录截图.png', url: '#' }],
    logs: [
      { key: 'log-1', heading: '任务创建', subtitle: '前台接待员录入投诉信息 · 2026-06-28 14:30', variant: 'info' },
      { key: 'log-2', heading: '客服主管接手', subtitle: '已联系客户致歉，安排换货处理 · 2026-06-29 09:15', variant: 'success' },
    ],
  },
  't-003': {
    id: 't-003', title: 'POS-02 打印机缺纸',
    subtitle: '2 号收银台打印机缺纸，需补充热敏纸',
    description: '2 号收银台的 POS 打印机热敏纸已用完，当前使用备用纸张，预计可再支撑半天。请尽快从耗材库领用热敏纸卷（规格 57×40mm）进行更换。',
    type: 'device', priority: 'high', status: 'pending',
    assignee: '前台主管', reviewer: '店长',
    dueDate: '2026-06-30', tags: ['耗材', '收银'],
    createdAt: '2026-06-29', updatedAt: '2026-06-29',
    attachments: [],
    logs: [
      { key: 'log-1', heading: '收银员上报', subtitle: '早班收银员发现打印机缺纸并上报 · 2026-06-29 07:45', variant: 'info' },
    ],
  },
  't-004': {
    id: 't-004', title: '晚班排班表待确认',
    subtitle: '7 月 1 日晚班排班表尚未确认，现有 2 人未分配',
    description: '7 月 1 日晚班（17:00-22:00）排班表已完成初稿，但仍有 2 名员工的班次未分配。请店长确认最终排班，确保晚班人手充足。建议优先安排有夜班经验的员工。',
    type: 'schedule', priority: 'medium', status: 'pending',
    assignee: '店长', reviewer: '运营经理',
    dueDate: '2026-07-01', tags: ['排班', '晚班'],
    createdAt: '2026-06-27', updatedAt: '2026-06-29',
    attachments: [{ name: '排班表初稿.xlsx', url: '#' }],
    logs: [
      { key: 'log-1', heading: '排班表生成', subtitle: '系统根据员工偏好自动生成初稿 · 2026-06-27 10:00', variant: 'info' },
      { key: 'log-2', heading: '运营经理审阅', subtitle: '初稿已审阅，标注待确认项 · 2026-06-28 16:20', variant: 'warning' },
    ],
  },
  't-005': {
    id: 't-005', title: '冷藏柜温度异常',
    subtitle: '3 号冷藏柜实时温度 8°C，超出标准范围 2-6°C',
    description: 'IoT 监控系统检测到 3 号冷藏柜实时温度为 8°C，超出设定的标准温度范围（2-6°C）。可能存在制冷故障或柜门未关严。需立即安排人员现场检查，防止食品变质风险。',
    type: 'alert', priority: 'critical', status: 'pending',
    assignee: '设备管理员', reviewer: '店长',
    dueDate: '2026-06-30', tags: ['温控', '紧急'],
    createdAt: '2026-06-30', updatedAt: '2026-06-30',
    attachments: [{ name: '温度监控日志.csv', url: '#' }],
    logs: [
      { key: 'log-1', heading: 'IoT 告警触发', subtitle: '温度传感器上报异常数据（8°C） · 2026-06-30 06:22', variant: 'error' },
    ],
  },
  't-006': {
    id: 't-006', title: '会员生日礼包准备',
    subtitle: '7 月有 15 位会员生日，需准备生日礼包',
    description: '系统已统计 7 月份过生日的会员共 15 人。需提前准备生日礼包（含定制贺卡、优惠券、小礼品）。请导购组在 7 月 1 日前完成礼包打包，并在会员生日当天通知领取或邮寄。',
    type: 'member', priority: 'medium', status: 'pending',
    assignee: '导购组', reviewer: '店长',
    dueDate: '2026-07-07', tags: ['会员关怀', '活动'],
    createdAt: '2026-06-20', updatedAt: '2026-06-28',
    attachments: [],
    logs: [
      { key: 'log-1', heading: '系统生成任务', subtitle: '自动根据会员生日数据生成礼包任务 · 2026-06-20 00:00', variant: 'info' },
    ],
  },
  't-007': {
    id: 't-007', title: '月度盘点计划确认',
    subtitle: '6 月库存盘点计划已生成，需确认盘点时间',
    description: '6 月库存盘点计划已由系统自动生成。建议安排在 7 月 1 日（周三）晚闭店后进行，预计耗时 3 小时。需确认盘点小组人员名单及使用的盘点设备。',
    type: 'inventory', priority: 'medium', status: 'in_progress',
    assignee: '库房管理员', reviewer: '店长',
    dueDate: '2026-07-02', tags: ['盘点', '月度'],
    createdAt: '2026-06-22', updatedAt: '2026-06-29',
    attachments: [{ name: '盘点操作手册.pdf', url: '#' }],
    logs: [
      { key: 'log-1', heading: '任务创建', subtitle: '系统自动生成月度盘点计划 · 2026-06-22 09:00', variant: 'info' },
      { key: 'log-2', heading: '盘点小组组建', subtitle: '已确定 3 人盘点小组，正在确认具体时间 · 2026-06-28 11:30', variant: 'info' },
    ],
  },
  't-009': {
    id: 't-009', title: 'ESL 电子价签批量更新',
    subtitle: '新一期促销活动需更新 43 个电子价签',
    description: '配合新一期促销活动，需在后台批量更新 43 个 SKU 的电子价签（ESL）价格信息。已在系统生成更新任务，请运营专员确认价签信息无误后批量推送。',
    type: 'device', priority: 'medium', status: 'pending',
    assignee: '运营专员', reviewer: '店长',
    dueDate: '2026-07-03', tags: ['价签', '促销'],
    createdAt: '2026-06-28', updatedAt: '2026-06-29',
    attachments: [{ name: '促销价签清单.xlsx', url: '#' }],
    logs: [
      { key: 'log-1', heading: '任务创建', subtitle: '促销活动配置完成后自动生成价签更新任务 · 2026-06-28 16:00', variant: 'info' },
    ],
  },
};

function generateFallbackTask(id: string): TaskDetail {
  return {
    id,
    title: '未知任务',
    subtitle: '未找到该任务的详细信息',
    description: '系统中未找到该任务，可能已被删除或 ID 不正确。',
    type: 'inventory',
    priority: 'low',
    status: 'pending',
    assignee: '-',
    reviewer: '-',
    dueDate: '-',
    tags: [],
    createdAt: '-',
    updatedAt: '-',
    attachments: [],
    logs: [],
  };
}

// ── 子组件 ──

function TaskInfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-24 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

// ── 主页面 ──

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const id = params.id as string;
  const taskData = MOCK_TASKS[id] || generateFallbackTask(id);
  const isFallback = taskData.title === '未知任务';

  const [task, setTask] = useState<TaskDetail>(taskData);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // ── 状态流转 ──

  const transitions = STATUS_TRANSITIONS[task.status] || [];

  const handleTransition = useCallback(
    (nextStatus: TaskStatus) => {
      setTransitioning(true);
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const newLog: TaskLog = {
        key: `log-${Date.now()}`,
        heading: STATUS_CONFIG[nextStatus].label,
        subtitle: `由「${STATUS_CONFIG[task.status].label}」变更为「${STATUS_CONFIG[nextStatus].label}」 · ${now}`,
        variant: nextStatus === 'done' ? 'success' : nextStatus === 'pending' ? 'warning' : 'info',
      };
      setTask((prev) => ({
        ...prev,
        status: nextStatus,
        updatedAt: new Date().toISOString().slice(0, 10),
        logs: [...prev.logs, newLog],
      }));
      setTransitioning(false);
      toast.success(`任务状态已更新为「${STATUS_CONFIG[nextStatus].label}」`);
    },
    [task.status, toast],
  );

  // ── 删除操作 ──

  const handleDelete = useCallback(() => {
    toast.success('任务已删除');
    setShowDeleteModal(false);
    router.push('/task-center');
  }, [toast, router]);

  // ── 详情操作栏 ──

  const actionBarActions: DetailActionBarAction[] = isFallback
    ? [{ label: '返回列表', key: 'back', icon: 'link', onClick: () => router.push('/task-center') }]
    : [
        ...transitions.map((t) => ({
          label: t.label,
          key: `transition-${t.next}`,
          onClick: () => handleTransition(t.next),
        })),
        { label: '删除任务', key: 'delete', variant: 'danger' as const, onClick: () => setShowDeleteModal(true) },
        { label: '返回列表', key: 'back', icon: 'link', onClick: () => router.push('/task-center') },
      ];

  if (isFallback) {
    return (
      <PageShell title="任务详情" description="任务未找到">
        <EmptyState title="任务不存在" description={`ID 为「${id}」的任务未找到，可能已被删除。`} />
        <div className="mt-4">
          <Button onClick={() => router.push('/task-center')}>返回任务中心</Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={task.title} description={`任务详情 · ${TYPE_LABELS[task.type]}`}>
      {/* 面包屑 */}
      <div className="mb-4">
        <Breadcrumb
          items={[
            { label: '任务中心', href: '/task-center' },
            { label: task.title },
          ]}
        />
      </div>

      {/* 详情区域 */}
      <DetailShell title={task.title} subtitle={task.subtitle}>
        {/* 标题区域 */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{task.subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge label={PRIORITY_CONFIG[task.priority].label} variant={PRIORITY_CONFIG[task.priority].variant} />
            <StatusBadge label={STATUS_CONFIG[task.status].label} variant={STATUS_CONFIG[task.status].variant} />
            <StatusBadge label={TYPE_LABELS[task.type]} variant={TYPE_COLORS[task.type]} />
          </div>
        </div>

        {/* 分隔线 */}
        <div className="my-6 border-t border-gray-200" />

        {/* 详细信息 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 基本信息 */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">基本信息</h3>
            <TaskInfoRow label="任务 ID" value={task.id} />
            <TaskInfoRow label="负责人" value={task.assignee} />
            <TaskInfoRow label="审核人" value={task.reviewer} />
            <TaskInfoRow label="截止日期" value={task.dueDate} />
            <TaskInfoRow label="创建时间" value={task.createdAt} />
            <TaskInfoRow label="更新时间" value={task.updatedAt} />
            <div className="flex items-center gap-3 py-2">
              <span className="w-24 shrink-0 text-sm text-gray-500">标签</span>
              <TagGroup>
                {task.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
                {task.tags.length === 0 && <span className="text-sm text-gray-400">无标签</span>}
              </TagGroup>
            </div>
          </Card>

          {/* 状态流转 */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">状态操作</h3>
            <div className="flex flex-wrap gap-2">
              {transitions.map((t) => (
                <Button
                  key={t.next}
                  onClick={() => handleTransition(t.next)}
                  loading={transitioning}
                  variant={t.next === 'done' ? 'primary' : t.next === 'pending' ? 'secondary' : 'ghost'}
                >
                  {t.label}
                </Button>
              ))}
              <Button variant="outline" onClick={() => setShowDeleteModal(true)}>
                删除任务
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              当前状态: {STATUS_CONFIG[task.status].label}
            </p>
          </Card>
        </div>

        {/* 描述 */}
        <div className="my-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">任务描述</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{task.description}</p>
        </div>

        {/* 附件 */}
        {task.attachments.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              附件 ({task.attachments.length})
            </h3>
            <ul className="space-y-1">
              {task.attachments.map((att) => (
                <li key={att.name}>
                  <a href={att.url} className="text-sm text-blue-600 underline hover:text-blue-800">
                    {att.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 操作时间线 — 转换为 TimelineItem 格式 */}
        {task.logs.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">操作记录</h3>
            <Timeline
              items={task.logs.map((log): TimelineItem => ({
                key: log.key,
                heading: log.heading,
                subtitle: log.subtitle,
                variant: log.variant,
              }))}
            />
          </div>
        )}
      </DetailShell>

      {/* 底部操作栏 */}
      <DetailActionBar actions={actionBarActions} />

      {/* 删除确认弹窗 */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="确认删除"
      >
        <p className="text-sm text-gray-600">
          确定要删除任务「{task.title}」吗？此操作不可撤销。
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={() => setShowDeleteModal(false)}>取消</Button>
          <Button variant="danger" onClick={handleDelete}>确认删除</Button>
        </div>
      </Modal>
    </PageShell>
  );
}
