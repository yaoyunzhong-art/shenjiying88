'use client';

import React from 'react';
import {
  PageShell,
  InventoryKeeperDashboard,
  type WarehouseMetrics,
  type StockAlert,
  type InboundTask,
  type OutboundTask,
  type KeeperQuickAction,
  type InventoryKeeperDashboardProps,
} from '@m5/ui';

// ============================================================
// Mock 库房数据
// ============================================================

const MOCK_WAREHOUSE_METRICS: WarehouseMetrics = {
  totalSku: 1256,
  totalStock: 28430,
  todayInbound: 18,
  todayOutbound: 23,
  stockValue: 1864200,
  lowStockCount: 7,
  expiryWarningCount: 3,
  locationUtilization: 0.82,
};

const MOCK_STOCK_ALERTS: StockAlert[] = [
  {
    id: 'sa1', sku: 'SKU-089', name: '单品咖啡豆', category: '食品原料',
    currentQty: 3, minQty: 20, status: 'low_stock', updatedAt: '10:45', location: 'A-01-03',
  },
  {
    id: 'sa2', sku: 'SKU-124', name: '抹茶粉', category: '食品原料',
    currentQty: 2, minQty: 15, status: 'low_stock', updatedAt: '10:30', location: 'A-02-05',
  },
  {
    id: 'sa3', sku: 'SKU-312', name: '奶油芝士', category: '冷藏品',
    currentQty: 48, minQty: 10, status: 'expiring', updatedAt: '09:15', location: 'B-01-08',
  },
  {
    id: 'sa4', sku: 'SKU-047', name: '鲜牛奶', category: '冷藏品',
    currentQty: 200, minQty: 50, status: 'overstock', updatedAt: '08:00', location: 'B-02-01',
  },
  {
    id: 'sa5', sku: 'SKU-501', name: '吸管(大包装)', category: '耗材',
    currentQty: 1, minQty: 100, status: 'low_stock', updatedAt: '07:50', location: 'C-01-12',
  },
];

const MOCK_INBOUND_TASKS: InboundTask[] = [
  {
    id: 'ib1', orderNo: 'PO-2024-0689', supplier: '云南咖啡基地',
    skuCount: 5, totalQty: 800, status: 'pending', createdAt: '2024-06-30 09:00',
    expectedAt: '2024-06-30 14:00',
  },
  {
    id: 'ib2', orderNo: 'PO-2024-0690', supplier: '本地鲜奶厂',
    skuCount: 2, totalQty: 200, status: 'pending', createdAt: '2024-06-30 10:00',
    expectedAt: '2024-06-30 15:30',
  },
  {
    id: 'ib3', orderNo: 'PO-2024-0691', supplier: '食品包装供应商',
    skuCount: 8, totalQty: 1500, status: 'shelving', createdAt: '2024-06-29 16:00',
    expectedAt: '2024-06-30 11:00', operator: '张三',
  },
];

const MOCK_OUTBOUND_TASKS: OutboundTask[] = [
  {
    id: 'ob1', orderNo: 'REQ-2024-0321', destination: '门店A',
    skuCount: 3, totalQty: 60, priority: 'high', status: 'picking', createdAt: '2024-06-30 08:30',
    deadline: '2024-06-30 16:00',
  },
  {
    id: 'ob2', orderNo: 'REQ-2024-0322', destination: '门店B',
    skuCount: 6, totalQty: 120, priority: 'medium', status: 'pending', createdAt: '2024-06-30 09:15',
  },
  {
    id: 'ob3', orderNo: 'REQ-2024-0323', destination: '线上订单仓',
    skuCount: 2, totalQty: 35, priority: 'high', status: 'packing', createdAt: '2024-06-30 07:00',
    deadline: '2024-06-30 15:00',
  },
];

const QUICK_ACTIONS: KeeperQuickAction[] = [
  { key: 'new_inbound', label: '新建入库单', icon: '📥' },
  { key: 'stock_take', label: '发起盘点', icon: '📋' },
  { key: 'location_audit', label: '库位巡检', icon: '🔍' },
  { key: 'transfer', label: '调拨申请', icon: '📦' },
];

export function InventoryKeeperClient() {
  const handleQuickAction = (key: string) => {
    console.log(`[inventory-keeper] quick action: ${key}`);
    // In production, navigate or open modal
    if (key === 'new_inbound') {
      window.location.href = '/stock/new';
    }
  };

  const dashboardProps: InventoryKeeperDashboardProps = {
    warehouseName: '中央配送中心',
    metrics: MOCK_WAREHOUSE_METRICS,
    stockAlerts: MOCK_STOCK_ALERTS,
    inboundTasks: MOCK_INBOUND_TASKS,
    outboundTasks: MOCK_OUTBOUND_TASKS,
    quickActions: QUICK_ACTIONS,
  };

  return (
    <PageShell
      title="库房管理工作台"
      subtitle={`今日入库 ${MOCK_WAREHOUSE_METRICS.todayInbound} 单·出库 ${MOCK_WAREHOUSE_METRICS.todayOutbound} 单`}
    >
      <InventoryKeeperDashboard {...dashboardProps} />
    </PageShell>
  );
}
