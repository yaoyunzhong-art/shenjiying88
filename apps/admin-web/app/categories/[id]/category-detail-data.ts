import { MOCK_CATEGORIES, type CategoryItem } from '../../categories-data'

export interface CategoryDetailSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-category-detail-snapshot'
  item: CategoryItem | null
  children: CategoryItem[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadCategoryDetailSnapshot(id: string): Promise<CategoryDetailSnapshot> {
  const item = MOCK_CATEGORIES.find((entry) => entry.id === id) ?? null
  const children = item ? MOCK_CATEGORIES.filter((entry) => entry.parentName === item.name) : []

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-category-detail-snapshot',
    item,
    children,
    generatedAt: '2026-07-27T10:20:00.000Z',
    controlPlaneSource: 'loadCategoryDetailSnapshot -> MOCK_CATEGORIES',
    businessDataSource: 'local category detail sample records',
    refreshPath: 'CategoryDetailPage -> loadCategoryDetailSnapshot',
    note: '当前页面消费本地分类详情快照，适用于结构固证与编辑交互演示。',
  }
}
