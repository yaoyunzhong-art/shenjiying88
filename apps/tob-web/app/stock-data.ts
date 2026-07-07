/**
 * stock-data.ts — 库存 mock 数据 (ToB 库存管理)
 */

export type StockCategory = 'raw_material' | 'semi_finished' | 'finished' | 'consumable' | 'gift';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: StockCategory;
  quantity: number;
  reserved: number;
  available: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  warehouse: string;
  supplier: string;
  lastCheckIn: string;
  lastCheckOut: string;
  status: StockStatus;
  expiryDate?: string;
  location: string;
}

export const STOCK_CATEGORY_MAP: Record<StockCategory, { label: string }> = {
  raw_material: { label: '原材料' },
  semi_finished: { label: '半成品' },
  finished: { label: '成品' },
  consumable: { label: '耗材' },
  gift: { label: '赠品' },
};

export const STOCK_STATUS_MAP: Record<StockStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  in_stock: { label: '充足', variant: 'success' },
  low_stock: { label: '缺货预警', variant: 'warning' },
  out_of_stock: { label: '缺货', variant: 'danger' },
  expired: { label: '已过期', variant: 'neutral' },
};

export const STOCK_CATEGORIES: StockCategory[] = ['raw_material', 'semi_finished', 'finished', 'consumable', 'gift'];
export const STOCK_STATUSES: StockStatus[] = ['in_stock', 'low_stock', 'out_of_stock', 'expired'];

const WAREHOUSES = ['总仓-北京', '华东仓-上海', '华南仓-广州', '西南仓-成都', '华中仓-武汉'];
const SUPPLIERS = ['中粮集团', '广州美妆供应链', '北京食品科技', '上海日化有限', '深圳包装材料'];
const LOCATIONS = ['A区-1排', 'A区-2排', 'B区-1排', 'B区-3排', 'C区-2排', 'C区-5排', 'D区-1排'];

const PRODUCT_NAMES = [
  '有机面粉 25kg', '白砂糖 10kg', '食用油 5L', '包装盒 (大)', '包装袋 (小)',
  '保鲜膜 30cm', '咖啡豆 1kg', '纸杯 500ml', '吸管 (散装)', '清洁剂 1L',
  '手套 (一次性)', '口罩 (KN95)', '标签贴纸', '扎带 (大包)', '封箱胶带',
];

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function generateMockStock(count: number): StockItem[] {
  const items: StockItem[] = [];
  for (let i = 0; i < count; i++) {
    const quantity = Math.floor(Math.random() * 2000);
    const reserved = Math.floor(Math.random() * Math.min(quantity, 100));
    const minStock = 10 + Math.floor(Math.random() * 90);
    const unitPrice = Math.round(Math.random() * 10000) / 100;
    const name = randomElement(PRODUCT_NAMES);
    const category = randomElement(STOCK_CATEGORIES);
    let status: StockStatus;
    if (quantity === 0) status = 'out_of_stock';
    else if (quantity <= minStock) status = 'low_stock';
    else status = 'in_stock';

    const now = Date.now();
    const checkInOffset = -Math.floor(Math.random() * 30) * 86400000;
    const checkOutOffset = -Math.floor(Math.random() * 7) * 86400000;

    items.push({
      id: `STK-${String(i + 1).padStart(4, '0')}`,
      sku: `SKU-${String(1000 + i)}`,
      name,
      category,
      quantity,
      reserved,
      available: quantity - reserved,
      minStock,
      maxStock: minStock + 100 + Math.floor(Math.random() * 400),
      unit: category === 'consumable' ? '包' : category === 'raw_material' ? 'kg' : '个',
      unitPrice,
      totalValue: Math.round(quantity * unitPrice * 100) / 100,
      warehouse: randomElement(WAREHOUSES),
      supplier: randomElement(SUPPLIERS),
      lastCheckIn: new Date(now + checkInOffset).toISOString().slice(0, 10),
      lastCheckOut: quantity > 0 ? new Date(now + checkOutOffset).toISOString().slice(0, 10) : '-',
      status,
      expiryDate: category === 'raw_material' || name.includes('咖啡') || name.includes('清洁')
        ? new Date(now + Math.floor(Math.random() * 180) * 86400000).toISOString().slice(0, 10)
        : undefined,
      location: randomElement(LOCATIONS),
    });
  }
  return items;
}

export const MOCK_STOCK: StockItem[] = generateMockStock(48);
