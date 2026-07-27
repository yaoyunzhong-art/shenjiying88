import { MOCK_CATEGORIES, getCategoryUniqueParents } from '../../categories-data'

export interface NewCategorySnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-new-category-snapshot'
  parentOptions: string[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadNewCategorySnapshot(): Promise<NewCategorySnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-new-category-snapshot',
    parentOptions: getCategoryUniqueParents(MOCK_CATEGORIES),
    generatedAt: '2026-07-27T10:30:00.000Z',
    controlPlaneSource: 'loadNewCategorySnapshot -> getCategoryUniqueParents',
    businessDataSource: 'local category parent sample records',
    refreshPath: 'NewCategoryPage -> loadNewCategorySnapshot',
    note: '当前页面消费本地父分类快照，适用于结构固证与表单交互演示。',
  }
}
