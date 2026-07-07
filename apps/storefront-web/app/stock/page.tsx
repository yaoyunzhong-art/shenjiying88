/**
 * 库存管理列表页 — Stock Inventory Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
 * 功能: 搜索、分类筛选、状态筛选、分页
 */
import React from 'react';
import { StockPage } from './components/StockPage';

/* ── Mock 数据 ── */
const MOCK_STOCK_ITEMS = [
  { id: '1', sku: 'SKU-1001', name: '玫瑰精华爽肤水', category: '护肤品', quantity: 280, minThreshold: 50, maxThreshold: 500, unit: '瓶', price: 168, updatedAt: '2026-06-25 10:32', status: 'sufficient' as const },
  { id: '2', sku: 'SKU-1002', name: '玻尿酸保湿面霜', category: '护肤品', quantity: 15, minThreshold: 30, maxThreshold: 300, unit: '瓶', price: 238, updatedAt: '2026-06-25 09:15', status: 'critical' as const },
  { id: '3', sku: 'SKU-2001', name: '丝绒哑光口红·正红色', category: '彩妆', quantity: 0, minThreshold: 20, maxThreshold: 200, unit: '支', price: 89, updatedAt: '2026-06-24 18:00', status: 'out_of_stock' as const },
  { id: '4', sku: 'SKU-2002', name: '防水眼线液笔', category: '彩妆', quantity: 120, minThreshold: 30, maxThreshold: 250, unit: '支', price: 59, updatedAt: '2026-06-25 08:45', status: 'sufficient' as const },
  { id: '5', sku: 'SKU-2003', name: '大地色眼影盘', category: '彩妆', quantity: 45, minThreshold: 20, maxThreshold: 100, unit: '盒', price: 198, updatedAt: '2026-06-24 14:30', status: 'low' as const },
  { id: '6', sku: 'SKU-3001', name: '白茶淡香水 50ml', category: '香水', quantity: 32, minThreshold: 15, maxThreshold: 80, unit: '瓶', price: 358, updatedAt: '2026-06-25 11:00', status: 'sufficient' as const },
  { id: '7', sku: 'SKU-4001', name: '修复洗发水 500ml', category: '头发护理', quantity: 8, minThreshold: 20, maxThreshold: 150, unit: '瓶', price: 128, updatedAt: '2026-06-23 16:20', status: 'critical' as const },
  { id: '8', sku: 'SKU-5001', name: '角质调理磨砂膏', category: '身体护理', quantity: 600, minThreshold: 50, maxThreshold: 300, unit: '支', price: 98, updatedAt: '2026-06-25 11:15', status: 'overstocked' as const },
  { id: '9', sku: 'SKU-6001', name: '硅胶粉扑清洁盒', category: '工具配件', quantity: 65, minThreshold: 20, maxThreshold: 120, unit: '套', price: 39, updatedAt: '2026-06-22 09:00', status: 'sufficient' as const },
  { id: '10', sku: 'SKU-1003', name: '维生素C焕亮精华', category: '护肤品', quantity: 22, minThreshold: 25, maxThreshold: 200, unit: '瓶', price: 298, updatedAt: '2026-06-25 10:50', status: 'low' as const },
];

export default async function StockListPage() {
  return (
    <StockPage
      items={MOCK_STOCK_ITEMS}
      total={10}
      page={1}
      pageSize={20}
    />
  );
}
