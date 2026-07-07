/**
 * 客服工作台页 — Customer Service Dashboard (Next.js App Router Page)
 * 角色: 客服视角，展示工单处理面板、服务质量指标、快速操作
 * 类型: D-角色操作界面
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  CustomerServiceDashboard,
  PageShell,
  type ServiceQualityMetrics,
  type ServiceTicket,
  type AgentStatusSummary,
} from '@m5/ui';

// ============================================================
// Mock 数据
// ============================================================

const MOCK_METRICS: ServiceQualityMetrics = {
  resolvedTickets: 42,
  avgResponseTime: 2.8,
  avgResolutionTime: 15.3,
  satisfactionScore: 4.6,
};

const MOCK_TICKETS: ServiceTicket[] = [
  {
    id: 'TK-20260628001',
    title: '会员等级未更新',
    customerName: '王芳',
    priority: 'high',
    status: 'open',
    category: 'complaint',
    createdAt: '2026-06-28 09:15',
  },
  {
    id: 'TK-20260628002',
    title: '优惠券无法使用',
    customerName: '李明',
    priority: 'high',
    status: 'in_progress',
    category: 'complaint',
    createdAt: '2026-06-28 08:42',
  },
  {
    id: 'TK-20260628003',
    title: '商品配送延迟查询',
    customerName: '赵雪',
    priority: 'medium',
    status: 'in_progress',
    category: 'inquiry',
    createdAt: '2026-06-28 08:10',
  },
  {
    id: 'TK-20260628004',
    title: '申请退货退款',
    customerName: '陈伟',
    priority: 'low',
    status: 'open',
    category: 'refund',
    createdAt: '2026-06-27 17:30',
  },
  {
    id: 'TK-20260628005',
    title: '商品换货申请',
    customerName: '张丽',
    priority: 'medium',
    status: 'resolved',
    category: 'exchange',
    createdAt: '2026-06-27 15:20',
  },
  {
    id: 'TK-20260628006',
    title: '积分兑换疑问',
    customerName: '刘洋',
    priority: 'low',
    status: 'closed',
    category: 'inquiry',
    createdAt: '2026-06-27 11:00',
  },
  {
    id: 'TK-20260628007',
    title: '商品质量问题反馈',
    customerName: '周敏',
    priority: 'high',
    status: 'open',
    category: 'complaint',
    createdAt: '2026-06-28 10:05',
  },
  {
    id: 'TK-20260628008',
    title: '发票开具申请',
    customerName: '孙浩',
    priority: 'low',
    status: 'resolved',
    category: 'other',
    createdAt: '2026-06-27 14:00',
  },
];

const MOCK_AGENT_STATUS: AgentStatusSummary = {
  total: 12,
  online: 8,
  busy: 3,
  away: 1,
  offline: 0,
};

// ============================================================
// 客服工作台页面
// ============================================================

export default function CustomerServicePage() {
  const [tickets, setTickets] = useState<ServiceTicket[]>(MOCK_TICKETS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  /** 处理工单：接单 */
  const handleAssign = useCallback((ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: 'in_progress' as const, assignedTo: '客服小张' }
          : t,
      ),
    );
    showToast(`已接单：${ticketId}`);
  }, [showToast]);

  /** 处理工单：解决 */
  const handleResolve = useCallback((ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, status: 'resolved' as const } : t,
      ),
    );
    showToast(`已解决：${ticketId}`);
  }, [showToast]);

  /** 处理工单：关闭 */
  const handleClose = useCallback((ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, status: 'closed' as const } : t,
      ),
    );
    showToast(`已关闭：${ticketId}`);
  }, [showToast]);

  /** 快捷操作 */
  const quickActions = useMemo(
    () => [
      { key: 'qa-new', label: '新建工单', icon: '📝', onClick: () => showToast('打开新建工单表单'), primary: true },
      { key: 'qa-queue', label: '排队队列', icon: '👥', onClick: () => showToast('查看排队队列'), badge: 2 },
      { key: 'qa-escalate', label: '升级工单', icon: '⬆️', onClick: () => showToast('升级工单处理') },
      { key: 'qa-knowledge', label: '知识库', icon: '📚', onClick: () => showToast('打开知识库') },
      { key: 'qa-call', label: '外呼客户', icon: '📞', onClick: () => showToast('打开外呼面板') },
    ],
    [showToast],
  );

  return (
    <PageShell title="客服工作台" description="客服工单处理面板 · 朝阳旗舰店">
      <div style={{ position: 'relative' }}>
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              padding: '12px 24px',
              borderRadius: 12,
              background: '#22c55e',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            {toastMessage}
          </div>
        )}

        <CustomerServiceDashboard
          serviceMetrics={MOCK_METRICS}
          pendingTickets={tickets}
          agentStatus={MOCK_AGENT_STATUS}
          quickActions={quickActions}
        />
      </div>
    </PageShell>
  );
}
