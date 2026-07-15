'use client';

/**
 * 履约管理 — Fulfillment Page
 * 功能: 订单履约流程与配送管理
 * 角色: 📦 运营管理员
 *
 * 页面结构:
 * - 统计面板: 待履约 · 配送中 · 已完成 · 异常
 * - 搜索栏 + 状态筛选
 * - 履约单列表 (DataTable)
 * - 创建履约单 Modal (form + validation)
 * - 编辑履约单 Modal (prefill + update)
 * - 操作栏: 批量处理 · 导出 · 刷新
 * - 分页 + 状态管理
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Badge,
  Button,
  DataTable,
  FormField,
  FormSubmitFeedback,
  Modal,
  PageShell,
  Pagination,
  SearchFilterInput,
  Select,
  StatCard,
  StatusBadge,
  SubmitButton,
  type DataTableSortConfig,
  usePagination,
  useSearchFilter,
  useSortedItems,
} from '@m5/ui';

// ==================== 类型定义 ====================

type FulfillmentStatus = 'pending' | 'confirmed' | 'picking' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
type ShippingMethod = 'standard' | 'express' | 'same_day' | 'pickup' | 'scheduled';

interface FulfillmentOrder {
  orderId: string;
  status: FulfillmentStatus;
  items: { sku: string; quantity: number; name: string }[];
  shippingMethod: ShippingMethod;
  address: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate: string | null;
  carrier: string;
  trackingNumber: string;
  notes: string;
  totalAmount: number;
  memberName: string;
  contactPhone: string;
}

// ==================== 常量与映射 ====================

const STATUS_CONFIG: Record<FulfillmentStatus, { label: string; variant: 'neutral' | 'warning' | 'info' | 'success' | 'danger' }> = {
  pending: { label: '待确认', variant: 'neutral' },
  confirmed: { label: '已确认', variant: 'info' },
  picking: { label: '拣货中', variant: 'warning' },
  packed: { label: '已打包', variant: 'info' },
  shipped: { label: '已发货', variant: 'success' },
  delivered: { label: '已送达', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
  returned: { label: '已退货', variant: 'danger' },
};

const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  standard: '标准配送',
  express: '加急配送',
  same_day: '当日达',
  pickup: '门店自提',
  scheduled: '预约配送',
};

const CARRIER_OPTIONS = ['顺丰', '京东物流', '中通', '圆通', '申通', '韵达', '邮政'] as const;

// ==================== Mock 数据 ====================

const MOCK_ORDERS: FulfillmentOrder[] = Array.from({ length: 32 }, (_, i) => {
  const statuses: FulfillmentStatus[] = ['pending', 'confirmed', 'picking', 'packed', 'shipped', 'delivered', 'delivered', 'cancelled', 'returned'];
  const methods: ShippingMethod[] = ['standard', 'standard', 'express', 'same_day', 'pickup', 'scheduled'];
  const carriers = [...CARRIER_OPTIONS];
  const names = ['张伟', '李娜', '王强', '刘洋', '陈静', '杨帆', '赵鹏', '黄丽'];
  const d = new Date(Date.now() - i * 86400000);
  const dateStr = d.toISOString().slice(0, 10);
  const status = statuses[i % statuses.length];
  return {
    orderId: `ORD-${String(202607000 + i).slice(0, 6)}`,
    status,
    items: [
      { sku: `SKU-${1000 + i}`, quantity: 1 + (i % 3), name: `商品${String.fromCharCode(65 + (i % 26))}` },
    ],
    shippingMethod: methods[i % methods.length],
    address: `北京市朝阳区示例路${100 + i}号`,
    estimatedDeliveryDate: dateStr,
    actualDeliveryDate: status === 'delivered' ? dateStr : status === 'shipped' ? null : null,
    carrier: carriers[i % carriers.length],
    trackingNumber: status === 'shipped' || status === 'delivered' ? `${carriers[i % carriers.length].charAt(0)}${1000000 + i}` : '',
    notes: status === 'cancelled' ? '客户取消' : status === 'returned' ? '退货处理中' : '',
    totalAmount: 99 + Math.floor(Math.random() * 500),
    memberName: names[i % names.length],
    contactPhone: `138${String(10000000 + i).slice(0, 8)}`,
  };
});

// ==================== 默认表单值 ====================

const DEFAULT_FORM = {
  memberName: '',
  contactPhone: '',
  shippingMethod: 'standard' as ShippingMethod,
  address: '',
  carrier: '' as string,
  trackingNumber: '',
  notes: '',
  items: [{ sku: '', quantity: 1, name: '' }],
};

// ==================== 辅助函数 ====================

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

// ==================== 主页面组件 ====================

export default function FulfillmentPage() {
  const [orders, setOrders] = useState<FulfillmentOrder[]>(MOCK_ORDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FulfillmentStatus | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<FulfillmentOrder | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── 搜索过滤 ──
  const searchFields = useMemo<(keyof FulfillmentOrder)[]>(
    () => ['orderId', 'memberName', 'contactPhone', 'address', 'carrier', 'trackingNumber', 'notes'],
    [],
  );
  const { filteredItems: searchedItems } = useSearchFilter(orders, searchFields, searchQuery);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return searchedItems;
    return searchedItems.filter(o => o.status === statusFilter);
  }, [searchedItems, statusFilter]);

  // ── 排序与分页 ──
  const columns = useMemo(() => buildColumns({ onEdit }), []);
  const sorted = useSortedItems(filteredOrders, columns, sortConfig);
  const pagination = usePagination({ initialPageSize: 10 });
  const pageItems = pagination.paginate(sorted);

  // ── 统计 ──
  const stats = useMemo(() => {
    const all = orders;
    return {
      total: all.length,
      pending: all.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
      shipping: all.filter(o => o.status === 'picking' || o.status === 'packed' || o.status === 'shipped').length,
      delivered: all.filter(o => o.status === 'delivered').length,
      issues: all.filter(o => o.status === 'cancelled' || o.status === 'returned').length,
      totalAmount: all.reduce((s, o) => s + o.totalAmount, 0),
    };
  }, [orders]);

  // ── 表单校验 ──
  const validateForm = useCallback((data: typeof DEFAULT_FORM): boolean => {
    const errors: Record<string, string> = {};
    if (!data.memberName.trim()) errors.memberName = '会员姓名不能为空';
    if (!data.contactPhone.trim()) errors.contactPhone = '联系电话不能为空';
    else if (!/^1\d{10}$/.test(data.contactPhone.trim())) errors.contactPhone = '请输入有效手机号';
    if (!data.address.trim()) errors.address = '收货地址不能为空';
    if (data.items.length === 0 || data.items.every(it => !it.sku.trim())) errors.items = '至少需要一个商品';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  // ── 创建履约单 ──
  const handleCreate = useCallback(() => {
    if (!validateForm(formData)) return;
    const newOrder: FulfillmentOrder = {
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      status: 'pending',
      items: formData.items.filter(it => it.sku.trim()),
      shippingMethod: formData.shippingMethod,
      address: formData.address,
      estimatedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      actualDeliveryDate: null,
      carrier: formData.carrier,
      trackingNumber: formData.trackingNumber,
      notes: formData.notes,
      totalAmount: 0,
      memberName: formData.memberName,
      contactPhone: formData.contactPhone,
    };
    setOrders(prev => [newOrder, ...prev]);
    setShowCreateModal(false);
    setFormData(DEFAULT_FORM);
    setFeedback({ type: 'success', message: `履约单 ${newOrder.orderId} 已创建` });
  }, [formData, validateForm]);

  // ── 编辑履约单 ──
  function onEdit(order: FulfillmentOrder) {
    setEditingOrder(order);
    setFormData({
      memberName: order.memberName,
      contactPhone: order.contactPhone,
      shippingMethod: order.shippingMethod,
      address: order.address,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      notes: order.notes,
      items: order.items,
    });
    setFormErrors({});
    setShowEditModal(true);
  }

  const handleUpdate = useCallback(() => {
    if (!editingOrder || !validateForm(formData)) return;
    setOrders(prev =>
      prev.map(o =>
        o.orderId === editingOrder.orderId
          ? {
              ...o,
              memberName: formData.memberName,
              contactPhone: formData.contactPhone,
              shippingMethod: formData.shippingMethod,
              address: formData.address,
              carrier: formData.carrier,
              trackingNumber: formData.trackingNumber,
              notes: formData.notes,
              items: formData.items.filter(it => it.sku.trim()),
            }
          : o,
      ),
    );
    setShowEditModal(false);
    setEditingOrder(null);
    setFormData(DEFAULT_FORM);
    setFeedback({ type: 'success', message: `履约单 ${editingOrder.orderId} 已更新` });
  }, [editingOrder, formData, validateForm]);

  // ── 批量操作 ──
  const handleBatchShip = useCallback(() => {
    setOrders(prev =>
      prev.map(o => (selectedIds.has(o.orderId) && o.status === 'packed' ? { ...o, status: 'shipped' as const } : o)),
    );
    setFeedback({ type: 'success', message: `已发货 ${selectedIds.size} 单` });
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleBatchExport = useCallback(() => {
    const selected = orders.filter(o => selectedIds.has(o.orderId));
    const csv = ['orderId,status,memberName,totalAmount,address'].concat(
      selected.map(o => `${o.orderId},${o.status},${o.memberName},${o.totalAmount},${o.address}`),
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fulfillment-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [orders, selectedIds]);

  const handleRefresh = useCallback(() => {
    setFeedback({ type: 'success', message: '数据已刷新' });
  }, []);

  // ── 状态变更 ──
  const handleStatusChange = useCallback((orderId: string, newStatus: FulfillmentStatus) => {
    setOrders(prev =>
      prev.map(o => (o.orderId === orderId ? { ...o, status: newStatus } : o)),
    );
  }, []);

  return (
    <PageShell title="📦 履约管理" subtitle="订单履约流程与配送管理">
      {/* 统计面板 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard title="履约单总数" value={stats.total.toString()} secondary={`代履约 ${stats.pending}`} />
        <StatCard title="配送中" value={stats.shipping.toString()} secondary="拣货/打包/配送" />
        <StatCard title="已完成" value={stats.delivered.toString()} secondary={`总金额 ${formatMoney(stats.totalAmount)}`} tone="success" />
        <StatCard title="异常单" value={stats.issues.toString()} secondary="取消/退货" tone="danger" />
      </div>

      {/* 反馈 */}
      {feedback && (
        <FormSubmitFeedback
          success={feedback.type === 'success' ? feedback.message : undefined}
          error={feedback.type === 'error' ? feedback.message : undefined}
          onDismissSuccess={() => setFeedback(null)}
          onDismissError={() => setFeedback(null)}
        />
      )}

      {/* 工具栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchFilterInput
          placeholder="搜索单号/会员/地址..."
          value={searchQuery}
          onChange={setSearchQuery}
          width="auto"
        />
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as FulfillmentStatus | 'ALL')}
          options={[
            { value: 'ALL', label: '全部状态' },
            ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
        />
        <div style={{ flex: 1 }} />
        <SubmitButton label="＋ 创建履约单" variant="primary" onClick={() => { setFormData(DEFAULT_FORM); setFormErrors({}); setShowCreateModal(true); }} />
        <Button variant="outline" onClick={handleRefresh}>🔄 刷新</Button>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>已选 {selectedIds.size} 单</span>
          <Button variant="primary" size="sm" onClick={handleBatchShip}>批量发货</Button>
          <Button variant="outline" size="sm" onClick={handleBatchExport}>导出选中</Button>
          <Button variant="text" size="sm" onClick={() => setSelectedIds(new Set())}>取消选择</Button>
        </div>
      )}

      {/* 履约单表格 */}
      <DataTable
        title={`履约单 (${filteredOrders.length})`}
        columns={columns}
        items={pageItems}
        rowKey={(o) => o.orderId}
        sort={sortConfig}
        onSortChange={setSortConfig}
        striped
        compact
        selectable
        selectedKeys={selectedIds}
        onSelectionChange={(keys) => setSelectedIds(new Set(Array.from(keys)))}
        emptyText={searchQuery || statusFilter !== 'ALL' ? '没有匹配的履约单' : '暂无履约单'}
      />

      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={filteredOrders.length}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />

      {/* 创建履约单 Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建履约单"
        width={640}
      >
        <OrderForm
          formData={formData}
          onChange={setFormData}
          errors={formErrors}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <SubmitButton label="取消" variant="secondary" onClick={() => setShowCreateModal(false)} />
          <SubmitButton label="创建履约单" variant="primary" onClick={handleCreate} />
        </div>
      </Modal>

      {/* 编辑履约单 Modal */}
      <Modal
        open={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingOrder(null); }}
        title={`编辑履约单 ${editingOrder?.orderId ?? ''}`}
        width={640}
      >
        <OrderForm
          formData={formData}
          onChange={setFormData}
          errors={formErrors}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <SubmitButton label="取消" variant="secondary" onClick={() => { setShowEditModal(false); setEditingOrder(null); }} />
          <SubmitButton label="保存修改" variant="primary" onClick={handleUpdate} />
        </div>
      </Modal>
    </PageShell>
  );
}

// ==================== 列定义 ====================

function buildColumns({ onEdit }: { onEdit: (order: FulfillmentOrder) => void }) {
  const columns: DataTableColumn<FulfillmentOrder>[] = [
    {
      key: 'orderId',
      title: '单号',
      dataKey: 'orderId',
      sortable: true,
      width: 140,
      render: (item) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>{item.orderId}</span>
      ),
    },
    {
      key: 'memberName',
      title: '会员',
      dataKey: 'memberName',
      sortable: true,
      width: 100,
    },
    {
      key: 'status',
      title: '状态',
      sortValue: (item) => item.status,
      width: 100,
      render: (item) => (
        <StatusBadge
          label={STATUS_CONFIG[item.status].label}
          variant={STATUS_CONFIG[item.status].variant}
          size="sm"
          dot
        />
      ),
    },
    {
      key: 'shippingMethod',
      title: '配送方式',
      dataKey: 'shippingMethod',
      width: 100,
      render: (item) => SHIPPING_LABELS[item.shippingMethod],
    },
    {
      key: 'carrier',
      title: '承运商',
      dataKey: 'carrier',
      sortable: true,
      width: 100,
    },
    {
      key: 'trackingNumber',
      title: '运单号',
      dataKey: 'trackingNumber',
      width: 120,
      render: (item) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: item.trackingNumber ? '#94a3b8' : '#666' }}>
          {item.trackingNumber || '—'}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      title: '金额',
      dataKey: 'totalAmount',
      sortable: true,
      align: 'right',
      width: 100,
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#22c55e' }}>{formatMoney(item.totalAmount)}</span>
      ),
    },
    {
      key: 'estimatedDeliveryDate',
      title: '预计送达',
      dataKey: 'estimatedDeliveryDate',
      sortable: true,
      width: 110,
    },
    {
      key: 'actions',
      title: '操作',
      width: 120,
      render: (item) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {item.status === 'pending' && (
            <Button size="xs" variant="primary" onClick={() => {}}>确认</Button>
          )}
          {item.status === 'packed' && (
            <Button size="xs" variant="primary" onClick={() => {}}>发货</Button>
          )}
          <Button size="xs" variant="outline" onClick={() => onEdit(item)}>编辑</Button>
        </div>
      ),
    },
  ];
  return columns;
}

// ==================== 履约单表单 ====================

function OrderForm({
  formData,
  onChange,
  errors,
}: {
  formData: typeof DEFAULT_FORM;
  onChange: (d: typeof DEFAULT_FORM) => void;
  errors: Record<string, string>;
}) {
  const update = (partial: Partial<typeof DEFAULT_FORM>) => onChange({ ...formData, ...partial });

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="会员姓名" error={errors.memberName} required>
          <input
            type="text"
            value={formData.memberName}
            onChange={(e) => update({ memberName: e.target.value })}
            placeholder="会员姓名"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          />
        </FormField>
        <FormField label="联系电话" error={errors.contactPhone} required>
          <input
            type="text"
            value={formData.contactPhone}
            onChange={(e) => update({ contactPhone: e.target.value })}
            placeholder="手机号"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          />
        </FormField>
      </div>

      <FormField label="配送方式" required>
        <select
          value={formData.shippingMethod}
          onChange={(e) => update({ shippingMethod: e.target.value as ShippingMethod })}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
        >
          {Object.entries(SHIPPING_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </FormField>

      <FormField label="收货地址" error={errors.address} required>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => update({ address: e.target.value })}
          placeholder="详细地址"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
        />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="承运商">
          <select
            value={formData.carrier}
            onChange={(e) => update({ carrier: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          >
            <option value="">选择承运商</option>
            {CARRIER_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>
        <FormField label="运单号">
          <input
            type="text"
            value={formData.trackingNumber}
            onChange={(e) => update({ trackingNumber: e.target.value })}
            placeholder="运单号"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          />
        </FormField>
      </div>

      <FormField label="备注">
        <textarea
          value={formData.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="备注信息"
          rows={2}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9', resize: 'vertical' }}
        />
      </FormField>
    </div>
  );
}
