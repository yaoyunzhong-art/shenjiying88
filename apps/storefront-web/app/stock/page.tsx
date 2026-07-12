/**
 * 库存管理列表页 — Stock Inventory Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
 * 功能: 搜索、分类筛选、状态筛选、分页
 */
import React from 'react';
import { StockPage } from './components/StockPage';

/* ── Mock 数据 ── */
const MOCK_CATEGORIES = ['护肤品', '彩妆', '香水', '头发护理', '身体护理', '工具配件'] as const;

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
  /* 第2批 mock 数据 — 增强覆盖面 */
  { id: '11', sku: 'SKU-1004', name: '绿茶控油洁面乳', category: '护肤品', quantity: 180, minThreshold: 40, maxThreshold: 400, unit: '瓶', price: 138, updatedAt: '2026-06-24 16:10', status: 'sufficient' as const },
  { id: '12', sku: 'SKU-1005', name: '神经酰胺修护乳液', category: '护肤品', quantity: 3, minThreshold: 25, maxThreshold: 250, unit: '瓶', price: 268, updatedAt: '2026-06-23 11:30', status: 'critical' as const },
  { id: '13', sku: 'SKU-2004', name: '哑光散粉·透明色', category: '彩妆', quantity: 0, minThreshold: 15, maxThreshold: 180, unit: '盒', price: 129, updatedAt: '2026-06-22 09:00', status: 'out_of_stock' as const },
  { id: '14', sku: 'SKU-2005', name: '柔雾眉笔·灰棕色', category: '彩妆', quantity: 210, minThreshold: 30, maxThreshold: 300, unit: '支', price: 45, updatedAt: '2026-06-25 07:20', status: 'sufficient' as const },
  { id: '15', sku: 'SKU-2006', name: '持妆粉底液·自然色', category: '彩妆', quantity: 18, minThreshold: 20, maxThreshold: 200, unit: '瓶', price: 198, updatedAt: '2026-06-24 15:45', status: 'low' as const },
  { id: '16', sku: 'SKU-3002', name: '玫瑰花香氛 30ml', category: '香水', quantity: 55, minThreshold: 15, maxThreshold: 100, unit: '瓶', price: 288, updatedAt: '2026-06-25 12:00', status: 'sufficient' as const },
  { id: '17', sku: 'SKU-3003', name: '木质调中性香水 75ml', category: '香水', quantity: 450, minThreshold: 20, maxThreshold: 80, unit: '瓶', price: 528, updatedAt: '2026-06-25 10:00', status: 'overstocked' as const },
  { id: '18', sku: 'SKU-4002', name: '滋养护发素 500ml', category: '头发护理', quantity: 35, minThreshold: 20, maxThreshold: 120, unit: '瓶', price: 108, updatedAt: '2026-06-24 13:00', status: 'sufficient' as const },
  { id: '19', sku: 'SKU-5002', name: '身体乳·燕麦味 300ml', category: '身体护理', quantity: 95, minThreshold: 20, maxThreshold: 200, unit: '瓶', price: 78, updatedAt: '2026-06-23 14:20', status: 'sufficient' as const },
  { id: '20', sku: 'SKU-6002', name: '美妆蛋清洁液 200ml', category: '工具配件', quantity: 12, minThreshold: 15, maxThreshold: 100, unit: '瓶', price: 29, updatedAt: '2026-06-22 10:15', status: 'low' as const },
];

/** 按类别生成的摘要统计 */
function generateSummary() {
  const stats = MOCK_CATEGORIES.map(cat => {
    const group = MOCK_STOCK_ITEMS.filter(i => i.category === cat);
    return { category: cat, count: group.length, totalQty: group.reduce((s, i) => s + i.quantity, 0), totalValue: group.reduce((s, i) => s + i.quantity * i.price, 0) };
  });
  const totalItems = MOCK_STOCK_ITEMS.length;
  const lowStock = MOCK_STOCK_ITEMS.filter(i => i.status === 'low' || i.status === 'critical').length;
  const outOfStock = MOCK_STOCK_ITEMS.filter(i => i.status === 'out_of_stock').length;
  const overstocked = MOCK_STOCK_ITEMS.filter(i => i.status === 'overstocked').length;
  const totalValue = MOCK_STOCK_ITEMS.reduce((s, i) => s + i.quantity * i.price, 0);
  return { stats, totalItems, lowStock, outOfStock, overstocked, totalValue };
}

/* ── API 模拟 ── */
async function fetchMockStockData(page: number, pageSize: number, search?: string, category?: string, status?: string) {
  'use server';
  // 模拟网络延迟
  await new Promise(r => setTimeout(r, 50));
  let filtered = [...MOCK_STOCK_ITEMS];
  if (search) filtered = filtered.filter(i => i.name.includes(search) || i.sku.includes(search));
  if (category) filtered = filtered.filter(i => i.category === category);
  if (status) filtered = filtered.filter(i => i.status === status);
  return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, summary: generateSummary() };
}

export default async function StockListPage() {
  const defaultData = await fetchMockStockData(1, 20);
  return (
    <StockPage
      items={defaultData.items}
      total={defaultData.total}
      page={1}
      pageSize={20}
    />
  );
}
