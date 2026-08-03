import {
  MOCK_CATEGORIES,
  computeCategoryStats,
  getCategoryUniqueParents,
  type CategoryItem,
} from '../categories-data'

export interface CategoriesListSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-categories-list-snapshot'
  items: CategoryItem[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadCategoriesListSnapshot(): Promise<CategoriesListSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-categories-list-snapshot',
    items: MOCK_CATEGORIES.map((item) => ({ ...item })),
    generatedAt: '2026-07-27T10:10:00.000Z',
    controlPlaneSource: 'loadCategoriesListSnapshot -> MOCK_CATEGORIES',
    businessDataSource: `local category samples, root=${computeCategoryStats(MOCK_CATEGORIES).rootCount}, parents=${getCategoryUniqueParents(MOCK_CATEGORIES).length}`,
    refreshPath: 'CategoriesListPage -> loadCategoriesListSnapshot',
    note: '当前页面消费本地分类列表快照，适用于结构固证与筛选交互演示。',
  }
}
