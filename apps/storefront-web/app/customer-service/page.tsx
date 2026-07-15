/**
 * 客服工作台页 — Customer Service Dashboard (Next.js App Router Page)
 * 角色: 客服视角，展示工单处理面板、服务质量指标、座席状态、快速操作
 * 功能: 工单列表/服务指标/座席状态/工单分类筛选/操作弹窗/任务处理
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  PageShell,
  StatusBadge,
  Modal,
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
  { id: 'TK-20260628001', title: '会员等级未更新', customerName: '王芳', priority: 'high', status: 'open', category: 'complaint', createdAt: '2026-06-28 09:15' },
  { id: 'TK-20260628002', title: '优惠券无法使用', customerName: '李明', priority: 'high', status: 'in_progress', category: 'complaint', createdAt: '2026-06-28 08:42' },
  { id: 'TK-20260628003', title: '商品配送延迟查询', customerName: '赵雪', priority: 'medium', status: 'in_progress', category: 'inquiry', createdAt: '2026-06-28 08:10' },
  { id: 'TK-20260628004', title: '申请退货退款', customerName: '陈伟', priority: 'low', status: 'open', category: 'refund', createdAt: '2026-06-27 17:30' },
  { id: 'TK-20260628005', title: '商品换货申请', customerName: '张丽', priority: 'medium', status: 'resolved', category: 'exchange', createdAt: '2026-06-27 15:20' },
  { id: 'TK-20260628006', title: '积分兑换疑问', customerName: '刘洋', priority: 'low', status: 'closed', category: 'inquiry', createdAt: '2026-06-27 11:00' },
  { id: 'TK-20260628007', title: '商品质量问题反馈', customerName: '周敏', priority: 'high', status: 'open', category: 'complaint', createdAt: '2026-06-28 10:05' },
  { id: 'TK-20260628008', title: '发票开具申请', customerName: '孙浩', priority: 'low', status: 'resolved', category: 'other', createdAt: '2026-06-27 14:00' },
  { id: 'TK-20260628009', title: '预约到店时间变更', customerName: '吴丽', priority: 'low', status: 'open', category: 'inquiry', createdAt: '2026-06-28 11:30' },
  { id: 'TK-20260628010', title: '商品库存查询', customerName: '钱进', priority: 'medium', status: 'open', category: 'inquiry', createdAt: '2026-06-28 10:50' },
];

const MOCK_AGENT_STATUS: AgentStatusSummary = {
  total: 12,
  online: 8,
  busy: 3,
  away: 1,
  offline: 0,
};

// ============================================================
// 常量与工具
// ============================================================

const PRIORITY_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' };
const PRIORITY_VARIANT: Record<string, string> = { high: 'danger', medium: 'warning', low: 'info' };
const STATUS_LABEL: Record<string, string> = { open: '待处理', in_progress: '处理中', resolved: '已解决', closed: '已关闭' };
const STATUS_VARIANT: Record<string, string> = { open: 'warning', in_progress: 'info', resolved: 'success', closed: 'neutral' };
const CATEGORY_LABEL: Record<string, string> = { complaint: '投诉', inquiry: '咨询', refund: '退款', exchange: '换货', other: '其他' };

// ============================================================
// 子组件：统计卡片
// ============================================================

function StatCard({ label, value, icon, color, sublabel }: { label: string; value: string | number; icon: string; color: string; sublabel?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 120, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ============================================================
// 子组件：座席状态面板
// ============================================================

function AgentStatusPanel({ status }: { status: AgentStatusSummary }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
      <div style={{ padding: '10px 16px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        <StatusBadge variant="success" label={`在线 ${status.online}`} />
      </div>
      <div style={{ padding: '10px 16px', background: '#fefce8', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        <StatusBadge variant="warning" label={`忙碌 ${status.busy}`} />
      </div>
      <div style={{ padding: '10px 16px', background: '#f3f4f6', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        <StatusBadge variant="neutral" label={`离开 ${status.away}`} />
      </div>
      <div style={{ padding: '10px 16px', background: '#fef2f2', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        <StatusBadge variant="danger" label={`离线 ${status.offline}`} />
      </div>
      <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
        共 {status.total} 人
      </div>
    </div>
  );
}

// ============================================================
// 子组件：工单处理弹窗
// ============================================================

function TicketDetailModal({
  ticket,
  onClose,
  onAssign,
  onResolve,
  onCloseTicket,
}: {
  ticket: ServiceTicket;
  onClose: () => void;
  onAssign: (id: string) => void;
  onResolve: (id: string) => void;
  onCloseTicket: (id: string) => void;
}) {
  return (
    <Modal open onClose={onClose} title={`工单详情 — ${ticket.id}`} width={520}>
      <div style={{ fontSize: 14, lineHeight: 1.8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 12px' }}>
          <span style={{ color: '#6b7280' }}>工单号</span><span style={{ fontWeight: 600 }}>{ticket.id}</span>
          <span style={{ color: '#6b7280' }}>标题</span><span>{ticket.title}</span>
          <span style={{ color: '#6b7280' }}>客户</span><span>{ticket.customerName}</span>
          <span style={{ color: '#6b7280' }}>分类</span><span>{CATEGORY_LABEL[ticket.category] || ticket.category}</span>
          <span style={{ color: '#6b7280' }}>优先级</span>
          <span>
            <StatusBadge variant={PRIORITY_VARIANT[ticket.priority] as 'danger' | 'warning' | 'info'} label={PRIORITY_LABEL[ticket.priority] || ticket.priority} />
          </span>
          <span style={{ color: '#6b7280' }}>状态</span>
          <span>
            <StatusBadge variant={STATUS_VARIANT[ticket.status] as 'warning' | 'info' | 'success' | 'neutral'} label={STATUS_LABEL[ticket.status] || ticket.status} />
          </span>
          <span style={{ color: '#6b7280' }}>创建时间</span><span>{ticket.createdAt}</span>
          {ticket.assignedTo && (
            <>
              <span style={{ color: '#6b7280' }}>处理人</span><span>{ticket.assignedTo}</span>
            </>
          )}
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
          {ticket.status === 'open' && (
            <button onClick={() => { onAssign(ticket.id); onClose(); }} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              接单处理
            </button>
          )}
          {ticket.status === 'in_progress' && (
            <button onClick={() => { onResolve(ticket.id); onClose(); }} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              标记解决
            </button>
          )}
          {ticket.status === 'resolved' && (
            <button onClick={() => { onCloseTicket(ticket.id); onClose(); }} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
              关闭工单
            </button>
          )}
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>返回</button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// 客服工作台页面
// ============================================================

export default function CustomerServicePage() {
  const [tickets, setTickets] = useState<ServiceTicket[]>(MOCK_TICKETS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [detailTicket, setDetailTicket] = useState<ServiceTicket | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  /** 工单操作 */
  const handleAssign = useCallback((ticketId: string) => {
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: 'in_progress' as const, assignedTo: '客服小张' } : t));
    showToast(`已接单：${ticketId}`);
  }, [showToast]);

  const handleResolve = useCallback((ticketId: string) => {
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: 'resolved' as const } : t));
    showToast(`已解决：${ticketId}`);
  }, [showToast]);

  const handleClose = useCallback((ticketId: string) => {
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: 'closed' as const } : t));
    showToast(`已关闭：${ticketId}`);
  }, [showToast]);

  /** 筛选 */
  const filteredTickets = useMemo(() => {
    let items = tickets;
    if (priorityFilter !== 'ALL') items = items.filter((t) => t.priority === priorityFilter);
    if (statusFilter !== 'ALL') items = items.filter((t) => t.status === statusFilter);
    if (categoryFilter !== 'ALL') items = items.filter((t) => t.category === categoryFilter);
    return items;
  }, [tickets, priorityFilter, statusFilter, categoryFilter]);

  /** 统计数据 */
  const ticketStats = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'open').length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
    const closed = tickets.filter((t) => t.status === 'closed').length;
    return { total: tickets.length, open, inProgress, resolved, closed };
  }, [tickets]);

  /** 快捷操作 */
  const quickActions = useMemo(() => [
    { key: 'qa-new', label: '新建工单', icon: '📝', onClick: () => showToast('打开新建工单表单'), primary: true },
    { key: 'qa-queue', label: '排队队列', icon: '👥', onClick: () => showToast('查看排队队列') },
    { key: 'qa-escalate', label: '升级工单', icon: '⬆️', onClick: () => showToast('升级工单处理') },
    { key: 'qa-knowledge', label: '知识库', icon: '📚', onClick: () => showToast('打开知识库') },
    { key: 'qa-call', label: '外呼客户', icon: '📞', onClick: () => showToast('打开外呼面板') },
  ], [showToast]);

  return (
    <PageShell title="客服工作台" description="客服工单处理面板 · 朝阳旗舰店">
      <div style={{ padding: 24, position: 'relative' }}>
        {/* Toast 通知 */}
        {toastMessage && (
          <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            padding: '12px 24px', borderRadius: 12, background: '#22c55e',
            color: '#fff', fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}>
            {toastMessage}
          </div>
        )}

        {/* 头部 */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>🎧 客服工作台</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            客服团队 · 今日已解决 {MOCK_METRICS.resolvedTickets} 单 · 满意度 {MOCK_METRICS.satisfactionScore}/5.0
          </p>
        </div>

        {/* 指标卡片 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <StatCard label="今日解决" value={MOCK_METRICS.resolvedTickets} icon="✅" color="#059669" />
          <StatCard label="平均响应" value={`${MOCK_METRICS.avgResponseTime}min`} icon="⏱️" color="#2563eb" />
          <StatCard label="平均解决" value={`${MOCK_METRICS.avgResolutionTime}min`} icon="⏳" color="#d97706" />
          <StatCard label="满意度" value={MOCK_METRICS.satisfactionScore} icon="⭐" color="#7c3aed" sublabel="/ 5.0" />
        </div>

        {/* 工单状态统计 */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <StatCard label="待处理" value={ticketStats.open} icon="🆕" color="#d97706" />
          <StatCard label="处理中" value={ticketStats.inProgress} icon="🔄" color="#2563eb" />
          <StatCard label="已解决" value={ticketStats.resolved} icon="✅" color="#059669" />
          <StatCard label="已关闭" value={ticketStats.closed} icon="🔒" color="#6b7280" />
        </div>

        {/* 座席状态 */}
        <AgentStatusPanel status={MOCK_AGENT_STATUS} />

        {/* 快速操作按钮 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {quickActions.map((action) => (
            <button
              key={action.key}
              onClick={action.onClick}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: action.primary ? 'none' : '1px solid #d1d5db',
                background: action.primary ? '#2563eb' : '#fff',
                color: action.primary ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: action.primary ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>

        {/* 筛选工具栏 */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, minWidth: 100 }}>
            <option value="ALL">全部优先级</option>
            <option value="high">高优先</option>
            <option value="medium">中优先</option>
            <option value="low">低优先</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, minWidth: 100 }}>
            <option value="ALL">全部状态</option>
            <option value="open">待处理 ({ticketStats.open})</option>
            <option value="in_progress">处理中 ({ticketStats.inProgress})</option>
            <option value="resolved">已解决 ({ticketStats.resolved})</option>
            <option value="closed">已关闭 ({ticketStats.closed})</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, minWidth: 100 }}>
            <option value="ALL">全部分类</option>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 'auto' }}>
            筛选后 {filteredTickets.length}/{tickets.length} 单
          </span>
        </div>

        {/* 工单表格 */}
        {filteredTickets.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', borderRadius: 12, border: '1px dashed #d1d5db', background: '#f9fafb' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>暂无匹配工单</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>请调整筛选条件</div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>工单号</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>标题</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>客户</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>分类</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>优先级</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>状态</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>创建时间</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 12 }}>{t.id}</td>
                    <td style={{ padding: '10px 14px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{t.customerName}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{CATEGORY_LABEL[t.category] || t.category}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <StatusBadge variant={PRIORITY_VARIANT[t.priority] as 'danger' | 'warning' | 'info'} label={PRIORITY_LABEL[t.priority] || t.priority} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <StatusBadge variant={STATUS_VARIANT[t.status] as 'warning' | 'info' | 'success' | 'neutral'} label={STATUS_LABEL[t.status] || t.status} />
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>{t.createdAt}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        onClick={() => setDetailTicket(t)}
                        style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 12 }}
                      >
                        处理
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 团队状态脚注 */}
        <div style={{ marginTop: 16, padding: '12px 18px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, color: '#6b7280', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <span>👥 座席: {MOCK_AGENT_STATUS.online} 在线 / {MOCK_AGENT_STATUS.busy} 忙碌 / {MOCK_AGENT_STATUS.away} 离开 / {MOCK_AGENT_STATUS.offline} 离线</span>
          <span>📊 待处理率: {ticketStats.total > 0 ? Math.round((ticketStats.open / ticketStats.total) * 100) : 0}%</span>
          <span>⏱️ 平均解决: {MOCK_METRICS.avgResolutionTime} 分钟</span>
        </div>

        {/* 工单详情弹窗 */}
        {detailTicket && (
          <TicketDetailModal
            ticket={detailTicket}
            onClose={() => setDetailTicket(null)}
            onAssign={handleAssign}
            onResolve={handleResolve}
            onCloseTicket={handleClose}
          />
        )}
      </div>
    </PageShell>
  );
}
