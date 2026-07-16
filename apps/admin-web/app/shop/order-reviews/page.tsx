// @ts-nocheck
'use client'

/**
 * 订单评价管理 — Order Reviews
 *
 * 订单评价审核与回复管理：
 * - 评价概览：总评价/未回复/差评/好评率
 * - 评价列表：评分/内容/订单/回复
 * - 快速回复/批量操作
 */

import React, { useState, useMemo } from 'react';
import {
  PageShell,
  StatCard,
  DataTable,
  Tabs,
  SearchFilterInput,
  StatusBadge,
  Button,
  useSearchFilter,
  usePagination,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

type ReviewRating = 1 | 2 | 3 | 4 | 5;
type ReviewStatus = 'pending' | 'replied' | 'hidden';

interface OrderReview {
  id: string;
  orderId: string;
  memberName: string;
  productName: string;
  rating: ReviewRating;
  content: string;
  reply: string | null;
  status: ReviewStatus;
  createdAt: string;
  repliedAt: string | null;
}

const RATING_LABELS: Record<ReviewRating, string> = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐', 5: '⭐⭐⭐⭐⭐' };
const RATING_COLORS: Record<ReviewRating, string> = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#16a34a' };

const MOCK_REVIEWS: OrderReview[] = [
  { id: 'RV-001', orderId: 'ORD-202607001', memberName: '张伟', productName: '游戏币(100枚)', rating: 5, content: '非常满意，游戏币质量很好，孩子玩得很开心！', reply: '感谢您的支持！', status: 'replied', createdAt: '2026-07-15 14:30', repliedAt: '2026-07-15 16:00' },
  { id: 'RV-002', orderId: 'ORD-202607002', memberName: '李娜', productName: '会员月卡', rating: 4, content: '月卡很划算，下次续费', reply: null, status: 'pending', createdAt: '2026-07-15 15:20', repliedAt: null },
  { id: 'RV-003', orderId: 'ORD-202607003', memberName: '王强', productName: '扭蛋(小)', rating: 3, content: '一般般，扭蛋内容不太丰富', reply: '感谢反馈，我们会持续优化扭蛋内容', status: 'replied', createdAt: '2026-07-14 10:00', repliedAt: '2026-07-14 18:00' },
  { id: 'RV-004', orderId: 'ORD-202607004', memberName: '刘洋', productName: '娃娃(中号)', rating: 5, content: '娃娃质量超棒，孩子爱不释手！', reply: null, status: 'pending', createdAt: '2026-07-14 11:30', repliedAt: null },
  { id: 'RV-005', orderId: 'ORD-202607005', memberName: '陈静', productName: '可乐', rating: 2, content: '可乐送过来已经不冰了，差评', reply: '非常抱歉，我们已反馈配送部门改进', status: 'replied', createdAt: '2026-07-13 09:00', repliedAt: '2026-07-13 14:00' },
  { id: 'RV-006', orderId: 'ORD-202607006', memberName: '杨帆', productName: '限定手办A', rating: 5, content: '限定款太棒了！包装精致', reply: null, status: 'pending', createdAt: '2026-07-13 16:45', repliedAt: null },
  { id: 'RV-007', orderId: 'ORD-202607007', memberName: '赵鹏', productName: '优惠券(10元)', rating: 4, content: '优惠券使用很方便', reply: null, status: 'pending', createdAt: '2026-07-12 08:20', repliedAt: null },
  { id: 'RV-008', orderId: 'ORD-202607008', memberName: '黄丽', productName: '娃娃(大号)', rating: 1, content: '娃娃有瑕疵，线头很多，要求退货', reply: '已联系您处理退款事宜，抱歉', status: 'replied', createdAt: '2026-07-11 19:30', repliedAt: '2026-07-12 10:00' },
  { id: 'RV-009', orderId: 'ORD-202607009', memberName: '周杰', productName: '游戏币(100枚)', rating: 5, content: '一直在这家买，质量有保障', reply: null, status: 'pending', createdAt: '2026-07-11 20:00', repliedAt: null },
  { id: 'RV-010', orderId: 'ORD-202607010', memberName: '吴娟', productName: '会员月卡', rating: 3, content: '还行吧，价格再优惠点就好了', reply: null, status: 'pending', createdAt: '2026-07-10 12:30', repliedAt: null },
  { id: 'RV-011', orderId: 'ORD-202607011', memberName: '郑东', productName: '扭蛋(大)', rating: 4, content: '扭蛋很大只，满意', reply: null, status: 'pending', createdAt: '2026-07-10 14:00', repliedAt: null },
  { id: 'RV-012', orderId: 'ORD-202607012', memberName: '孙丽', productName: '游戏币(100枚)', rating: 5, content: '帮朋友买的，很不错', reply: null, status: 'pending', createdAt: '2026-07-09 10:15', repliedAt: null },
];

const CARD: React.CSSProperties = {
  borderRadius: 16,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
  marginBottom: 20,
};

const STATUS_MAP: Record<ReviewStatus, { label: string; variant: 'warning' | 'success' | 'neutral' }> = {
  pending: { label: '待回复', variant: 'warning' },
  replied: { label: '已回复', variant: 'success' },
  hidden: { label: '已隐藏', variant: 'neutral' },
};

export default function OrderReviewsPage() {
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const negative = reviews.filter(r => r.rating <= 2).length;
    const positiveRate = total > 0 ? ((reviews.filter(r => r.rating >= 4).length / total) * 100).toFixed(1) : '0.0';
    return { total, pending, negative, positiveRate };
  }, [reviews]);

  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(reviews, ['memberName', 'productName', 'content']);
  const filtered = statusFilter === 'ALL' ? filteredItems : filteredItems.filter(r => r.status === statusFilter);
  const sorted = useSortedItems(filtered, ['createdAt'], sortConfig);
  const { page, setPage, totalPages, pageItems } = usePagination(sorted, 10);

  const columns: DataTableColumn<OrderReview>[] = [
    { key: 'orderId', title: '订单', sortable: true, render: r => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>{r.orderId}</span> },
    { key: 'memberName', title: '会员', sortable: true },
    { key: 'productName', title: '商品' },
    { key: 'rating', title: '评分', sortable: true, render: r => <span style={{ color: RATING_COLORS[r.rating], fontWeight: 600 }}>{RATING_LABELS[r.rating]}</span> },
    { key: 'content', title: '评价内容', render: r => <span style={{ color: '#cbd5e1', fontSize: 13, maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.content}</span> },
    { key: 'status', title: '状态', sortable: true, render: r => <StatusBadge {...STATUS_MAP[r.status]} size="sm" dot /> },
    { key: 'createdAt', title: '评价时间', sortable: true, render: r => <span style={{ fontSize: 12, color: '#64748b' }}>{r.createdAt}</span> },
    { key: 'reply', title: '回复', render: r => r.reply ? <span style={{ fontSize: 12, color: '#22c55e' }}>已回复</span> : <span style={{ fontSize: 12, color: '#eab308' }}>待回复</span> },
  ];

  const handleReply = (id: string) => {
    const reply = prompt('请输入回复内容：');
    if (reply && reply.trim()) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, reply: reply.trim(), status: 'replied', repliedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : r));
    }
  };

  const handleBatchReply = () => {
    selectedIds.forEach(id => handleReply(id));
    setSelectedIds(new Set());
  };

  const handleHide = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'hidden' as const } : r));
  };

  return (
    <PageShell title="📝 订单评价管理" subtitle="订单评价审核与回复管理">
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <StatCard label="总评价数" value={stats.total.toString()} />
        <StatCard label="待回复" value={stats.pending.toString()} variant="warning" helper="需及时回复" />
        <StatCard label="差评" value={stats.negative.toString()} variant="danger" helper="评分≤2" />
        <StatCard label="好评率" value={`${stats.positiveRate}%`} variant="success" />
      </div>

      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
          <Tabs
            items={[
              { key: 'ALL', label: '全部' },
              { key: 'pending', label: '待回复' },
              { key: 'replied', label: '已回复' },
              { key: 'hidden', label: '已隐藏' },
            ]}
            activeKey={statusFilter}
            onChange={t => setStatusFilter(t as ReviewStatus | 'ALL')}
            variant="pills"
          />
          <div style={{ width: 220, flexShrink: 0 }}>
            <SearchFilterInput value={searchTerm} onChange={setSearchTerm} placeholder="搜索会员/商品/内容..." />
          </div>
          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" size="sm" onClick={handleBatchReply}>批量回复 ({selectedIds.size})</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>取消选择</Button>
            </div>
          )}
        </div>

        <DataTable
          data={pageItems}
          columns={columns}
          rowKey={r => r.id}
          sortable
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
          onRowSelect={setSelectedIds}
          selectedKeys={selectedIds}
          emptyText="暂无评价数据"
        />

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(148,163,184,0.2)', background: page === i + 1 ? 'rgba(59,130,246,0.2)' : 'transparent', color: page === i + 1 ? '#60a5fa' : '#94a3b8', cursor: 'pointer', fontSize: 13 }}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
        <strong style={{ color: '#94a3b8' }}>💡 说明</strong><br />
        评价管理规则：差评（评分≤2）需在24小时内首次回复。默认按评价时间倒序排列。批量操作仅对待回复状态生效。
      </div>
    </PageShell>
  );
}
