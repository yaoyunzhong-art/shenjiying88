// ---- 分类管理数据类型与 Mock 数据 ----

export interface CategoryItem {
  id: string;
  name: string;
  code: string;
  parentName: string | null;
  productCount: number;
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt: string;
}

export type CategoryStatus = 'active' | 'inactive';
export type CategoryStatusVariant = 'success' | 'neutral';

export const CATEGORY_STATUSES: CategoryStatus[] = ['active', 'inactive'];

export const CATEGORY_STATUS_MAP: Record<CategoryStatus, { label: string; variant: CategoryStatusVariant }> = {
  active: { label: '启用', variant: 'success' },
  inactive: { label: '停用', variant: 'neutral' },
};

export function getCategoryStatusLabel(status: CategoryStatus): string {
  return CATEGORY_STATUS_MAP[status]?.label ?? status;
}

export function getCategoryStatusVariant(status: CategoryStatus): CategoryStatusVariant {
  return CATEGORY_STATUS_MAP[status]?.variant ?? 'neutral';
}

export const adminCategoryRoute = {
  href: '/categories',
  detailHrefBase: '/categories',
};

export const MOCK_CATEGORIES: CategoryItem[] = [
  { id: 'cat-001', name: '美妆护肤', code: 'BEAUTY', parentName: null, productCount: 342, status: 'active', sortOrder: 1, createdAt: '2025-01-15T08:00:00Z' },
  { id: 'cat-002', name: '面部护理', code: 'FACE_CARE', parentName: '美妆护肤', productCount: 128, status: 'active', sortOrder: 1, createdAt: '2025-01-15T08:30:00Z' },
  { id: 'cat-003', name: '身体护理', code: 'BODY_CARE', parentName: '美妆护肤', productCount: 96, status: 'active', sortOrder: 2, createdAt: '2025-01-15T09:00:00Z' },
  { id: 'cat-004', name: '彩妆', code: 'MAKEUP', parentName: '美妆护肤', productCount: 118, status: 'active', sortOrder: 3, createdAt: '2025-01-16T08:00:00Z' },
  { id: 'cat-005', name: '个人护理', code: 'PERSONAL_CARE', parentName: null, productCount: 215, status: 'active', sortOrder: 2, createdAt: '2025-01-20T10:00:00Z' },
  { id: 'cat-006', name: '洗发护发', code: 'HAIR_CARE', parentName: '个人护理', productCount: 87, status: 'active', sortOrder: 1, createdAt: '2025-01-20T10:30:00Z' },
  { id: 'cat-007', name: '口腔护理', code: 'ORAL_CARE', parentName: '个人护理', productCount: 45, status: 'active', sortOrder: 2, createdAt: '2025-01-21T08:00:00Z' },
  { id: 'cat-008', name: '家居清洁', code: 'HOME_CLEAN', parentName: null, productCount: 156, status: 'inactive', sortOrder: 3, createdAt: '2025-02-01T08:00:00Z' },
  { id: 'cat-009', name: '厨房用品', code: 'KITCHEN', parentName: '家居清洁', productCount: 62, status: 'active', sortOrder: 1, createdAt: '2025-02-01T08:30:00Z' },
  { id: 'cat-010', name: '卫浴清洁', code: 'BATHROOM', parentName: '家居清洁', productCount: 94, status: 'active', sortOrder: 2, createdAt: '2025-02-01T09:00:00Z' },
  { id: 'cat-011', name: '食品饮料', code: 'FOOD_BEV', parentName: null, productCount: 289, status: 'active', sortOrder: 4, createdAt: '2025-02-10T08:00:00Z' },
  { id: 'cat-012', name: '休闲零食', code: 'SNACKS', parentName: '食品饮料', productCount: 176, status: 'active', sortOrder: 1, createdAt: '2025-02-10T08:30:00Z' },
  { id: 'cat-013', name: '健康养生', code: 'HEALTH', parentName: null, productCount: 98, status: 'pending' as any, sortOrder: 5, createdAt: '2025-03-01T08:00:00Z' },
];

export function getCategoryUniqueParents(items: CategoryItem[]): string[] {
  const parents = new Set(items.filter(i => i.parentName).map(i => i.parentName!));
  return Array.from(parents).sort();
}

export function computeCategoryStats(items: CategoryItem[]) {
  return {
    total: items.length,
    active: items.filter(i => i.status === 'active').length,
    inactive: items.filter(i => i.status === 'inactive').length,
    rootCount: items.filter(i => !i.parentName).length,
    totalProducts: items.reduce((sum, i) => sum + i.productCount, 0),
  };
}
