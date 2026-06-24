/**
 * products-data — ToB product catalog mock data
 */

export type ProductStatus = 'active' | 'inactive' | 'discontinued' | 'draft';
export type ProductCategory = 'food' | 'beverage' | 'daily' | 'electronics' | 'clothing' | 'other';

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  status: ProductStatus;
  brandName: string;
  marketCode: string;
  storeName: string;
  supplierName: string;
  createdAt: string;
  updatedAt: string;
}

export const PRODUCT_STATUS_MAP: Record<
  ProductStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  active: { label: '在售', variant: 'success' },
  inactive: { label: '下架', variant: 'warning' },
  discontinued: { label: '停产', variant: 'danger' },
  draft: { label: '草稿', variant: 'neutral' },
};

export const PRODUCT_CATEGORY_MAP: Record<
  ProductCategory,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }
> = {
  food: { label: '食品', variant: 'success' },
  beverage: { label: '饮料', variant: 'info' },
  daily: { label: '日用品', variant: 'neutral' },
  electronics: { label: '电子', variant: 'warning' },
  clothing: { label: '服装', variant: 'info' },
  other: { label: '其他', variant: 'neutral' },
};

export const PRODUCT_STATUSES: ProductStatus[] = ['active', 'inactive', 'discontinued', 'draft'];
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'food',
  'beverage',
  'daily',
  'electronics',
  'clothing',
  'other',
];

export const MOCK_PRODUCTS: ProductItem[] = [
  {
    id: 'tp-001',
    sku: 'TP-SKU-10001',
    name: '有机全麦面包',
    category: 'food',
    price: 18.5,
    cost: 12.3,
    stock: 245,
    unit: '个',
    status: 'active',
    brandName: '健康烘焙坊',
    marketCode: 'CN-BJ',
    storeName: '朝阳旗舰店',
    supplierName: '京粮供应',
    createdAt: '2025-01-15',
    updatedAt: '2026-06-10',
  },
  {
    id: 'tp-002',
    sku: 'TP-SKU-10002',
    name: '无糖绿茶饮料 500ml',
    category: 'beverage',
    price: 6.0,
    cost: 3.8,
    stock: 1520,
    unit: '瓶',
    status: 'active',
    brandName: '清泉饮品',
    marketCode: 'CN-BJ',
    storeName: '朝阳旗舰店',
    supplierName: '清泉供应链',
    createdAt: '2025-02-20',
    updatedAt: '2026-06-12',
  },
  {
    id: 'tp-003',
    sku: 'TP-SKU-10003',
    name: '竹纤维洗碗布 3片装',
    category: 'daily',
    price: 12.9,
    cost: 7.5,
    stock: 89,
    unit: '包',
    status: 'active',
    brandName: '绿居家',
    marketCode: 'CN-SH',
    storeName: '浦东生活馆',
    supplierName: '绿居供应链',
    createdAt: '2025-03-01',
    updatedAt: '2026-06-08',
  },
  {
    id: 'tp-004',
    sku: 'TP-SKU-10004',
    name: '蓝牙降噪耳机 Pro',
    category: 'electronics',
    price: 499.0,
    cost: 320.0,
    stock: 56,
    unit: '台',
    status: 'active',
    brandName: '声学科技',
    marketCode: 'CN-SH',
    storeName: '浦东生活馆',
    supplierName: '声学电子供应',
    createdAt: '2025-01-10',
    updatedAt: '2026-06-14',
  },
  {
    id: 'tp-005',
    sku: 'TP-SKU-10005',
    name: '纯棉短袖T恤 男女同款',
    category: 'clothing',
    price: 89.0,
    cost: 45.0,
    stock: 320,
    unit: '件',
    status: 'active',
    brandName: '舒适棉品',
    marketCode: 'CN-GZ',
    storeName: '天河体验店',
    supplierName: '舒适棉品直供',
    createdAt: '2025-04-05',
    updatedAt: '2026-06-15',
  },
  {
    id: 'tp-006',
    sku: 'TP-SKU-10006',
    name: '智能手环 S3',
    category: 'electronics',
    price: 249.0,
    cost: 160.0,
    stock: 120,
    unit: '台',
    status: 'active',
    brandName: '智能科技',
    marketCode: 'CN-GZ',
    storeName: '天河体验店',
    supplierName: '智能科技供应链',
    createdAt: '2025-05-12',
    updatedAt: '2026-06-11',
  },
  {
    id: 'tp-007',
    sku: 'TP-SKU-10007',
    name: '进口咖啡豆 250g',
    category: 'food',
    price: 68.0,
    cost: 42.0,
    stock: 200,
    unit: '袋',
    status: 'active',
    brandName: '香醇咖啡',
    marketCode: 'CN-SH',
    storeName: '浦东生活馆',
    supplierName: '香醇咖啡进口',
    createdAt: '2025-03-20',
    updatedAt: '2026-06-09',
  },
  {
    id: 'tp-008',
    sku: 'TP-SKU-10008',
    name: '运动速干毛巾',
    category: 'daily',
    price: 29.9,
    cost: 15.0,
    stock: 45,
    unit: '条',
    status: 'active',
    brandName: '运动生活',
    marketCode: 'CN-BJ',
    storeName: '朝阳旗舰店',
    supplierName: '运动生活供应',
    createdAt: '2025-06-01',
    updatedAt: '2026-06-13',
  },
  {
    id: 'tp-009',
    sku: 'TP-SKU-10009',
    name: '椰子水 330ml',
    category: 'beverage',
    price: 8.5,
    cost: 5.2,
    stock: 800,
    unit: '瓶',
    status: 'active',
    brandName: '天然饮品',
    marketCode: 'CN-GZ',
    storeName: '天河体验店',
    supplierName: '天然饮品供应',
    createdAt: '2025-07-10',
    updatedAt: '2026-06-14',
  },
  {
    id: 'tp-010',
    sku: 'TP-SKU-10010',
    name: '女士防风夹克',
    category: 'clothing',
    price: 359.0,
    cost: 210.0,
    stock: 78,
    unit: '件',
    status: 'active',
    brandName: '风尚衣品',
    marketCode: 'CN-SH',
    storeName: '浦东生活馆',
    supplierName: '风尚衣品直供',
    createdAt: '2025-08-15',
    updatedAt: '2026-06-16',
  },
  {
    id: 'tp-011',
    sku: 'TP-SKU-10011',
    name: '厨房纸巾 6卷装',
    category: 'daily',
    price: 24.9,
    cost: 14.5,
    stock: 0,
    unit: '包',
    status: 'inactive',
    brandName: '洁家',
    marketCode: 'CN-BJ',
    storeName: '朝阳旗舰店',
    supplierName: '洁家供应',
    createdAt: '2025-02-10',
    updatedAt: '2026-06-01',
  },
  {
    id: 'tp-012',
    sku: 'TP-SKU-10012',
    name: '老款充电宝 5000mAh',
    category: 'electronics',
    price: 59.0,
    cost: 35.0,
    stock: 12,
    unit: '台',
    status: 'discontinued',
    brandName: '电力科技',
    marketCode: 'CN-GZ',
    storeName: '天河体验店',
    supplierName: '电力科技分销',
    createdAt: '2024-11-01',
    updatedAt: '2026-05-20',
  },
  {
    id: 'tp-013',
    sku: 'TP-SKU-10013',
    name: '冬季厚毛毯',
    category: 'clothing',
    price: 199.0,
    cost: 120.0,
    stock: 35,
    unit: '条',
    status: 'draft',
    brandName: '暖居',
    marketCode: 'CN-SH',
    storeName: '浦东生活馆',
    supplierName: '暖居直供',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-18',
  },
  {
    id: 'tp-014',
    sku: 'TP-SKU-10014',
    name: '酸梅汤 500ml',
    category: 'beverage',
    price: 5.5,
    cost: 3.0,
    stock: 600,
    unit: '瓶',
    status: 'active',
    brandName: '清泉饮品',
    marketCode: 'CN-BJ',
    storeName: '朝阳旗舰店',
    supplierName: '清泉供应链',
    createdAt: '2025-09-01',
    updatedAt: '2026-06-17',
  },
  {
    id: 'tp-015',
    sku: 'TP-SKU-10015',
    name: '进口巧克力礼盒',
    category: 'food',
    price: 158.0,
    cost: 98.0,
    stock: 65,
    unit: '盒',
    status: 'active',
    brandName: '甜蜜时光',
    marketCode: 'CN-GZ',
    storeName: '天河体验店',
    supplierName: '甜蜜时光进口',
    createdAt: '2025-10-20',
    updatedAt: '2026-06-20',
  },
  {
    id: 'tp-016',
    sku: 'TP-SKU-10016',
    name: '收纳盒套装 大中小',
    category: 'other',
    price: 39.9,
    cost: 22.0,
    stock: 150,
    unit: '套',
    status: 'active',
    brandName: '收纳达人',
    marketCode: 'CN-SH',
    storeName: '浦东生活馆',
    supplierName: '收纳达人供应',
    createdAt: '2025-11-05',
    updatedAt: '2026-06-19',
  },
];

// ── Filter state type ──

export interface ProductFilterState {
  search: string;
  category: ProductCategory | 'all' | '';
  status: ProductStatus | 'all' | '';
  sortField: 'name' | 'price' | 'stock' | 'createdAt';
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

// ── Search (name, sku, brand name) ──

export function searchProducts(products: ProductItem[], query: string): ProductItem[] {
  if (!query.trim()) return [...products];
  const lower = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.sku.toLowerCase().includes(lower) ||
      p.brandName.toLowerCase().includes(lower) ||
      p.supplierName.toLowerCase().includes(lower),
  );
}

// ── Filter by category ──

export function filterProductsByCategory(
  products: ProductItem[],
  category: ProductCategory | 'all' | '',
): ProductItem[] {
  if (!category || category === 'all') return [...products];
  return products.filter((p) => p.category === category);
}

// ── Filter by status ──

export function filterProductsByStatus(
  products: ProductItem[],
  status: ProductStatus | 'all' | '',
): ProductItem[] {
  if (!status || status === 'all') return [...products];
  return products.filter((p) => p.status === status);
}

// ── Sort ──

export interface SortConfig {
  field: 'name' | 'price' | 'stock' | 'createdAt';
  direction: 'asc' | 'desc';
}

export function sortProducts(products: ProductItem[], sort?: SortConfig | null): ProductItem[] {
  if (!sort) return [...products];
  const { field, direction } = sort;
  const sorted = [...products].sort((a, b) => {
    let cmp = 0;
    if (field === 'name') cmp = a.name.localeCompare(b.name);
    else if (field === 'price') cmp = a.price - b.price;
    else if (field === 'stock') cmp = a.stock - b.stock;
    else if (field === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt);
    return direction === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

// ── Paginate ──

export function paginateProducts(ids: string[], page: number, pageSize: number): string[] {
  const start = (page - 1) * pageSize;
  return ids.slice(start, start + pageSize);
}

// ── Aggregate stats ──

export interface AggregateStats {
  total: number;
  statusCounts: Record<ProductStatus, number>;
  categoryCounts: Record<ProductCategory, number>;
}

export function getAggregateStats(products: ProductItem[]): AggregateStats {
  const statusCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  for (const p of products) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
    categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
  }
  return {
    total: products.length,
    statusCounts: statusCounts as Record<ProductStatus, number>,
    categoryCounts: categoryCounts as Record<ProductCategory, number>,
  };
}

// ── CSV export ──

export function exportProductCSV(products: ProductItem[]): string {
  const headers = [
    'id',
    'sku',
    'name',
    'category',
    'price',
    'cost',
    'stock',
    'unit',
    'status',
    'brandName',
    'marketCode',
    'storeName',
    'supplierName',
    'createdAt',
    'updatedAt',
  ];
  const rows = products.map((p) =>
    headers
      .map((h) => {
        const val = (p as unknown as Record<string, unknown>)[h];
        if (val == null) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}
