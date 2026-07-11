'use client';

import React, { useMemo, useState, useCallback } from 'react';

import {
  DataTable,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  StatCard,
  Dialog,
  Button,
  EmptyState,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ---- 类型 ----

type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'card' | 'points';

interface OrderItem {
  id: string;
  orderNo: string;
  memberName: string;
  memberPhone: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  discount: number;
  actualAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  storeName: string;
  createdAt: string;
  paidAt: string | null;
  completedAt: string | null;
  remark: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: '待支付',
  paid: '已支付',
  processing: '处理中',
  shipped: '已发货',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
};

const STATUS_VARIANTS: Record<OrderStatus, 'error' | 'warning' | 'success' | 'default' | 'neutral' | 'info'> = {
  pending_payment: 'warning',
  paid: 'info',
  processing: 'default',
  shipped: 'default',
  delivered: 'success',
  completed: 'success',
  cancelled: 'neutral',
  refunded: 'error',
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金',
  card: '银行卡',
  points: '积分兑换',
};

// ---- Mock 数据 ----

const generateOrderItems = () => {
  const itemPool = [
    { name: '瑜伽初级课', price: 19900 },
    { name: 'HIIT 高强度训练', price: 14900 },
    { name: '蛋白粉（乳清）', price: 29900 },
    { name: '运动毛巾套装', price: 8900 },
    { name: '私教一对一', price: 49900 },
    { name: '体测评估服务', price: 9900 },
    { name: '瑜伽垫（加厚）', price: 15900 },
    { name: '运动背包（防水）', price: 24900 },
    { name: '游泳季卡', price: 199900 },
    { name: '普拉提中级课', price: 22900 },
    { name: '运动水壶', price: 5900 },
    { name: '护膝护具', price: 12900 },
  ];
  const count = Math.floor(Math.random() * 3) + 1;
  const selected = new Set<number>();
  const items: { name: string; qty: number; price: number }[] = [];
  for (let i = 0; i < count; i++) {
    let idx: number;
    do { idx = Math.floor(Math.random() * itemPool.length); } while (selected.has(idx));
    selected.add(idx);
    const item = itemPool[idx];
    items.push({ name: item.name, qty: Math.floor(Math.random() * 2) + 1, price: item.price });
  }
  return items;
};

const generateMockOrders = (count: number): OrderItem[] => {
  const names = ['张伟', '李娜', '王芳', '赵强', '孙丽', '周杰', '吴敏', '郑浩', '陈婷', '刘洋', '黄磊', '林小红', '何军', '罗琳', '马超', '朱莉', '徐明', '胡雪', '郭峰', '梁燕'];
  const phones = ['138****1234', '139****5678', '137****9012', '136****3456', '135****7890', '138****2345', '186****6789', '189****0123', '177****4567', '188****8901'];
  const statuses: OrderStatus[] = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'];
  const payments: PaymentMethod[] = ['wechat', 'alipay', 'cash', 'card', 'points'];
  const stores = ['Demo Store 旗舰店', 'Demo Store 社区店', 'Demo Store 优选店'];
  const remarks = ['', '加急配送', '礼品包装', '周六配送', '放门口', '联系前台', '改期配送', '特殊说明：无糖'];

  const orders: OrderItem[] = [];
  const startDate = new Date('2026-06-01');
  for (let i = 1; i <= count; i++) {
    const date = new Date(startDate.getTime() - i * (Math.random() * 48 + 6) * 3600000);
    const items = generateOrderItems();
    const totalBeforeDiscount = items.reduce((s, it) => s + it.price * it.qty, 0);
    const discount = Math.random() > 0.7 ? Math.floor(totalBeforeDiscount * (Math.random() * 0.15 + 0.05)) : 0;
    const actualAmount = totalBeforeDiscount - discount;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paidAt = status !== 'pending_payment' && status !== 'cancelled'
      ? new Date(date.getTime() + 60000 * Math.floor(Math.random() * 30)).toISOString()
      : null;
    const completedAt = (status === 'completed' || status === 'delivered')
      ? new Date(date.getTime() + 86400000 * (Math.floor(Math.random() * 5) + 1)).toISOString()
      : null;

    orders.push({
      id: `ORD-${String(i).padStart(6, '0')}`,
      orderNo: `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(i).padStart(6, '0')}`,
      memberName: names[Math.floor(Math.random() * names.length)],
      memberPhone: phones[Math.floor(Math.random() * phones.length)],
      items,
      total: totalBeforeDiscount,
      discount,
      actualAmount,
      paymentMethod: payments[Math.floor(Math.random() * payments.length)],
      status,
      storeName: stores[Math.floor(Math.random() * stores.length)],
      createdAt: date.toISOString(),
      paidAt,
      completedAt,
      remark: remarks[Math.floor(Math.random() * remarks.length)],
    });
  }
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const MOCK_ORDERS = generateMockOrders(60);

// ---- 工具函数 ----

function formatCurrency(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---- 列定义 ----

const COLUMNS: DataTableColumn<OrderItem>[] = [
  {
    key: 'orderNo',
    header: '订单号',
    render: (item) => (
      <div>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0', fontFamily: 'monospace' }}>{item.orderNo}</span>
        <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 2 }}>
          {item.memberName} · {item.memberPhone}
        </span>
      </div>
    ),
  },
  {
    key: 'items',
    header: '商品',
    render: (item) => (
      <div style={{ maxWidth: 200 }}>
        {item.items.map((it, idx) => (
          <div key={idx} style={{ fontSize: 13, color: '#cbd5e1', lineHeight: '20px' }}>
            {it.name} × {it.qty}
          </div>
        ))}
      </div>
    ),
  },
  {
    key: 'actualAmount',
    header: '实付金额',
    align: 'right',
    render: (item) => (
      <div>
        <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>
          {formatCurrency(item.actualAmount)}
        </span>
        {item.discount > 0 && (
          <div style={{ fontSize: 11, color: '#facc15' }}>
            已优惠 {formatCurrency(item.discount)}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'paymentMethod',
    header: '支付方式',
    render: (item) => (
      <span style={{ fontSize: 13, color: '#94a3b8' }}>
        {PAYMENT_LABELS[item.paymentMethod]}
      </span>
    ),
  },
  {
    key: 'status',
    header: '状态',
    render: (item) => (
      <StatusBadge
        label={STATUS_LABELS[item.status]}
        variant={STATUS_VARIANTS[item.status]}
        size="sm"
      />
    ),
  },
  {
    key: 'createdAt',
    header: '创建时间',
    align: 'right',
    render: (item) => (
      <span style={{ fontSize: 12, color: '#64748b' }}>{formatDateTime(item.createdAt)}</span>
    ),
  },
  {
    key: 'storeName',
    header: '门店',
    render: (item) => (
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.storeName}</span>
    ),
  },
];

// ---- 订单详情弹窗 ----

function OrderDetailDialog({ order, onClose }: { order: OrderItem | null; onClose: () => void }) {
  if (!order) return null;

  const statusActions: Partial<Record<OrderStatus, { label: string; variant?: string }[]>> = {
    pending_payment: [
      { label: '确认收款', variant: 'primary' },
      { label: '取消订单', variant: 'danger' },
    ],
    paid: [
      { label: '开始处理', variant: 'primary' },
      { label: '退款', variant: 'danger' },
    ],
    processing: [
      { label: '标记发货', variant: 'primary' },
    ],
    shipped: [
      { label: '确认送达', variant: 'success' },
    ],
    delivered: [
      { label: '完成订单', variant: 'primary' },
    ],
    completed: [],
    cancelled: [],
    refunded: [],
  };

  const actions = statusActions[order.status] ?? [];

  return (
    <Dialog
      open={!!order}
      onClose={onClose}
      title={`订单详情 · ${order.orderNo}`}
    >
      <div style={{ padding: '0 4px' }}>
        {/* 基本信息 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>会员</div>
            <div style={{ fontSize: 14, color: '#e2e8f0' }}>{order.memberName} ({order.memberPhone})</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>门店</div>
            <div style={{ fontSize: 14, color: '#e2e8f0' }}>{order.storeName}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>状态</div>
            <StatusBadge label={STATUS_LABELS[order.status]} variant={STATUS_VARIANTS[order.status]} size="sm" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>支付方式</div>
            <div style={{ fontSize: 14, color: '#e2e8f0' }}>{PAYMENT_LABELS[order.paymentMethod]}</div>
          </div>
        </div>

        {/* 商品清单 */}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          商品明细
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
              <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: 12, color: '#64748b', fontWeight: 500 }}>商品</th>
              <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: 12, color: '#64748b', fontWeight: 500 }}>单价</th>
              <th style={{ textAlign: 'center', padding: '8px 4px', fontSize: 12, color: '#64748b', fontWeight: 500 }}>数量</th>
              <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: 12, color: '#64748b', fontWeight: 500 }}>小计</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                <td style={{ padding: '8px 4px', fontSize: 14, color: '#e2e8f0' }}>{it.name}</td>
                <td style={{ padding: '8px 4px', fontSize: 13, color: '#94a3b8', textAlign: 'right' }}>{formatCurrency(it.price)}</td>
                <td style={{ padding: '8px 4px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>{it.qty}</td>
                <td style={{ padding: '8px 4px', fontSize: 14, color: '#e2e8f0', textAlign: 'right', fontWeight: 500 }}>
                  {formatCurrency(it.price * it.qty)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {order.discount > 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '8px 4px', fontSize: 13, color: '#facc15', textAlign: 'right' }}>优惠</td>
                <td style={{ padding: '8px 4px', fontSize: 13, color: '#facc15', textAlign: 'right' }}>-{formatCurrency(order.discount)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={3} style={{ padding: '8px 4px', fontSize: 14, fontWeight: 700, color: '#e2e8f0', textAlign: 'right' }}>实付</td>
              <td style={{ padding: '8px 4px', fontSize: 16, fontWeight: 700, color: '#60a5fa', textAlign: 'right' }}>{formatCurrency(order.actualAmount)}</td>
            </tr>
          </tfoot>
        </table>

        {/* 时间线 */}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          时间线
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa' }} />
            <span style={{ fontSize: 12, color: '#64748b', minWidth: 130 }}>{formatDateTime(order.createdAt)}</span>
            <span style={{ fontSize: 13, color: '#cbd5e1' }}>创建订单</span>
          </div>
          {order.paidAt && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              <span style={{ fontSize: 12, color: '#64748b', minWidth: 130 }}>{formatDateTime(order.paidAt)}</span>
              <span style={{ fontSize: 13, color: '#cbd5e1' }}>支付成功</span>
            </div>
          )}
          {order.completedAt && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
              <span style={{ fontSize: 12, color: '#64748b', minWidth: 130 }}>{formatDateTime(order.completedAt)}</span>
              <span style={{ fontSize: 13, color: '#cbd5e1' }}>已完成</span>
            </div>
          )}
        </div>

        {/* 备注 */}
        {order.remark && (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
            <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: 4 }}>📝 备注</div>
            <div style={{ fontSize: 13, color: '#e2e8f0' }}>{order.remark}</div>
          </div>
        )}

        {/* 操作按钮 */}
        {actions.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end', borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 16 }}>
            {actions.map((action) => (
              <Button key={action.label} variant={action.variant as any} size="sm">
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}

// ---- 页面 ----

export default function OrdersListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  // 搜索过滤
  const searched = useMemo(() => {
    if (!searchTerm.trim()) return MOCK_ORDERS;
    const lower = searchTerm.toLowerCase();
    return MOCK_ORDERS.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(lower) ||
        o.memberName.toLowerCase().includes(lower) ||
        o.memberPhone.includes(searchTerm) ||
        o.storeName.toLowerCase().includes(lower) ||
        o.items.some((it) => it.name.toLowerCase().includes(lower)),
    );
  }, [searchTerm]);

  // 状态过滤
  const statusFiltered = useMemo(
    () => (statusFilter === 'ALL' ? searched : searched.filter((o) => o.status === statusFilter)),
    [searched, statusFilter],
  );

  // 支付方式过滤
  const finalFiltered = useMemo(
    () => (paymentFilter === 'ALL' ? statusFiltered : statusFiltered.filter((o) => o.paymentMethod === paymentFilter)),
    [statusFiltered, paymentFilter],
  );

  // 排序
  const sortedItems = useSortedItems(finalFiltered, COLUMNS, sortConfig);

  // 分页
  const pagination = usePagination(sortedItems.length, 12);
  const pageItems = sortedItems.slice(
    (pagination.page - 1) * 12,
    pagination.page * 12,
  );

  const handleRowClick = useCallback((item: OrderItem) => {
    setSelectedOrder(item);
  }, []);

  // 统计
  const stats = useMemo(() => {
    const pending = MOCK_ORDERS.filter((o) => o.status === 'pending_payment').length;
    const completed = MOCK_ORDERS.filter((o) => o.status === 'completed').length;
    const cancelled = MOCK_ORDERS.filter((o) => o.status === 'cancelled').length;
    const revenue = MOCK_ORDERS
      .filter((o) => !['cancelled', 'refunded', 'pending_payment'].includes(o.status))
      .reduce((s, o) => s + o.actualAmount, 0);
    return { total: MOCK_ORDERS.length, pending, completed, cancelled, revenue };
  }, []);

  return (
    <PageShell
      title="订单管理"
      description="查看门店所有订单记录，支持搜索、多维筛选、排序及订单详情查看。"
    >
      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard label="总订单数" value={stats.total} variant="info" />
        <StatCard label="待支付" value={stats.pending} variant="warning" />
        <StatCard label="已完成" value={stats.completed} variant="success" />
        <StatCard label="已取消" value={stats.cancelled} variant="neutral" />
        <StatCard label="总收入" value={formatCurrency(stats.revenue)} variant="info" />
      </div>

      {/* 搜索栏 */}
      <div style={{ marginBottom: 12, maxWidth: 360 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索订单号、会员名、手机号或商品..."
        />
      </div>

      {/* 状态过滤 */}
      <div style={{ marginBottom: 8 }}>
        <Tabs
          items={[
            { key: 'ALL', label: '全部', count: searched.length },
            ...(['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'] as const).map(
              (st) => ({
                key: st,
                label: STATUS_LABELS[st],
                count: searched.filter((o) => o.status === st).length,
              }),
            ),
          ]}
          activeKey={statusFilter}
          onChange={(key) => setStatusFilter(key as OrderStatus | 'ALL')}
          variant="pills"
          size="sm"
        />
      </div>

      {/* 支付方式过滤 */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          items={[
            { key: 'ALL', label: '全部支付方式' },
            ...(['wechat', 'alipay', 'cash', 'card', 'points'] as const).map(
              (pm) => ({
                key: pm,
                label: PAYMENT_LABELS[pm],
                count: statusFiltered.filter((o) => o.paymentMethod === pm).length,
              }),
            ),
          ]}
          activeKey={paymentFilter}
          onChange={(key) => setPaymentFilter(key as PaymentMethod | 'ALL')}
          variant="pills"
          size="sm"
        />
      </div>

      {/* 数据表格 */}
      {pageItems.length > 0 ? (
        <DataTable
          columns={COLUMNS}
          rows={pageItems}
          rowKey={(item) => item.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          onRowClick={handleRowClick}
        />
      ) : (
        <EmptyState
          title="暂无订单"
          description={searchTerm ? `未找到匹配 "${searchTerm}" 的订单` : '暂无订单记录'}
        />
      )}

      {/* 分页 */}
      {sortedItems.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={sortedItems.length}
            onPageChange={pagination.setPage}
          />
        </div>
      )}

      {/* 订单详情弹窗 */}
      <OrderDetailDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </PageShell>
  );
}
