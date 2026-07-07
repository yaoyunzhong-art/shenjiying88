'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 配送员今日统计 */
export interface DeliveryDailyStats {
  /** 配送订单总数 */
  totalOrders: number;
  /** 已完成数 */
  completedOrders: number;
  /** 配送中数 */
  inTransitOrders: number;
  /** 延迟数 */
  delayedOrders: number;
  /** 总配送里程 (km) */
  totalDistance: number;
  /** 平均配送时长 (分钟) */
  avgDeliveryMin: number;
  /** 客户评分 (1-5) */
  avgRating: number;
}

/** 配送订单项 */
export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  estimatedTime: string;
  actualTime?: string;
  priority: 'normal' | 'urgent';
  note?: string;
}

/** 配送路线节点 */
export interface RouteStop {
  stopId: string;
  orderId: string;
  customerName: string;
  address: string;
  /** 预计到达时间 */
  eta: string;
  /** 排序序号 */
  sequence: number;
  status: 'pending' | 'arrived' | 'delivered' | 'skipped';
}

/** 配送员工作台 Props */
export interface DeliveryPersonDashboardProps {
  /** 今日统计 */
  dailyStats?: DeliveryDailyStats;
  /** 配送订单列表 */
  orders?: DeliveryOrder[];
  /** 路线规划 */
  route?: RouteStop[];
  /** 配送员姓名 */
  driverName?: string;
  /** 配送员编号 */
  driverId?: string;
  /** 车辆/设备编号 */
  vehicleId?: string;
  /** 最后同步时间 */
  lastSyncAt?: string;
  /** 加载中 */
  loading?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 点击开始配送回调 */
  onStartDelivery?: (orderId: string) => void;
  /** 点击完成配送回调 */
  onCompleteDelivery?: (orderId: string) => void;
  /** 点击标记异常回调 */
  onReportIssue?: (orderId: string) => void;
  /** 点击开始导航回调 */
  onNavigate?: (orderId: string, address: string) => void;
}

// ---- 默认样式常量 ----

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 24,
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 12,
  color: '#1a1a2e',
};

const CARD: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,.06)',
  padding: 16,
};

const DRIVER_HEADER: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
};

const DRIVER_INFO: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const DRIVER_AVATAR: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 700,
  fontSize: 18,
};

const BADGE_CONTAINER: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
};

const LIVE_BADGE: React.CSSProperties = {
  ...BADGE_CONTAINER,
  background: '#e8f5e9',
  color: '#2e7d32',
};

const URGENT_BADGE: React.CSSProperties = {
  ...BADGE_CONTAINER,
  background: '#fce4ec',
  color: '#c62828',
};

const ORDER_CARD: React.CSSProperties = {
  ...CARD,
  marginBottom: 8,
  border: '1px solid #eee',
};

const ORDER_HEADER: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
};

const ORDER_NUMBER_STYLE: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 14,
  color: '#1a1a2e',
};

const CUSTOMER_INFO: React.CSSProperties = {
  fontSize: 13,
  color: '#666',
  lineHeight: 1.6,
};

const ACTIONS_ROW: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 10,
  flexWrap: 'wrap',
};

const ACTION_BUTTON_BASE: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'default',
  border: 'none',
};

const PRIMARY_BUTTON: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  background: '#667eea',
  color: '#fff',
};

const DANGER_BUTTON: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  background: '#fce4ec',
  color: '#c62828',
};

const OUTLINE_BUTTON: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  background: '#f5f5f5',
  color: '#333',
  border: '1px solid #ddd',
};

const ROUTE_LIST: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const ROUTE_ITEM: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid #f0f0f0',
};

const ROUTE_DOT: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: '50%',
  marginTop: 4,
  flexShrink: 0,
};

// ---- 状态映射 ----

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' | 'error' }> = {
  pending: { label: '待取件', variant: 'warning' },
  picked_up: { label: '已取件', variant: 'info' },
  in_transit: { label: '配送中', variant: 'info' },
  delivered: { label: '已送达', variant: 'success' },
  failed: { label: '配送失败', variant: 'error' },
  cancelled: { label: '已取消', variant: 'neutral' },
};

const ROUTE_STATUS_LABELS: Record<string, string> = {
  pending: '待到达',
  arrived: '已到达',
  delivered: '已送达',
  skipped: '已跳过',
};

// ---- 组件 ----

/**
 * 配送员工作台
 *
 * 为配送/送货人员提供每日工作概览、订单管理和路线规划功能。
 */
export const DeliveryPersonDashboard: React.FC<DeliveryPersonDashboardProps> = ({
  dailyStats,
  orders,
  route,
  driverName = '配送员',
  driverId,
  vehicleId,
  lastSyncAt,
  loading = false,
  compact = false,
  className,
  onStartDelivery,
  onCompleteDelivery,
  onReportIssue,
  onNavigate,
}) => {
  if (loading) {
    return (
      <div style={{ padding: 16 }} className={className} data-testid="delivery-person-dashboard-loading">
        <div style={{ height: 44, background: '#f0f0f0', borderRadius: 8, marginBottom: 16 }} />
        <div style={{ height: 80, background: '#f0f0f0', borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 80, background: '#f0f0f0', borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 80, background: '#f0f0f0', borderRadius: 8 }} />
      </div>
    );
  }

  // ── 统计指标 ──
  const statItems: QuickStatItem[] = dailyStats
    ? [
        { label: '今日订单', value: dailyStats.totalOrders, trend: 0 },
        { label: '已完成', value: dailyStats.completedOrders, trend: 0 },
        { label: '配送中', value: dailyStats.inTransitOrders, trend: 0 },
        { label: '延迟', value: dailyStats.delayedOrders, trend: dailyStats.delayedOrders > 0 ? -Math.abs(dailyStats.delayedOrders) : 0 },
        { label: '里程(km)', value: Math.round(dailyStats.totalDistance * 10) / 10, trend: 0 },
        { label: '评分', value: dailyStats.avgRating.toFixed(1), trend: 0 },
      ]
    : [];

  // ── 订单表格列 ──
  const orderColumns: DataTableColumn<DeliveryOrder>[] = [
    { key: 'orderNumber', header: '订单号', width: compact ? '90' : '120' },
    {
      key: 'customerName',
      header: '客户',
      width: compact ? '70' : '100',
      render: (row) => (
        <div>
          <div>{row.customerName}</div>
          <div style={{ fontSize: 11, color: '#999' }}>{row.customerPhone}</div>
        </div>
      ),
    },
    {
      key: 'address',
      header: '地址',
      width: compact ? '100' : '180',
      render: (row) => (
        <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: compact ? 100 : 180 }}>
          {row.address}
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      width: compact ? '60' : '80',
      render: (row) => {
        const s = STATUS_MAP[row.status] || { label: row.status, variant: 'neutral' as const };
        return <StatusBadge variant={s.variant} label={s.label} />;
      },
    },
    {
      key: 'estimatedTime',
      header: '预计',
      width: compact ? '70' : '90',
    },
    {
      key: 'actions',
      header: compact ? '' : '操作',
      width: compact ? '60' : '160',
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {row.status === 'picked_up' && (
            <button
              style={PRIMARY_BUTTON}
              onClick={(e) => {
                e.stopPropagation();
                onStartDelivery?.(row.id);
              }}
            >
              出发
            </button>
          )}
          {row.status === 'in_transit' && (
            <button
              style={{ ...ACTION_BUTTON_BASE, background: '#e8f5e9', color: '#2e7d32' }}
              onClick={(e) => {
                e.stopPropagation();
                onCompleteDelivery?.(row.id);
              }}
            >
              送达
            </button>
          )}
          <button
            style={{ ...OUTLINE_BUTTON, padding: '6px 8px', fontSize: 12 }}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.(row.id, row.address);
            }}
          >
            🧭
          </button>
        </div>
      ),
    },
  ];

  // ── 紧急订单列表 (卡片视图) ──
  const urgentOrders = orders?.filter((o) => o.priority === 'urgent' && o.status !== 'delivered' && o.status !== 'cancelled') || [];

  // ── 路线 ──
  const currentStop = route?.find((s) => s.status === 'pending' || s.status === 'arrived');

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} className={className}>
      {/* ── 配送员信息头部 ── */}
      <div style={DRIVER_HEADER}>
        <div style={DRIVER_INFO}>
          <div style={DRIVER_AVATAR}>
            {driverName.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{driverName}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
              {driverId && `工号 ${driverId}`}
              {vehicleId && ` · ${vehicleId}`}
            </div>
          </div>
        </div>
        <div>
          <span style={LIVE_BADGE}>🟢 在线</span>
        </div>
      </div>

      {/* ── 当前节点提示 ── */}
      {currentStop && (
        <div style={{ ...CARD, marginBottom: 16, border: '1px solid #667eea', background: '#f8f9ff' }}>
          <div style={{ fontSize: 13, color: '#667eea', fontWeight: 500, marginBottom: 4 }}>
            当前任务 #{currentStop.sequence}
          </div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {currentStop.customerName}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
            {currentStop.address}
          </div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            ETA: {currentStop.eta}
          </div>
        </div>
      )}

      {/* ── 统计数据 ── */}
      {dailyStats && (
        <div style={SECTION_STYLE}>
          <div style={SECTION_TITLE}>今日概览</div>
          <QuickStats items={statItems} columns={compact ? 2 : 3} />
        </div>
      )}

      {/* ── 紧急订单 ── */}
      {urgentOrders.length > 0 && (
        <div style={SECTION_STYLE}>
          <div style={{ ...SECTION_TITLE, color: '#c62828' }}>🔴 紧急订单 ({urgentOrders.length})</div>
          {urgentOrders.map((order) => (
            <div key={order.id} style={{ ...ORDER_CARD, borderLeft: '3px solid #c62828' }}>
              <div style={ORDER_HEADER}>
                <span style={ORDER_NUMBER_STYLE}>{order.orderNumber}</span>
                <span style={URGENT_BADGE}>紧急</span>
              </div>
              <div style={CUSTOMER_INFO}>
                <div>{order.customerName} · {order.customerPhone}</div>
                <div>{order.address}</div>
                <div style={{ marginTop: 4 }}>预计: {order.estimatedTime}</div>
                {order.note && <div style={{ marginTop: 4, color: '#f57c00', fontSize: 12 }}>📝 {order.note}</div>}
              </div>
              <div style={ACTIONS_ROW}>
                {order.status === 'picked_up' && (
                  <button style={PRIMARY_BUTTON} onClick={() => onStartDelivery?.(order.id)}>开始配送</button>
                )}
                {order.status === 'in_transit' && (
                  <button style={{ ...ACTION_BUTTON_BASE, background: '#e8f5e9', color: '#2e7d32' }} onClick={() => onCompleteDelivery?.(order.id)}>确认送达</button>
                )}
                <button style={DANGER_BUTTON} onClick={() => onReportIssue?.(order.id)}>异常上报</button>
                <button style={OUTLINE_BUTTON} onClick={() => onNavigate?.(order.id, order.address)}>导航</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 订单列表 ── */}
      {orders && orders.length > 0 && (
        <div style={SECTION_STYLE}>
          <div style={SECTION_TITLE}>配送订单</div>
          <DataTable
            data={orders}
            columns={orderColumns}
            rowKey={(order: DeliveryOrder) => order.id}
            compact={compact}
          />
        </div>
      )}

      {/* ── 路线规划 ── */}
      {route && route.length > 0 && (
        <div style={SECTION_STYLE}>
          <div style={SECTION_TITLE}>
            路线规划
            {lastSyncAt && (
              <span style={{ fontSize: 12, color: '#999', fontWeight: 400, marginLeft: 8 }}>
                最后同步 {lastSyncAt}
              </span>
            )}
          </div>
          <div style={CARD}>
            <ul style={ROUTE_LIST}>
              {route.map((stop) => {
                const dotColor =
                  stop.status === 'delivered' ? '#4caf50' :
                  stop.status === 'arrived' ? '#667eea' :
                  stop.status === 'skipped' ? '#bbb' :
                  '#e0e0e0';
                return (
                  <li key={stop.stopId} style={ROUTE_ITEM}>
                    <div style={{ ...ROUTE_DOT, background: dotColor }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>#{stop.sequence} {stop.customerName}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>{ROUTE_STATUS_LABELS[stop.status] || stop.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{stop.address}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>ETA: {stop.eta}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* ── 空状态 ── */}
      {!orders && !route && !dailyStats && (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div>暂无配送任务</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>今日配送数据将在接单后显示</div>
        </div>
      )}

      {/* ── 底线 ── */}
      {lastSyncAt && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#ccc', padding: '12px 0' }}>
          数据同步于 {lastSyncAt}
        </div>
      )}
    </div>
  );
};

export default DeliveryPersonDashboard;
