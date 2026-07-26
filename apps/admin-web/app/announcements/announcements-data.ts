export type AnnouncementCategory = 'system' | 'promotion' | 'operation' | 'emergency' | 'policy'
export type AnnouncementStatus = 'draft' | 'published' | 'archived'
export type AnnouncementPriority = 'high' | 'normal' | 'low'

export interface Announcement {
  id: string
  title: string
  category: AnnouncementCategory
  status: AnnouncementStatus
  priority: AnnouncementPriority
  summary: string
  content: string
  author: string
  publishedAt: string
  readCount: number
  createdAt: string
  updatedAt: string
}

export interface AnnouncementFormData {
  title: string
  category: AnnouncementCategory
  priority: AnnouncementPriority
  status: AnnouncementStatus
  summary: string
  content: string
}

export interface AnnouncementFormErrors {
  title?: string
  category?: string
  priority?: string
  summary?: string
  content?: string
}

export interface AnnouncementsSnapshotDelivery {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-announcements-snapshot'
  announcements: Announcement[]
  generatedAt: string
}

export const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  system: '系统通知',
  promotion: '促销活动',
  operation: '运营管理',
  emergency: '紧急通知',
  policy: '制度政策',
}

export const CATEGORY_OPTIONS = [
  { value: 'system', label: '系统通知' },
  { value: 'promotion', label: '促销活动' },
  { value: 'operation', label: '运营管理' },
  { value: 'emergency', label: '紧急通知' },
  { value: 'policy', label: '制度政策' },
] as const

export const CATEGORY_TABS = [
  { key: '', label: '全部' },
  { key: 'system', label: '系统通知' },
  { key: 'operation', label: '维护公告' },
  { key: 'policy', label: '版本更新' },
  { key: 'promotion', label: '活动通知' },
] as const

export const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
}

export const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  high: '高',
  normal: '中',
  low: '低',
}

export const PRIORITY_COLORS: Record<AnnouncementPriority, string> = {
  high: '#ef4444',
  normal: '#f59e0b',
  low: '#6b7280',
}

export const STATUS_BADGE_VARIANT: Record<AnnouncementStatus, 'default' | 'success' | 'warning'> = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
}

export const defaultAnnouncements: Announcement[] = [
  { id: 'a1', title: '2026年7月系统升级维护通知', category: 'system', status: 'published', priority: 'high', summary: '核心数据库将于7月12日凌晨2:00-5:00停机维护', content: '核心数据库维护窗口说明。', author: '技术部', publishedAt: '2026-07-05', readCount: 12580, createdAt: '2026-07-04', updatedAt: '2026-07-05' },
  { id: 'a2', title: '夏季狂欢购 · 全场满减活动', category: 'promotion', status: 'published', priority: 'normal', summary: '7月15日-7月31日全场满300减60', content: '活动范围覆盖全门店。', author: '运营部', publishedAt: '2026-07-03', readCount: 8430, createdAt: '2026-07-01', updatedAt: '2026-07-03' },
  { id: 'a3', title: '新员工入职培训安排', category: 'operation', status: 'published', priority: 'normal', summary: '7月18日举办新员工入职培训，请各部门安排', content: '培训地点为总部培训室。', author: '人事部', publishedAt: '2026-07-02', readCount: 3210, createdAt: '2026-06-30', updatedAt: '2026-07-02' },
  { id: 'a4', title: '消防应急演练通知', category: 'emergency', status: 'published', priority: 'high', summary: '7月10日上午10:00全员消防演练', content: '请各部门提前做好值守安排。', author: '安全部', publishedAt: '2026-07-01', readCount: 9870, createdAt: '2026-06-29', updatedAt: '2026-07-01' },
  { id: 'a5', title: '季度库存盘点计划', category: 'operation', status: 'draft', priority: 'low', summary: '拟定7月下旬进行季度盘点，待确认', content: '盘点计划草稿。', author: '仓管部', publishedAt: '', readCount: 0, createdAt: '2026-07-06', updatedAt: '2026-07-06' },
  { id: 'a6', title: '会员积分制度调整方案', category: 'policy', status: 'draft', priority: 'normal', summary: '拟调整会员积分累积规则，增加有效期限制', content: '方案待评审。', author: '市场部', publishedAt: '', readCount: 0, createdAt: '2026-07-05', updatedAt: '2026-07-05' },
  { id: 'a7', title: '端午假期值班安排', category: 'operation', status: 'archived', priority: 'normal', summary: '端午假期各门店值班表已发布', content: '假期值班公告归档。', author: '运营部', publishedAt: '2026-06-15', readCount: 12540, createdAt: '2026-06-12', updatedAt: '2026-06-15' },
  { id: 'a8', title: 'POS收银系统紧急修复', category: 'system', status: 'archived', priority: 'high', summary: '部分门店POS异常已修复', content: '修复公告归档。', author: '技术部', publishedAt: '2026-06-08', readCount: 18920, createdAt: '2026-06-08', updatedAt: '2026-06-08' },
  { id: 'a9', title: '数据库服务器例行维护通知', category: 'operation', status: 'published', priority: 'normal', summary: '7月20日凌晨1:00-3:00数据库例行维护', content: '例行维护说明。', author: '技术部', publishedAt: '2026-07-18', readCount: 4560, createdAt: '2026-07-17', updatedAt: '2026-07-18' },
  { id: 'a10', title: 'v3.8.0 版本更新日志', category: 'policy', status: 'published', priority: 'normal', summary: '新增数据报表模块，优化权限管理', content: '版本更新详情。', author: '产品部', publishedAt: '2026-07-15', readCount: 7890, createdAt: '2026-07-14', updatedAt: '2026-07-15' },
  { id: 'a11', title: '年中版本功能更新预告', category: 'policy', status: 'draft', priority: 'low', summary: '三季度功能更新计划草稿', content: '更新预告草稿。', author: '产品部', publishedAt: '', readCount: 0, createdAt: '2026-07-10', updatedAt: '2026-07-10' },
]

export function filterAnnouncements(items: Announcement[], search: string, category: string, status: string): Announcement[] {
  return items.filter((item) => {
    if (search.trim()) {
      const keyword = search.trim().toLowerCase()
      if (!item.title.toLowerCase().includes(keyword) && !item.summary.toLowerCase().includes(keyword)) return false
    }
    if (category && item.category !== category) return false
    if (status && item.status !== status) return false
    return true
  })
}

export function computeAnnouncementStats(items: Announcement[]) {
  return {
    total: items.length,
    published: items.filter((item) => item.status === 'published').length,
    draft: items.filter((item) => item.status === 'draft').length,
    archived: items.filter((item) => item.status === 'archived').length,
    highPriority: items.filter((item) => item.priority === 'high').length,
    totalReads: items.reduce((sum, item) => sum + item.readCount, 0),
  }
}

export function createEmptyAnnouncementForm(): AnnouncementFormData {
  return {
    title: '',
    category: 'operation',
    priority: 'normal',
    status: 'draft',
    summary: '',
    content: '',
  }
}

export function validateAnnouncementForm(data: AnnouncementFormData): AnnouncementFormErrors {
  const errors: AnnouncementFormErrors = {}
  if (!data.title.trim()) errors.title = '公告标题不能为空'
  else if (data.title.trim().length > 100) errors.title = '公告标题最多100个字符'
  if (!data.category) errors.category = '请选择公告类型'
  if (!data.priority) errors.priority = '请选择优先级'
  if (!data.summary.trim()) errors.summary = '公告摘要不能为空'
  else if (data.summary.trim().length > 200) errors.summary = '公告摘要最多200个字符'
  if (!data.content.trim()) errors.content = '公告内容不能为空'
  return errors
}

export function formatAnnouncementDate(dateStr: string): string {
  if (!dateStr) return '-'
  return dateStr
}

export function addAnnouncement(items: Announcement[], form: AnnouncementFormData): Announcement[] {
  const now = new Date().toISOString().slice(0, 10)
  return [
    {
      id: `a${Date.now()}`,
      title: form.title.trim(),
      category: form.category,
      status: form.status,
      priority: form.priority,
      summary: form.summary.trim(),
      content: form.content.trim(),
      author: '当前用户',
      publishedAt: form.status === 'published' ? now : '',
      readCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    ...items,
  ]
}

export function archiveAnnouncement(items: Announcement[], id: string): Announcement[] {
  return items.map((item) =>
    item.id === id && item.status === 'published'
      ? { ...item, status: 'archived' as const, updatedAt: new Date().toISOString().slice(0, 10) }
      : item
  )
}

export function deleteAnnouncement(items: Announcement[], id: string): Announcement[] {
  return items.filter((item) => item.id !== id)
}

export function publishAnnouncement(items: Announcement[], id: string): Announcement[] {
  const now = new Date().toISOString().slice(0, 10)
  return items.map((item) =>
    item.id === id && item.status === 'draft'
      ? { ...item, status: 'published' as const, publishedAt: now, updatedAt: now }
      : item
  )
}

function getLatestAnnouncementTimestamp(items: Announcement[]): string {
  if (items.length === 0) return '—'
  return items.reduce((latest, item) => (item.updatedAt > latest ? item.updatedAt : latest), items[0]!.updatedAt)
}

export async function loadAnnouncementsSnapshot(): Promise<AnnouncementsSnapshotDelivery> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-announcements-snapshot',
    announcements: defaultAnnouncements,
    generatedAt: getLatestAnnouncementTimestamp(defaultAnnouncements),
  }
}
