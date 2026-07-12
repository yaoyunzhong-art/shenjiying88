/**
 * 库存管理列表页 — Stock Inventory Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
 * 功能: 搜索、分类筛选、状态筛选、分页、库存预警、数据总览、位置管理
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
  /* 第3批 — 仓库位置 & 批次扩展 */
  { id: '21', sku: 'SKU-1006', name: '烟酰胺控油面膜', category: '护肤品', quantity: 420, minThreshold: 50, maxThreshold: 500, unit: '盒', price: 88, updatedAt: '2026-06-25 13:00', status: 'sufficient' as const },
  { id: '22', sku: 'SKU-2007', name: '极细眼线笔·黑色', category: '彩妆', quantity: 0, minThreshold: 25, maxThreshold: 200, unit: '支', price: 49, updatedAt: '2026-06-24 17:30', status: 'out_of_stock' as const },
  { id: '23', sku: 'SKU-4003', name: '免洗干发喷雾', category: '头发护理', quantity: 150, minThreshold: 20, maxThreshold: 200, unit: '瓶', price: 68, updatedAt: '2026-06-25 09:45', status: 'sufficient' as const },
  { id: '24', sku: 'SKU-5003', name: '护手霜套装 3支装', category: '身体护理', quantity: 7, minThreshold: 15, maxThreshold: 100, unit: '套', price: 58, updatedAt: '2026-06-23 10:00', status: 'critical' as const },
  { id: '25', sku: 'SKU-6003', name: '美妆蛋·三角形', category: '工具配件', quantity: 88, minThreshold: 20, maxThreshold: 150, unit: '个', price: 19, updatedAt: '2026-06-25 08:30', status: 'sufficient' as const },
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
  const totalQty = MOCK_STOCK_ITEMS.reduce((s, i) => s + i.quantity, 0);
  return { stats, totalItems, lowStock, outOfStock, overstocked, totalValue, totalQty, categories: MOCK_CATEGORIES };
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
  const defaultData = await fetchMockStockData(1, 25);
  const summary = generateSummary();

  return (
    <>
      {/* 内联库存总览看板 */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#111827' }}>
          📦 库存管理
        </h1>
        {/* 6格核心指标 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: 13, color: '#1e40af', marginBottom: 4 }}>库存总件数</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1e3a8a' }}>{summary.totalQty.toLocaleString()}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: 13, color: '#166534', marginBottom: 4 }}>库存总值</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#14532d' }}>¥{(summary.totalValue).toLocaleString()}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: 13, color: '#991b1b', marginBottom: 4 }}>⚠️ 告急/缺货</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#7f1d1d' }}>{summary.lowStock + summary.outOfStock}</div>
            <div style={{ fontSize: 11, color: '#ef444480', marginTop: 2 }}>缺货 {summary.outOfStock} / 告急 {summary.lowStock}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #ddd6fe' }}>
            <div style={{ fontSize: 13, color: '#5b21b6', marginBottom: 4 }}>库存积压</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4c1d95' }}>{summary.overstocked}</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #fefce8, #fef9c3)', border: '1px solid #fde68a' }}>
            <div style={{ fontSize: 13, color: '#854d0e', marginBottom: 4 }}>商品种类</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#713f12' }}>{summary.totalItems} 种</div>
            <div style={{ fontSize: 11, color: '#a1620780', marginTop: 2 }}>{summary.categories.length} 个分类</div>
          </div>
          <div style={{ borderRadius: 12, padding: '14px 18px', background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', border: '1px solid #f9a8d4' }}>
            <div style={{ fontSize: 13, color: '#9d174d', marginBottom: 4 }}>平均单价</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#831843' }}>
              ¥{Math.round(summary.totalValue / summary.totalQty).toLocaleString()}
            </div>
          </div>
        </div>
        {/* 库存健康度预警指示器 */}
        <div style={{ borderRadius: 12, border: '1px solid #fecaca', padding: '12px 16px', marginBottom: 16, background: '#fef2f2' }}>
          <h3 style={{ fontSize: 14, color: '#991b1b', marginBottom: 8 }}>🚨 库存预警 — 需立即处理</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MOCK_STOCK_ITEMS.filter(i => i.status === 'out_of_stock' || i.status === 'critical').map(item => (
              <div key={item.id} style={{ padding: '6px 12px', borderRadius: 6, background: '#fff', border: '1px solid #fecaca', fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: '#991b1b' }}>{item.name}</span>
                <span style={{ color: '#ef4444', marginLeft: 6 }}>
                  {item.status === 'out_of_stock' ? '缺货' : `告急(剩${item.quantity}${item.unit})`}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#b91c1c' }}>缺口 {summary.outOfStock} 种 · 告急 {summary.lowStock} 种 · 请尽快安排补货</div>
        </div>

        {/* 分类库存分布 - 简化柱状图 */}
        <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', padding: 16, marginBottom: 20, background: '#fff' }}>
          <h3 style={{ fontSize: 14, color: '#374151', marginBottom: 12 }}>📊 分类库存分布</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80, padding: '4px 0' }}>
            {summary.stats.map(s => {
              const maxQty = Math.max(...summary.stats.map(x => x.totalQty), 1);
              const h = Math.max((s.totalQty / maxQty) * 60, 6);
              return (
                <div key={s.category} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{s.totalQty.toLocaleString()}</div>
                  <div style={{ width: '75%', background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '4px 4px 0 0', height: h, minHeight: 4, transition: 'height 0.3s' }} />
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, whiteSpace: 'nowrap' }}>{s.category}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <StockPage
        items={defaultData.items}
        total={defaultData.total}
        page={1}
        pageSize={25}
      />
    </>
  );
}
