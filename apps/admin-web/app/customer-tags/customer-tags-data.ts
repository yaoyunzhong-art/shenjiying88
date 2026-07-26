export interface Tag {
  id: string
  name: string
  category: string
  color: string
  source: string
  memberCount: number
  description: string
  enabled: boolean
  createdAt: string
}

export interface TagFormData {
  name: string
  category: string
  color: string
  source: string
  description: string
  enabled: boolean
}

export interface TagFormErrors {
  name?: string
  category?: string
  color?: string
  source?: string
}

export interface CustomerTagsSnapshotDelivery {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-customer-tags-snapshot'
  tags: Tag[]
  generatedAt: string
}

export const TAG_CATEGORIES = [
  { value: 'demographics', label: '人口属性' },
  { value: 'behavior', label: '行为特征' },
  { value: 'consumption', label: '消费偏好' },
  { value: 'lifestyle', label: '生活方式' },
  { value: 'engagement', label: '互动偏好' },
] as const

export const TAG_COLORS = [
  { value: 'blue', label: '蓝色', hex: '#1677ff' },
  { value: 'green', label: '绿色', hex: '#52c41a' },
  { value: 'orange', label: '橙色', hex: '#fa8c16' },
  { value: 'red', label: '红色', hex: '#f5222d' },
  { value: 'purple', label: '紫色', hex: '#722ed1' },
  { value: 'cyan', label: '青色', hex: '#13c2c2' },
  { value: 'pink', label: '粉色', hex: '#eb2f96' },
] as const

export const TAG_SOURCES = [
  { value: 'manual', label: '手动创建' },
  { value: 'rule-engine', label: '规则引擎' },
  { value: 'ai-prediction', label: 'AI预测' },
  { value: 'imported', label: '外部导入' },
] as const

export const defaultTags: Tag[] = [
  { id: 't1', name: '高净值会员', category: 'consumption', color: 'purple', source: 'ai-prediction', memberCount: 1243, description: '近6个月消费总额前5%', enabled: true, createdAt: '2025-12-01' },
  { id: 't2', name: '沉睡用户', category: 'behavior', color: 'orange', source: 'rule-engine', memberCount: 8720, description: '超过90天未到店', enabled: true, createdAt: '2025-11-15' },
  { id: 't3', name: 'Z世代', category: 'demographics', color: 'cyan', source: 'manual', memberCount: 5601, description: '出生年份1997-2012', enabled: true, createdAt: '2025-10-20' },
  { id: 't4', name: '母婴关注者', category: 'lifestyle', color: 'pink', source: 'manual', memberCount: 3390, description: '近30天浏览母婴品类', enabled: true, createdAt: '2025-12-10' },
  { id: 't5', name: '活动积极分子', category: 'engagement', color: 'green', source: 'ai-prediction', memberCount: 2145, description: '月度活动参与率>60%', enabled: true, createdAt: '2025-09-05' },
  { id: 't6', name: '高退换率', category: 'behavior', color: 'red', source: 'rule-engine', memberCount: 896, description: '退换货率>30%', enabled: false, createdAt: '2025-08-12' },
  { id: 't7', name: '夜猫子客群', category: 'lifestyle', color: 'blue', source: 'ai-prediction', memberCount: 4560, description: '主要消费时段22:00-02:00', enabled: true, createdAt: '2025-11-28' },
]

export interface TagStats {
  total: number
  enabled: number
  aiPrediction: number
  totalCoverage: number
}

export function createEmptyTagForm(): TagFormData {
  return {
    name: '',
    category: 'behavior',
    color: 'blue',
    source: 'manual',
    description: '',
    enabled: true,
  }
}

export function validateTagForm(form: TagFormData): TagFormErrors {
  const errors: TagFormErrors = {}
  if (!form.name.trim()) errors.name = '标签名称不能为空'
  else if (form.name.trim().length > 20) errors.name = '标签名称最多20个字符'
  if (!form.category) errors.category = '请选择标签分类'
  if (!form.color) errors.color = '请选择标签颜色'
  if (!form.source) errors.source = '请选择标签来源'
  return errors
}

export function computeTagStats(tags: Tag[]): TagStats {
  return {
    total: tags.length,
    enabled: tags.filter((tag) => tag.enabled).length,
    aiPrediction: tags.filter((tag) => tag.source === 'ai-prediction').length,
    totalCoverage: tags.filter((tag) => tag.enabled).reduce((sum, tag) => sum + tag.memberCount, 0),
  }
}

export function getCategoryLabel(value: string): string {
  return TAG_CATEGORIES.find((item) => item.value === value)?.label ?? value
}

export function getSourceLabel(value: string): string {
  return TAG_SOURCES.find((item) => item.value === value)?.label ?? value
}

export function getColorHex(value: string): string {
  return TAG_COLORS.find((item) => item.value === value)?.hex ?? '#1677ff'
}

function getLatestTagTimestamp(tags: Tag[]): string {
  if (tags.length === 0) return '—'
  return tags.reduce((latest, tag) => (tag.createdAt > latest ? tag.createdAt : latest), tags[0]!.createdAt)
}

export async function loadCustomerTagsSnapshot(): Promise<CustomerTagsSnapshotDelivery> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-customer-tags-snapshot',
    tags: defaultTags,
    generatedAt: getLatestTagTimestamp(defaultTags),
  }
}
