/**
 * 仓管员工作台 — Inventory Keeper Workbench (Next.js App Router Page)
 * 角色视角: 📦仓库管理员
 * 功能: 库存概览 / 入库待处理 / 出库待处理 / 库存预警 / 快速操作
 */
'use client';

import { useState, useMemo, useCallback } from 'react';

import {
  InventoryKeeperDashboard,
  PageShell,
  DetailActionBar,
  type InventoryKeeperDashboardProps,
  type WarehouseMetrics,
  type StockAlert,
  type InboundTask,
  type OutboundTask,
  type KeeperQuickAction,
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';

// ============================================================
// Mock 数据
// ============================================================

const MOCK_METRICS: WarehouseMetrics = {
  totalSku: 1286,
  totalStock: 58420,
  todayInbound: 12,
  todayOutbound: 9,
  stockValue: 3865000,
  lowStockCount: 8,
  expiryWarningCount: 3,
  locationUtilization: 0.76,
};

const MOCK_STOCK_ALERTS: StockAlert[] = [
  { id: 'a1', sku: 'SKU-001', name: 'A级牛肉 500g', category: '生鲜', currentQty: 5, minQty: 50, status: 'low_stock', updatedAt: '2026-07-11 03:00', location: 'A-01-02' },
  { id: 'a2', sku: 'SKU-015', name: '进口三文鱼 200g', category: '生鲜', currentQty: 2, minQty: 30, status: 'low_stock', updatedAt: '2026-07-11 02:00', location: 'A-02-05' },
  { id: 'a3', sku: 'SKU-032', name: '鲜牛奶 1L', category: '乳品', currentQty: 12, minQty: 80, status: 'low_stock', updatedAt: '2026-07-10 22:00', location: 'B-01-03' },
  { id: 'a4', sku: 'SKU-088', name: '安佳黄油 200g', category: '乳品', currentQty: 180, minQty: 50, status: 'overstock', updatedAt: '2026-07-10 18:00', location: 'B-03-01' },
  { id: 'a5', sku: 'SKU-112', name: '有机鸡蛋 10枚装', category: '蛋品', currentQty: 34, minQty: 60, status: 'low_stock', updatedAt: '2026-07-11 01:00', location: 'C-01-06' },
  { id: 'a6', sku: 'SKU-201', name: '芝士蛋糕 6寸', category: '烘焙', currentQty: 4, minQty: 20, status: 'expiring', updatedAt: '2026-07-10 20:00', location: 'D-02-04' },
  { id: 'a7', sku: 'SKU-205', name: '提拉米苏 切片', category: '烘焙', currentQty: 8, minQty: 15, status: 'expiring', updatedAt: '2026-07-10 20:00', location: 'D-02-05' },
  { id: 'a8', sku: 'SKU-301', name: '冷冻虾仁 500g', category: '冷冻', currentQty: 3, minQty: 40, status: 'low_stock', updatedAt: '2026-07-10 15:00', location: 'E-01-08' },
  { id: 'a9', sku: 'SKU-045', name: '原味酸奶 100g×4', category: '乳品', currentQty: 45, minQty: 100, status: 'low_stock', updatedAt: '2026-07-11 00:00', location: 'B-02-02' },
  { id: 'a10', sku: 'SKU-178', name: '蓝莓果酱 340g', category: '调味', currentQty: 6, minQty: 20, status: 'expiring', updatedAt: '2026-07-09 12:00', location: 'F-01-03' },
];

const MOCK_INBOUND_TASKS: InboundTask[] = [
  { id: 'i1', orderNo: 'PO-2026-0711-001', supplier: '鲜农供应链', skuCount: 15, totalQty: 1200, status: 'pending', createdAt: '2026-07-11 06:30', expectedAt: '2026-07-11 08:00' },
  { id: 'i2', orderNo: 'PO-2026-0711-002', supplier: '海产直供', skuCount: 8, totalQty: 600, status: 'inspecting', createdAt: '2026-07-11 05:00', operator: '张三' },
  { id: 'i3', orderNo: 'PO-2026-0710-015', supplier: '乳品之家', skuCount: 6, totalQty: 2400, status: 'shelving', createdAt: '2026-07-10 14:00', operator: '李四' },
  { id: 'i4', orderNo: 'PO-2026-0710-014', supplier: '烘焙原料优选', skuCount: 22, totalQty: 880, status: 'pending', createdAt: '2026-07-10 22:00', expectedAt: '2026-07-11 09:00' },
  { id: 'i5', orderNo: 'PO-2026-0710-013', supplier: '环球食品进口', skuCount: 12, totalQty: 360, status: 'inspecting', createdAt: '2026-07-10 16:00', operator: '王五' },
];

const MOCK_OUTBOUND_TASKS: OutboundTask[] = [
  { id: 'o1', orderNo: 'SO-2026-0711-023', destination: '门店A-旗舰店', skuCount: 10, totalQty: 320, priority: 'high', status: 'picking', createdAt: '2026-07-11 06:00' },
  { id: 'o2', orderNo: 'SO-2026-0711-022', destination: '门店B-社区店', skuCount: 5, totalQty: 150, priority: 'high', status: 'pending', createdAt: '2026-07-11 05:30', deadline: '2026-07-11 12:00' },
  { id: 'o3', orderNo: 'SO-2026-0710-089', destination: '线上订单仓', skuCount: 18, totalQty: 520, priority: 'medium', status: 'packing', createdAt: '2026-07-10 18:00' },
  { id: 'o4', orderNo: 'SO-2026-0710-088', destination: '门店C-标准店', skuCount: 8, totalQty: 200, priority: 'low', status: 'pending', createdAt: '2026-07-10 20:00', deadline: '2026-07-12 10:00' },
  { id: 'o5', orderNo: 'SO-2026-0711-021', destination: '门店D-便利店', skuCount: 3, totalQty: 80, priority: 'high', status: 'pending', createdAt: '2026-07-11 04:00', deadline: '2026-07-11 10:00' },
];

// ============================================================
// 组件
// ============================================================

export default function InventoryKeeperWorkbenchPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const { actions } = useDetailActions({
    workspace: 'inventory-keeper',
    detailId: 'dashboard',
    record: { metrics: MOCK_METRICS, alertCount: MOCK_STOCK_ALERTS.length },
    shareTitle: '仓管员工作台',
    shareText: '库存概览详情',
  });

  /** 模拟刷新 */
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(undefined);
    setTimeout(() => setLoading(false), 800);
  }, []);

  /** 快速操作定义 */
  const quickActions: KeeperQuickAction[] = useMemo(() => [
    { key: 'new-inbound', label: '新建入库单', icon: '📥', primary: true, onClick: () => alert('跳转至新建入库单页面') },
    { key: 'new-outbound', label: '新建出库单', icon: '📤', primary: true, onClick: () => alert('跳转至新建出库单页面') },
    { key: 'stock-take', label: '盘点库存', icon: '📋', onClick: () => alert('启动盘点流程') },
    { key: 'inventory-report', label: '库存报表', icon: '📊', onClick: () => alert('跳转至库存报表') },
    { key: 'location-mgmt', label: '库位管理', icon: '📍', onClick: () => alert('跳转至库位管理') },
    { key: 'supplier-contacts', label: '供应商通讯录', icon: '📞', onClick: () => alert('跳转至供应商通讯录') },
  ], []);

  return (
    <PageShell title="仓管员工作台" subtitle="仓库库存管理与出入库操作">
      <div style={{ marginBottom: 16 }}>
        <DetailActionBar
          actions={actions}
        />
      </div>

      <InventoryKeeperDashboard
        warehouseName="中央配送中心-一号仓库"
        metrics={MOCK_METRICS}
        stockAlerts={MOCK_STOCK_ALERTS}
        inboundTasks={MOCK_INBOUND_TASKS}
        outboundTasks={MOCK_OUTBOUND_TASKS}
        quickActions={quickActions}
        loading={loading}
        error={error}
      />
    </PageShell>
  );
}
