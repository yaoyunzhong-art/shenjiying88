export interface TagRecord {
  id: string
  name: string
  category: '消费行为' | '兴趣偏好' | '会员等级' | '活动参与' | '自定义'
  storesCount: number
  memberCount: number
  creator: string
  createdAt: string
  active: boolean
}

export interface TagsPageSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'tags-page-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  tags: TagRecord[]
}

export const TAG_SAMPLE_DATA: TagRecord[] = [
  { id: 't1', name: '高消费活跃', category: '消费行为', storesCount: 12, memberCount: 3421, creator: '张三', createdAt: '2026-01-15', active: true },
  { id: 't2', name: '运动达人', category: '兴趣偏好', storesCount: 8, memberCount: 2189, creator: '李四', createdAt: '2026-02-20', active: true },
  { id: 't3', name: '金卡会员', category: '会员等级', storesCount: 15, memberCount: 876, creator: '王五', createdAt: '2026-03-10', active: true },
  { id: 't4', name: '年中庆参与者', category: '活动参与', storesCount: 6, memberCount: 5532, creator: '张三', createdAt: '2026-04-05', active: false },
  { id: 't5', name: '新品试吃官', category: '自定义', storesCount: 4, memberCount: 1205, creator: '赵六', createdAt: '2026-05-18', active: true },
  { id: 't6', name: '夜宵常客', category: '消费行为', storesCount: 9, memberCount: 4678, creator: '李四', createdAt: '2026-06-01', active: true },
]

export async function loadTagsPageSnapshot(): Promise<TagsPageSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'tags-page-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadTagsPageSnapshot -> local E54 snapshot shell',
    businessDataSource: 'tags-page-data.ts mock tag records',
    refreshPath: `loadTagsPageSnapshot(${'root'})`,
    note: '当前页面以 E54 壳层承载客户标签统计、分类筛选与列表展示，后续可接入真实标签 API。',
    tags: TAG_SAMPLE_DATA,
  }
}
