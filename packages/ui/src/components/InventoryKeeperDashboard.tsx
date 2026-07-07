'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 库房概览指标 */
export interface WarehouseMetrics {
  /** 总 SKU 数量 */
  totalSku: number;
  /** 在库总件数 */
  totalStock: number;
  /** 今日入库单数量 */
  todayInbound: number;
  /** 今日出库单数量 */
  todayOutbound: number;
  /** 库存金额 (元) */
  stockValue: number;
  /** 低库存预警数量 */
  lowStockCount: number;
  /** 过期预警数量 */
  expiryWarningCount: number;
  /** 库位利用率 (0-1) */
  locationUtilization: number;
}

/** 库存预警项 */
export interface StockAlert {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentQty: number;
  minQty: number;
  status: 'low_stock' | 'overstock' | 'expiring' | 'expired';
  updatedAt: string;
  location: string;
}

/** 入库待处理单 */
export interface InboundTask {
  id: string;
  orderNo: string;
  supplier: string;
  skuCount: number;
  totalQty: number;
  status: 'pending' | 'inspecting' | 'shelving' | 'completed';
  createdAt: string;
  expectedAt?: string;
  operator?: string;
}

/** 出库待处理单 */
export interface OutboundTask {
  id: string;
  orderNo: string;
  destination: string;
  skuCount: number;
  totalQty: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'picking' | 'packing' | 'shipped';
  createdAt: string;
  deadline?: string;
}

/** 快速操作 */
export interface KeeperQuickAction {
  key: string;
  label: string;
  icon?: string;
  primary?: boolean;
  onClick?: () => void;
}

/** 仓库管理员工作台 Props */
export interface InventoryKeeperDashboardProps {
  /** 库房名称 */
  warehouseName?: string;
  /** 库房概览指标 */
  metrics?: WarehouseMetrics;
  /** 库存预警列表 */
  stockAlerts?: StockAlert[];
  /** 入库待处理单 */
  inboundTasks?: InboundTask[];
  /** 出库待处理单 */
  outboundTasks?: OutboundTask[];
  /** 快速操作 */
  quickActions?: KeeperQuickAction[];
  /** 加载状态 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
}

// ---- 常量 ----

const STATUS_LABELS: Record<string, string> = {
  low_stock: '低库存',
  overstock: '超库存',
  expiring: '临期',
  expired: '已过期',
};

const STATUS_VARIANTS: Record<string, 'warning' | 'danger' | 'info' | 'neutral'> = {
  low_stock: 'warning',
  overstock: 'info',
  expiring: 'warning',
  expired: 'danger',
};

const INBOUND_STATUS_LABELS: Record<string, string> = {
  pending: '待验收',
  inspecting: '质检中',
  shelving: '上架中',
  completed: '已完成',
};

const OUTBOUND_STATUS_LABELS: Record<string, string> = {
  pending: '待拣货',
  picking: '拣货中',
  packing: '打包中',
  shipped: '已发货',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#16a34a',
};

// ---- 子组件: 预警卡片 ----

function AlertBadge({ status }: { status: string }) {
  const bg: Record<string, string> = {
    low_stock: '#fef3c7',
    overstock: '#dbeafe',
    expiring: '#fef3c7',
    expired: '#fef2f2',
  };
  const fg: Record<string, string> = {
    low_stock: '#92400e',
    overstock: '#1e40af',
    expiring: '#92400e',
    expired: '#991b1b',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: bg[status] ?? '#f1f5f9',
        color: fg[status] ?? '#475569',
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ---- 主组件 ----

export function InventoryKeeperDashboard({
  warehouseName = '默认仓库',
  metrics,
  stockAlerts = [],
  inboundTasks = [],
  outboundTasks = [],
  quickActions = [],
  loading = false,
  error,
}: InventoryKeeperDashboardProps) {
  // ── 加载态 ──
  if (loading) {
    return (
      <div data-testid="keeper-loading" style={{ padding: '32px', textAlign: 'center' }}>
        <div
          style={{
            width: '120px',
            height: '12px',
            background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '6px',
            margin: '0 auto 24px',
            animation: 'shimmer 1.5s infinite',
          }}
        />
        <div style={{ color: '#94a3b8', fontSize: '14px' }}>正在加载库存数据...</div>
      </div>
    );
  }

  // ── 错误态 ──
  if (error) {
    return (
      <div data-testid="keeper-error" style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
        <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '8px' }}>{error}</div>
        <button
          data-testid="keeper-retry"
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
          }}
          onClick={() => window.location.reload()}
        >
          重试
        </button>
      </div>
    );
  }

  // ── 概览指标 ──
  const statItems: QuickStatItem[] = metrics
    ? [
        { label: '总 SKU', value: metrics.totalSku.toLocaleString() },
        { label: '在库件数', value: metrics.totalStock.toLocaleString() },
        { label: '今日入库', value: metrics.todayInbound },
        { label: '今日出库', value: metrics.todayOutbound },
        { label: '库存金额', value: `¥${(metrics.stockValue / 10000).toFixed(1)}万` },
        { label: '库位利用率', value: `${(metrics.locationUtilization * 100).toFixed(0)}%` },
      ]
    : [];

  // ── 库存预警表格列 ──
  const alertColumns: DataTableColumn<StockAlert>[] = [
    { key: 'sku', header: 'SKU', width: '100px', render: (r) => r.sku },
    { key: 'name', header: '名称', render: (r) => r.name },
    { key: 'category', header: '分类', width: '90px', render: (r) => r.category },
    { key: 'currentQty', header: '当前库存', width: '90px', render: (r) => r.currentQty.toLocaleString() },
    { key: 'minQty', header: '安全库存', width: '90px', render: (r) => r.minQty.toLocaleString() },
    {
      key: 'status',
      header: '状态',
      width: '90px',
      render: (row) => <AlertBadge status={row.status} />,
    },
    { key: 'location', header: '库位', width: '90px', render: (r) => r.location },
  ];

  // ── 入库单表格列 ──
  const inboundColumns: DataTableColumn<InboundTask>[] = [
    { key: 'orderNo', header: '入库单号', width: '130px', render: (r) => r.orderNo },
    { key: 'supplier', header: '供应商', render: (r) => r.supplier },
    { key: 'skuCount', header: 'SKU数', width: '70px', render: (r) => r.skuCount.toLocaleString() },
    { key: 'totalQty', header: '总件数', width: '70px', render: (r) => r.totalQty.toLocaleString() },
    {
      key: 'status',
      header: '状态',
      width: '80px',
      render: (row) => (
        <StatusBadge label={INBOUND_STATUS_LABELS[row.status] ?? row.status} variant={row.status === 'completed' ? 'success' : row.status === 'pending' ? 'pending' : 'info'} />
      ),
    },
    { key: 'operator', header: '操作人', width: '80px', render: (r) => r.operator ?? '-' },
  ];

  // ── 出库单表格列 ──
  const outboundColumns: DataTableColumn<OutboundTask>[] = [
    { key: 'orderNo', header: '出库单号', width: '130px', render: (r) => r.orderNo },
    { key: 'destination', header: '目的地', render: (r) => r.destination },
    { key: 'skuCount', header: 'SKU数', width: '70px', render: (r) => r.skuCount.toLocaleString() },
    { key: 'totalQty', header: '总件数', width: '70px', render: (r) => r.totalQty.toLocaleString() },
    {
      key: 'priority',
      header: '优先级',
      width: '70px',
      render: (row) => (
        <React.Fragment>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: PRIORITY_COLORS[row.priority] ?? '#94a3b8',
              marginRight: 4,
              verticalAlign: 'middle',
            }}
          />
          <span style={{ verticalAlign: 'middle' }}>{row.priority}</span>
        </React.Fragment>
      ),
    },
    {
      key: 'status',
      header: '状态',
      width: '80px',
      render: (row) => (
        <StatusBadge label={OUTBOUND_STATUS_LABELS[row.status] ?? row.status} variant={row.status === 'shipped' ? 'success' : row.status === 'pending' ? 'pending' : 'info'} />
      ),
    },
  ];

  // ── 快速操作按钮 ──
  const actionGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px',
  };

  return (
    <div data-testid="keeper-dashboard" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* 标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            仓库工作台
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>{warehouseName}</span>
        </div>
        {metrics && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {metrics.lowStockCount > 0 && (
              <span style={{ fontSize: '13px', color: '#92400e', backgroundColor: '#fef3c7', padding: '4px 10px', borderRadius: '6px' }}>
                ⚠️ 低库存 {metrics.lowStockCount}
              </span>
            )}
            {metrics.expiryWarningCount > 0 && (
              <span style={{ fontSize: '13px', color: '#991b1b', backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '6px' }}>
                ⏰ 临期 {metrics.expiryWarningCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 快速操作 */}
      {quickActions.length > 0 && (
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#f0f9ff',
            borderRadius: '12px',
            border: '1px solid #bae6fd',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0369a1', marginBottom: '10px' }}>
            快速操作
          </div>
          <div style={actionGrid} data-testid="keeper-actions">
            {quickActions.map((act) => (
              <button
                key={act.key}
                data-testid={`keeper-action-${act.key}`}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: act.primary ? 'none' : '1px solid #e2e8f0',
                  backgroundColor: act.primary ? '#0284c7' : '#fff',
                  color: act.primary ? '#fff' : '#334155',
                  fontSize: '13px',
                  fontWeight: act.primary ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s',
                }}
                onClick={act.onClick}
              >
                {act.icon && <span style={{ fontSize: '20px' }}>{act.icon}</span>}
                <span>{act.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 概览指标 */}
      {metrics && (
        <div style={{ marginBottom: '20px' }}>
          <QuickStats items={statItems} columns={6} />
        </div>
      )}

      {/* 双列布局 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* 入库待处理 */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              fontWeight: 600,
              fontSize: '14px',
              color: '#0f172a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>📥 入库待处理</span>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
              共 {inboundTasks.length} 单
            </span>
          </div>
          {inboundTasks.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              暂无待处理入库单
            </div>
          ) : (
            <DataTable columns={inboundColumns} data={inboundTasks} rowKey={(row) => row.id} />
          )}
        </div>

        {/* 出库待处理 */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              fontWeight: 600,
              fontSize: '14px',
              color: '#0f172a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>📤 出库待处理</span>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
              共 {outboundTasks.length} 单
            </span>
          </div>
          {outboundTasks.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              暂无待处理出库单
            </div>
          ) : (
            <DataTable columns={outboundColumns} data={outboundTasks} rowKey={(row) => row.id} />
          )}
        </div>
      </div>

      {/* 库存预警 */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            fontWeight: 600,
            fontSize: '14px',
            color: '#0f172a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>🚨 库存预警</span>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
            共 {stockAlerts.length} 项
          </span>
        </div>
        {stockAlerts.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            暂无库存预警 🎉
          </div>
        ) : (
          <DataTable columns={alertColumns} data={stockAlerts} rowKey={(row) => row.id} />
        )}
      </div>
    </div>
  );
}
