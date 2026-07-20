/**
 * 后勤配送管理页 — Logistics Management Page
 * 角色视角：后勤主管 / 配送员 / 仓库管理员
 * 功能：采购单列表、搜索筛选、状态看板、三态覆盖
 */
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';

import {
  DataTable,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  PageShell,
  SubmitButton,
  Tabs,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

// ─── 类型定义 ──────────────────────────────────────────

export interface LogisticsOrder {
  id: string;
  orderNo: string;
  supplierName: string;
  supplierId: string;
  totalAmount: number;
  status: LogisticsOrderStatus;
  urgency: LogisticsUrgency;
  itemsCount: number;
  totalQuantity: number;
  orderDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  contactPerson: string;
  contactPhone: string;
  remark: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  storeCode: string;
  department: string;
  deliveryAddress: string;
}

export type LogisticsOrderStatus = 'pending' | 'confirmed' | 'shipped' | 'in_transit' | 'delivered' | 'returned' | 'cancelled';
export type LogisticsUrgency = 'normal' | 'urgent' | 'emergency';

export const LOGISTICS_STATUS_MAP: Record<LogisticsOrderStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'danger' | 'pending' | 'neutral' }> = {
  pending: { label: '待确认', variant: 'pending' },
  confirmed: { label: '已确认', variant: 'info' },
  shipped: { label: '已发货', variant: 'info' },
  in_transit: { label: '配送中', variant: 'warning' },
  delivered: { label: '已签收', variant: 'success' },
  returned: { label: '已退回', variant: 'danger' },
  cancelled: { label: '已取消', variant: 'neutral' },
};

export const LOGISTICS_URGENCY_MAP: Record<LogisticsUrgency, { label: string; variant: 'info' | 'warning' | 'danger' }> = {
  normal: { label: '普通', variant: 'info' },
  urgent: { label: '紧急', variant: 'warning' },
  emergency: { label: '特急', variant: 'danger' },
};

export const LOGISTICS_ORDER_STATUSES: LogisticsOrderStatus[] = [
  'pending', 'confirmed', 'shipped', 'in_transit', 'delivered', 'returned', 'cancelled',
];

export const LOGISTICS_ORDER_URGENCIES: LogisticsUrgency[] = ['normal', 'urgent', 'emergency'];

export const LOGISTICS_ORDER_SEARCH_FIELDS: (keyof LogisticsOrder)[] = [
  'orderNo', 'supplierName', 'contactPerson', 'department', 'storeCode', 'deliveryAddress',
];

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Mock 数据 ────────────────────────────────────────

export const MOCK_LOGISTICS_ORDERS: LogisticsOrder[] = [
  { id: 'log-001', orderNo: 'LOG-2026-0001', supplierName: '绿源食品有限公司', supplierId: 'sp-001', totalAmount: 86500, status: 'delivered', urgency: 'normal', itemsCount: 8, totalQuantity: 240, orderDate: '2026-07-01', expectedDelivery: '2026-07-05', actualDelivery: '2026-07-04', contactPerson: '王建国', contactPhone: '13800010001', remark: '月度常规配送', createdBy: '张建国', createdAt: '2026-07-01T09:00:00Z', updatedAt: '2026-07-04T14:30:00Z', storeCode: 'SH-001', department: '后厨', deliveryAddress: '北京市朝阳区建国路88号' },
  { id: 'log-002', orderNo: 'LOG-2026-0002', supplierName: '鼎盛包装科技有限公司', supplierId: 'sp-002', totalAmount: 32000, status: 'in_transit', urgency: 'urgent', itemsCount: 5, totalQuantity: 10000, orderDate: '2026-07-10', expectedDelivery: '2026-07-12', contactPerson: '李志强', contactPhone: '13800010002', remark: '外卖包装盒加急配送', createdBy: '李小红', createdAt: '2026-07-10T10:30:00Z', updatedAt: '2026-07-11T08:00:00Z', storeCode: 'SH-001', department: '前厅', deliveryAddress: '北京市朝阳区建国路88号' },
  { id: 'log-003', orderNo: 'LOG-2026-0003', supplierName: '鲜生活食材配送', supplierId: 'sp-004', totalAmount: 12800, status: 'confirmed', urgency: 'normal', itemsCount: 6, totalQuantity: 85, orderDate: '2026-07-15', expectedDelivery: '2026-07-18', contactPerson: '赵敏', contactPhone: '13800010004', remark: '周末活动特供食材', createdBy: '陈芳', createdAt: '2026-07-15T16:45:00Z', updatedAt: '2026-07-15T16:45:00Z', storeCode: 'SH-001', department: '后厨', deliveryAddress: '北京市朝阳区建国路88号' },
  { id: 'log-004', orderNo: 'LOG-2026-0004', supplierName: '海龙物流集团', supplierId: 'sp-003', totalAmount: 45500, status: 'shipped', urgency: 'urgent', itemsCount: 3, totalQuantity: 1, orderDate: '2026-07-12', expectedDelivery: '2026-07-14', contactPerson: '陈海', contactPhone: '13800010003', remark: '冷链配送服务', createdBy: '周涛', createdAt: '2026-07-12T11:20:00Z', updatedAt: '2026-07-13T09:15:00Z', storeCode: 'SH-002', department: '物流', deliveryAddress: '上海市浦东新区陆家嘴环路1000号' },
  { id: 'log-005', orderNo: 'LOG-2026-0005', supplierName: '欧风烘焙原料进口', supplierId: 'sp-016', totalAmount: 98000, status: 'pending', urgency: 'normal', itemsCount: 12, totalQuantity: 300, orderDate: '2026-07-18', expectedDelivery: '2026-07-25', contactPerson: '欧阳雪', contactPhone: '13800010016', remark: '进口烘焙原料', createdBy: '杨帆', createdAt: '2026-07-18T08:30:00Z', updatedAt: '2026-07-18T08:30:00Z', storeCode: 'SH-001', department: '西点房', deliveryAddress: '北京市朝阳区建国路88号' },
  { id: 'log-006', orderNo: 'LOG-2026-0006', supplierName: '星空科技服务有限公司', supplierId: 'sp-009', totalAmount: 25000, status: 'delivered', urgency: 'normal', itemsCount: 4, totalQuantity: 20, orderDate: '2026-07-05', expectedDelivery: '2026-07-08', actualDelivery: '2026-07-07', contactPerson: '林星辰', contactPhone: '13800010009', remark: '设备维护配件配送', createdBy: '黄志明', createdAt: '2026-07-05T14:00:00Z', updatedAt: '2026-07-07T11:30:00Z', storeCode: 'SH-002', department: 'IT', deliveryAddress: '上海市浦东新区陆家嘴环路1000号' },
  { id: 'log-007', orderNo: 'LOG-2026-0007', supplierName: '福瑞德咖啡设备有限公司', supplierId: 'sp-014', totalAmount: 156000, status: 'cancelled', urgency: 'emergency', itemsCount: 2, totalQuantity: 3, orderDate: '2026-07-08', expectedDelivery: '2026-07-10', contactPerson: '陈福瑞', contactPhone: '13800010014', remark: '设备维修（已取消，改为现场维修）', createdBy: '杨帆', createdAt: '2026-07-08T09:15:00Z', updatedAt: '2026-07-09T16:00:00Z', storeCode: 'SH-001', department: '设备维护', deliveryAddress: '北京市朝阳区建国路88号' },
  { id: 'log-008', orderNo: 'LOG-2026-0008', supplierName: '华北粮油批发市场', supplierId: 'sp-012', totalAmount: 67500, status: 'delivered', urgency: 'normal', itemsCount: 10, totalQuantity: 500, orderDate: '2026-07-03', expectedDelivery: '2026-07-06', actualDelivery: '2026-07-05', contactPerson: '郑大勇', contactPhone: '13800010012', remark: '米面油月度配送', createdBy: '王伟', createdAt: '2026-07-03T07:30:00Z', updatedAt: '2026-07-05T15:00:00Z', storeCode: 'SH-001', department: '后厨', deliveryAddress: '北京市朝阳区建国路88号' },
  { id: 'log-009', orderNo: 'LOG-2026-0009', supplierName: 'Global Trade Logistics Inc.', supplierId: 'sp-010', totalAmount: 320000, status: 'in_transit', urgency: 'urgent', itemsCount: 1, totalQuantity: 1, orderDate: '2026-07-01', expectedDelivery: '2026-07-20', contactPerson: 'John Miller', contactPhone: '14150001001', remark: '跨境物流季度服务', createdBy: 'James Smith', createdAt: '2026-07-01T10:00:00Z', updatedAt: '2026-07-15T12:00:00Z', storeCode: 'SH-002', department: '供应链', deliveryAddress: '上海市浦东新区陆家嘴环路1000号' },
  { id: 'log-010', orderNo: 'LOG-2026-0010', supplierName: '鲜生活食材配送', supplierId: 'sp-004', totalAmount: 9200, status: 'confirmed', urgency: 'emergency', itemsCount: 3, totalQuantity: 40, orderDate: '2026-07-19', expectedDelivery: '2026-07-20', contactPerson: '赵敏', contactPhone: '13800010004', remark: '店庆活动紧急补货', createdBy: '李小红', createdAt: '2026-07-19T19:00:00Z', updatedAt: '2026-07-19T19:00:00Z', storeCode: 'SH-001', department: '前厅', deliveryAddress: '北京市朝阳区建国路88号' },
  { id: 'log-011', orderNo: 'LOG-2026-0011', supplierName: '恒达包装材料厂', supplierId: 'sp-007', totalAmount: 15000, status: 'pending', urgency: 'normal', itemsCount: 4, totalQuantity: 5000, orderDate: '2026-07-16', expectedDelivery: '2026-07-22', contactPerson: '李恒', contactPhone: '13800010007', remark: '包装袋补货', createdBy: '张建国', createdAt: '2026-07-16T13:00:00Z', updatedAt: '2026-07-16T13:00:00Z', storeCode: 'SH-001', department: '前厅', deliveryAddress: '北京市朝阳区建国路88号' },
  { id: 'log-012', orderNo: 'LOG-2026-0012', supplierName: 'Eco Pack Solutions Ltd.', supplierId: 'sp-011', totalAmount: 78500, status: 'shipped', urgency: 'normal', itemsCount: 7, totalQuantity: 20000, orderDate: '2026-07-10', expectedDelivery: '2026-07-25', contactPerson: 'Sarah Connor', contactPhone: '12120001001', remark: '环保包装盒（出口订单）', createdBy: 'Emily Chen', createdAt: '2026-07-10T15:30:00Z', updatedAt: '2026-07-12T10:00:00Z', storeCode: 'SH-002', department: '出口贸易', deliveryAddress: '上海市浦东新区陆家嘴环路1000号' },
  { id: 'log-013', orderNo: 'LOG-2026-0013', supplierName: '西南冷链物流有限公司', supplierId: 'sp-013', totalAmount: 44000, status: 'confirmed', urgency: 'normal', itemsCount: 2, totalQuantity: 1, orderDate: '2026-07-14', expectedDelivery: '2026-07-21', contactPerson: '张凯', contactPhone: '13800010013', remark: '新供应商冷链试配送', createdBy: '周涛', createdAt: '2026-07-14T08:45:00Z', updatedAt: '2026-07-14T08:45:00Z', storeCode: 'SH-002', department: '供应链', deliveryAddress: '上海市浦东新区陆家嘴环路1000号' },
  { id: 'log-014', orderNo: 'LOG-2026-0014', supplierName: '鲜生活食材配送', supplierId: 'sp-004', totalAmount: 43200, status: 'returned', urgency: 'normal', itemsCount: 6, totalQuantity: 180, orderDate: '2026-07-06', expectedDelivery: '2026-07-09', actualDelivery: '2026-07-08', contactPerson: '赵敏', contactPhone: '13800010004', remark: '蔬菜水果配送（部分品质不符已退回）', createdBy: '张建国', createdAt: '2026-07-06T08:00:00Z', updatedAt: '2026-07-08T16:30:00Z', storeCode: 'SH-001', department: '后厨', deliveryAddress: '北京市朝阳区建国路88号' },
  { id: 'log-015', orderNo: 'LOG-2026-0015', supplierName: '嘉华物业管理有限公司', supplierId: 'sp-006', totalAmount: 12000, status: 'pending', urgency: 'normal', itemsCount: 3, totalQuantity: 6, orderDate: '2026-07-20', expectedDelivery: '2026-07-28', contactPerson: '周建华', contactPhone: '13800010006', remark: '清洁用品配送', createdBy: '周涛', createdAt: '2026-07-20T11:20:00Z', updatedAt: '2026-07-20T11:20:00Z', storeCode: 'SH-002', department: '后勤', deliveryAddress: '上海市浦东新区陆家嘴环路1000号' },
];

export function getLogisticsOrderById(id: string): LogisticsOrder | undefined {
  return MOCK_LOGISTICS_ORDERS.find((po) => po.id === id);
}

// ─── 统计函数 ─────────────────────────────────────────

export interface LogisticsStats {
  total: number;
  pending: number;
  confirmed: number;
  shipped: number;
  inTransit: number;
  delivered: number;
  returned: number;
  cancelled: number;
  urgentCount: number;
  emergencyCount: number;
  totalAmount: number;
  totalQuantity: number;
}

export function computeLogisticsStats(items: LogisticsOrder[]): LogisticsStats {
  const stats = { total: items.length, pending: 0, confirmed: 0, shipped: 0, inTransit: 0, delivered: 0, returned: 0, cancelled: 0, urgentCount: 0, emergencyCount: 0, totalAmount: 0, totalQuantity: 0 };
  for (const item of items) {
    switch (item.status) {
      case 'pending': stats.pending++; break;
      case 'confirmed': stats.confirmed++; break;
      case 'shipped': stats.shipped++; break;
      case 'in_transit': stats.inTransit++; break;
      case 'delivered': stats.delivered++; break;
      case 'returned': stats.returned++; break;
      case 'cancelled': stats.cancelled++; break;
    }
    if (item.urgency === 'urgent') stats.urgentCount++;
    else if (item.urgency === 'emergency') stats.emergencyCount++;
    stats.totalAmount += item.totalAmount;
    stats.totalQuantity += item.totalQuantity;
  }
  return stats;
}

// ─── 列定义 ────────────────────────────────────────────

function buildColumns(onRowClick: (item: LogisticsOrder) => void): DataTableColumn<LogisticsOrder>[] {
  return [
    {
      key: 'orderNo',
      title: '配送单号',
      dataKey: 'orderNo',
      sortable: true,
      render: (item: LogisticsOrder) => (
        <span
          onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
          style={{ color: '#93c5fd', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'monospace' }}
        >
          {item.orderNo}
        </span>
      ),
    },
    {
      key: 'supplierName',
      title: '供应商',
      dataKey: 'supplierName',
      sortable: true,
    },
    {
      key: 'totalAmount',
      title: '金额',
      dataKey: 'totalAmount',
      sortable: true,
      align: 'right',
      render: (item: LogisticsOrder) => (
        <span style={{ color: '#e2e8f0', fontWeight: 600, fontFamily: 'monospace' }}>
          ¥{formatCurrency(item.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      dataKey: 'status',
      sortable: true,
      render: (item: LogisticsOrder) => {
        const cfg = LOGISTICS_STATUS_MAP[item.status];
        return <StatusBadge label={cfg.label} variant={cfg.variant} />;
      },
    },
    {
      key: 'urgency',
      title: '紧急程度',
      dataKey: 'urgency',
      sortable: true,
      render: (item: LogisticsOrder) => {
        const cfg = LOGISTICS_URGENCY_MAP[item.urgency];
        return <StatusBadge label={cfg.label} variant={cfg.variant} />;
      },
    },
    {
      key: 'itemsCount',
      title: '品项数',
      dataKey: 'itemsCount',
      sortable: true,
      align: 'right',
    },
    {
      key: 'totalQuantity',
      title: '总数量',
      dataKey: 'totalQuantity',
      sortable: true,
      align: 'right',
    },
    {
      key: 'orderDate',
      title: '下单日期',
      dataKey: 'orderDate',
      sortable: true,
      render: (item: LogisticsOrder) => (
        <span style={{ color: '#94a3b8', fontSize: 12 }}>{item.orderDate}</span>
      ),
    },
    {
      key: 'expectedDelivery',
      title: '预计到货',
      dataKey: 'expectedDelivery',
      sortable: true,
      render: (item: LogisticsOrder) => (
        <span style={{ color: '#94a3b8', fontSize: 12 }}>{item.expectedDelivery}</span>
      ),
    },
    {
      key: 'department',
      title: '部门',
      dataKey: 'department',
      sortable: true,
      render: (item: LogisticsOrder) => (
        <span style={{ color: '#64748b', fontSize: 12 }}>{item.department}</span>
      ),
    },
  ];
}

// ─── 统计卡片 ──────────────────────────────────────────

function StatsCards({ stats }: { stats: LogisticsStats }) {
  const cards = [
    { label: '配送单总数', value: stats.total, color: '#60a5fa' },
    { label: '待确认', value: stats.pending, color: '#a78bfa' },
    { label: '配送中', value: stats.inTransit, color: '#fbbf24' },
    { label: '已签收', value: stats.delivered, color: '#34d399' },
    { label: '紧急单', value: stats.urgentCount + stats.emergencyCount, color: '#f87171' },
    { label: '配送总额', value: `¥${formatCurrency(stats.totalAmount)}`, color: '#e2e8f0' },
  ];

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            flex: '1 0 140px',
            borderRadius: 12,
            background: 'rgba(15,23,42,0.4)',
            border: '1px solid rgba(148,163,184,0.1)',
            padding: '14px 16px',
            minWidth: 100,
          }}
        >
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{card.label}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: card.color, fontFamily: 'monospace' }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab 定义 ──────────────────────────────────────────

interface StatusTab {
  key: LogisticsOrderStatus | 'all';
  label: string;
  count: number;
}

function buildTabs(stats: LogisticsStats): StatusTab[] {
  return [
    { key: 'all', label: '全部', count: stats.total },
    { key: 'pending', label: '待确认', count: stats.pending },
    { key: 'confirmed', label: '已确认', count: stats.confirmed },
    { key: 'shipped', label: '已发货', count: stats.shipped },
    { key: 'in_transit', label: '配送中', count: stats.inTransit },
    { key: 'delivered', label: '已签收', count: stats.delivered },
    { key: 'returned', label: '已退回', count: stats.returned },
    { key: 'cancelled', label: '已取消', count: stats.cancelled },
  ];
}

// ─── 详情侧面板 ────────────────────────────────────────

function OrderDetailPanel({ order, onClose }: { order: LogisticsOrder; onClose: () => void }) {
  const statusCfg = LOGISTICS_STATUS_MAP[order.status];
  const urgencyCfg = LOGISTICS_URGENCY_MAP[order.urgency];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 420,
        height: '100vh',
        background: 'rgba(15,23,42,0.95)',
        borderLeft: '1px solid rgba(148,163,184,0.2)',
        padding: 24,
        overflowY: 'auto',
        zIndex: 100,
        color: '#e2e8f0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>配送详情</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: '1px solid rgba(148,163,184,0.3)',
            color: '#94a3b8',
            borderRadius: 8,
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          关闭
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>配送单号</div>
          <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 600 }}>{order.orderNo}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>供应商</div>
          <div>{order.supplierName}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>状态</div>
          <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>紧急程度</div>
          <StatusBadge label={urgencyCfg.label} variant={urgencyCfg.variant} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>金额</div>
          <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'monospace' }}>¥{formatCurrency(order.totalAmount)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>品项数 / 总数量</div>
          <div>{order.itemsCount} 项 / {order.totalQuantity} 件</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>配送地址</div>
          <div style={{ fontSize: 13 }}>{order.deliveryAddress}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>联系人</div>
          <div>{order.contactPerson} ({order.contactPhone})</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>部门 / 门店</div>
          <div>{order.department} / {order.storeCode}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>下单日期</div>
          <div>{order.orderDate}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>预计到货</div>
          <div>{order.expectedDelivery}</div>
        </div>
        {order.actualDelivery && (
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>实际签收</div>
            <div>{order.actualDelivery}</div>
          </div>
        )}
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>备注</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>{order.remark}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>创建人</div>
          <div>{order.createdBy}</div>
        </div>
      </div>
    </div>
  );
}

// ─── 主页面组件 ────────────────────────────────────────

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState<LogisticsOrderStatus | 'all'>('all');
  const [_selectedIds] = useState<string[]>([]);
  const [detailOrder, setDetailOrder] = useState<LogisticsOrder | null>(null);

  // 模拟数据加载
  const allOrders = useMemo(() => MOCK_LOGISTICS_ORDERS, []);
  const stats = useMemo(() => computeLogisticsStats(allOrders), [allOrders]);

  // Tab 筛选
  const tabFiltered = useMemo(() => {
    if (activeTab === 'all') return allOrders;
    return allOrders.filter((po) => po.status === activeTab);
  }, [allOrders, activeTab]);

  // 搜索
  const { searchTerm, setSearchTerm, filteredItems: searched } = useSearchFilter(
    tabFiltered,
    LOGISTICS_ORDER_SEARCH_FIELDS,
  );

  // 行点击 — 展示详情侧面板
  const handleRowClick = useCallback((item: LogisticsOrder) => {
    setDetailOrder(item);
  }, []);

  // 排序
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({
    key: 'orderDate',
    direction: 'desc',
  });
  const columns = useMemo(() => buildColumns(handleRowClick), [handleRowClick]);
  const sorted = useSortedItems(searched, columns, sortConfig);

  // 分页
  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [10, 20, 50],
  });
  const pageItems = pagination.paginate(sorted);

  // 选中
  const _handleSelectionChange = (_ids: string[]) => {
    // selection managed internally
  };

  const tabs = useMemo(() => buildTabs(stats), [stats]);

  return (
    <PageShell
      title="后勤配送管理"
      description="管理门店采购配送订单，跟踪配送状态与签收记录"
    >
      {/* 统计卡片 */}
      <StatsCards stats={stats} />

      {/* 搜索 + ActionBar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, maxWidth: 380, minWidth: 200 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索配送单号 / 供应商 / 联系人..."
            width="100%"
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            共 {sorted.length} 条
          </span>
        </div>
      </div>

      {/* 状态 Tabs */}
      <Tabs<LogisticsOrderStatus | 'all'>
        items={tabs}
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          pagination.setPage(1);
        }}
      />

      {/* 数据表格 */}
      <DataTable<LogisticsOrder>
        columns={columns}
        rows={pageItems}
        sort={sortConfig}
        onSortChange={setSortConfig}
        onRowClick={handleRowClick}
        emptyText={searchTerm ? '未找到匹配的配送单' : '暂无配送单数据'}
        rowKey={(row: LogisticsOrder) => row.id}

      />

      {/* 分页 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={sorted.length}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </div>

      {/* 详情侧面板 */}
      {detailOrder && (
        <OrderDetailPanel order={detailOrder} onClose={() => setDetailOrder(null)} />
      )}
    </PageShell>
  );
}
