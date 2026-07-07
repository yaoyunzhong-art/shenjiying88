/**
 * 客服工单详情页 — Customer Service Ticket Detail (Next.js App Router Page)
 * 角色视角: 💁客服
 * 功能: 工单详情查看、状态流转、回复处理、关闭工单
 * 类型: B-页面创建
 */
'use client';

import React, { use, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  DetailShell,
  Button,
  DetailActionBar,
  DetailClosureBar,
  Timeline,
  DescriptionList,
  EmptyState,
  PageShell,
  TextArea,
  StatusBadge,
  useToast,
  ConfirmDialog,
  type DetailShellAction,
  type DetailActionBarAction,
  type DetailClosureLink,
  type DescriptionItem,
  type TimelineItem,
} from '@m5/ui';

// ---- 类型 ----

type TicketPriority = 'high' | 'medium' | 'low';
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketCategory = 'complaint' | 'inquiry' | 'refund' | 'exchange' | 'other';

interface TicketDetail {
  id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  description: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  orderId?: string;
  orderAmount?: number;
}

interface TicketReply {
  id: string;
  content: string;
  author: string;
  role: 'customer' | 'agent';
  createdAt: string;
}

// ---- 优先级 & 状态映射 ----

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const PRIORITY_VARIANTS: Record<TicketPriority, 'danger' | 'warning' | 'info'> = {
  high: 'danger',
  medium: 'warning',
  low: 'info',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

const STATUS_VARIANTS: Record<TicketStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'neutral',
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  complaint: '投诉',
  inquiry: '咨询',
  refund: '退款',
  exchange: '换货',
  other: '其他',
};

// ---- Mock 数据 ----

const MOCK_TICKETS: Record<string, TicketDetail> = {
  'TK-20260628001': {
    id: 'TK-20260628001',
    title: '会员等级未更新',
    customerName: '王芳',
    customerPhone: '138****5689',
    priority: 'high',
    status: 'open',
    category: 'complaint',
    description:
      '您好，我上周消费满3000元，按照规则应该升级为金卡会员，但系统中至今仍显示为银卡。请帮忙核实并更新，谢谢。',
    createdAt: '2026-06-28 09:15',
    updatedAt: '2026-06-28 09:15',
    assignedTo: '张明',
    orderId: 'ORD-20260628001',
    orderAmount: 3280,
  },
  'TK-20260628002': {
    id: 'TK-20260628002',
    title: '优惠券无法使用',
    customerName: '李明',
    customerPhone: '139****2341',
    priority: 'medium',
    status: 'in_progress',
    category: 'inquiry',
    description:
      '618活动中领取的满200减50优惠券，在结算页面无法使用，提示"优惠券已失效"。活动截止日期是6月30日，请协助处理。',
    createdAt: '2026-06-28 10:30',
    updatedAt: '2026-06-28 11:05',
    assignedTo: '张明',
    orderId: 'ORD-20260628003',
    orderAmount: 256,
  },
};

const MOCK_REPLIES: Record<string, TicketReply[]> = {
  'TK-20260628001': [],
  'TK-20260628002': [
    {
      id: 'r1',
      content: '您好，麻烦提供一下优惠券截图，我这边帮您核查。',
      author: '张明',
      role: 'agent',
      createdAt: '2026-06-28 10:45',
    },
    {
      id: 'r2',
      content: '已发送截图到您的企业微信了。',
      author: '李明',
      role: 'customer',
      createdAt: '2026-06-28 10:52',
    },
    {
      id: 'r3',
      content:
        '已查到，该优惠券确实在有效期内，是系统缓存问题导致展示异常。我已手动修复，您现在可以正常使用了。',
      author: '张明',
      role: 'agent',
      createdAt: '2026-06-28 11:05',
    },
  ],
};

// ---- 下一个状态 ----

const NEXT_STATUS: Record<TicketStatus, TicketStatus | null> = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
  closed: null,
};

const NEXT_STATUS_LABELS: Record<TicketStatus, string> = {
  open: '开始处理',
  in_progress: '标记为已解决',
  resolved: '关闭工单',
  closed: '已关闭',
};

// ============================================================

export default function CustomerServiceTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const ticket = MOCK_TICKETS[id];
  const replies = MOCK_REPLIES[id] ?? [];

  const [replyText, setReplyText] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localReplies, setLocalReplies] = useState<TicketReply[]>(replies);
  const [localStatus, setLocalStatus] = useState<TicketStatus | null>(
    ticket?.status ?? null,
  );

  /** 处理工单状态流转 */
  const handleTransition = useCallback(() => {
    if (!localStatus) return;
    const next = NEXT_STATUS[localStatus];
    if (!next) return;

    setIsTransitioning(true);

    // 模拟异步
    setTimeout(() => {
      setLocalStatus(next);
      setIsTransitioning(false);
      toast.success(
        `工单已${NEXT_STATUS_LABELS[localStatus]}`,
      );
    }, 500);
  }, [localStatus, toast]);

  /** 提交回复 */
  const handleSubmitReply = useCallback(() => {
    if (!replyText.trim()) return;

    const newReply: TicketReply = {
      id: `r-${Date.now()}`,
      content: replyText.trim(),
      author: '张明',
      role: 'agent',
      createdAt: new Date().toLocaleString('zh-CN'),
    };

    setLocalReplies((prev) => [...prev, newReply]);
    setReplyText('');
    toast.success('回复已提交');
  }, [replyText, toast]);

  /** 删除工单 */
  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    toast.success('工单已删除');
    router.push('/customer-service');
  }, [router, toast]);

  // ---- 如果未找到工单 ----
  if (!ticket) {
    return (
      <PageShell title="工单详情">
        <EmptyState
          title="未找到工单"
          description={`工单 #${id} 不存在或已被删除`}
          action={
            <Button variant="primary" onClick={() => router.push('/customer-service')}>
              返回客服工作台
            </Button>
          }
        />
      </PageShell>
    );
  }

  const status = localStatus ?? ticket.status;
  const nextStatus = NEXT_STATUS[status];

  // ---- 详情页操作按钮 ----
  const actions: DetailShellAction[] = [
    {
      key: 'transition',
      label: NEXT_STATUS_LABELS[status] || '处理',
      variant: nextStatus ? 'primary' : 'secondary',
      loading: isTransitioning,
      disabled: !nextStatus,
      onClick: handleTransition,
    },
    {
      key: 'delete',
      label: '删除工单',
      variant: 'danger',
      onClick: () => setShowDeleteConfirm(true),
    },
  ];

  // ---- 详情底部导航栏 ----
  const closureLinks: DetailClosureLink[] = [
    {
      key: 'back',
      title: '返回客服工作台',
      subtitle: '返回工单列表页',
      href: '#',
    },
    {
      key: 'reports',
      title: '客服仪表盘',
      subtitle: '查看服务质量总览',
      href: '/reports',
    },
  ];

  // ---- 描述列表 ----
  const infoItems: DescriptionItem[] = [
    { label: '工单编号', value: ticket.id },
    { label: '客户姓名', value: ticket.customerName },
    { label: '客户电话', value: ticket.customerPhone },
    { label: '优先级', value: PRIORITY_LABELS[ticket.priority] },
    {
      label: '分类',
      value: CATEGORY_LABELS[ticket.category],
    },
    { label: '客服', value: ticket.assignedTo },
    { label: '关联订单', value: ticket.orderId ?? '-' },
    {
      label: '订单金额',
      value: ticket.orderAmount
        ? `¥${ticket.orderAmount.toLocaleString()}`
        : '-',
    },
    { label: '创建时间', value: ticket.createdAt },
    { label: '更新时间', value: ticket.updatedAt },
  ];

  // ---- 状态流转时间线 ----
  const timelineItems: TimelineItem[] = [
    {
      key: 'created',
      heading: ticket.createdAt,
      subtitle: '客户提交工单',
      content: ticket.description.substring(0, 40) + '…',
    },
    ...(status !== 'open'
      ? [
          {
            key: 'processing',
            heading: ticket.updatedAt,
            subtitle: '客服开始处理',
            content: `由 ${ticket.assignedTo} 接单`,
          },
        ]
      : []),
    ...(status === 'resolved' || status === 'closed'
      ? [
          {
            key: 'resolved',
            heading: ticket.updatedAt,
            subtitle: '工单已解决',
            content: '客户问题已处理完毕',
          },
        ]
      : []),
    ...(status === 'closed'
      ? [
          {
            key: 'closed',
            heading: ticket.updatedAt,
            subtitle: '工单已关闭',
            content: '本次服务已结束',
          },
        ]
      : []),
  ];

  // ---- 回复时间线 ----
  const replyTimelineItems: TimelineItem[] = localReplies.map((r) => ({
    key: r.id,
    heading: r.createdAt,
    subtitle: r.role === 'agent' ? `${r.author} (客服)` : r.author,
    content: r.content,
  }));

  return (
    <>
      <DetailShell
        title={`工单 #${ticket.id}`}
        subtitle={`${ticket.title} · ${STATUS_LABELS[status]}`}
        actions={actions}
        backHref="/customer-service"
        backLabel="← 返回"
      >
        {/* 基本信息 */}
        <section>
          <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
            工单信息
          </h3>
          <DescriptionList items={infoItems} columns={3} />
        </section>

        {/* 问题描述 */}
        <section style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
            问题描述
          </h3>
          <div
            style={{
              padding: 16,
              background: '#f9fafb',
              borderRadius: 8,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {ticket.description}
          </div>
        </section>

        {/* 状态流转 */}
        <section style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
            处理进度
          </h3>
          <Timeline items={timelineItems} />
        </section>

        {/* 回复记录 */}
        <section style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
            回复记录
          </h3>
          {localReplies.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: 14 }}>
              暂无回复记录
            </div>
          ) : (
            <Timeline items={replyTimelineItems} />
          )}
        </section>

        {/* 回复输入框 */}
        <section style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
            回复客户
          </h3>
          <TextArea
            placeholder="输入回复内容…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
          />
          <div style={{ marginTop: 12 }}>
            <Button
              variant="primary"
              onClick={handleSubmitReply}
              disabled={!replyText.trim()}
            >
              提交回复
            </Button>
          </div>
        </section>

        {/* 详情操作栏 */}
        <DetailActionBar
          actions={actions.map(
            (a): DetailActionBarAction => ({
              key: a.key,
              label: a.label,
              variant: a.variant === 'danger' ? 'danger' : a.variant === 'primary' ? 'primary' : 'default',
              disabled: a.disabled,
              onClick: a.onClick ?? (() => {}),
            }),
          )}
        />
      </DetailShell>

      <DetailClosureBar links={closureLinks} />

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="确认删除工单"
        message={`您确定要删除工单 #${ticket.id} 吗？此操作不可撤销。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
