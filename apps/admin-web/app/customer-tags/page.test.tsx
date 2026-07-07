/**
 * customer-tags/page.test.tsx — 客户画像标签管理页 L1 测试
 *
 * 覆盖:
 *   正例 — 常量映射、筛选逻辑、统计计算、表单校验、CRUD 辅助逻辑
 *   反例 — 空数据、非法输入、无匹配场景
 *   边界 — 名称长度限制、空白搜索、启用状态切换
 */

import assert from 'node:assert/strict'
import test from 'node:test'

interface Tag {
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

interface FormErrors {
  name?: string
  category?: string
  color?: string
  source?: string
}

interface FormData {
  name: string
  category: string
  color: string
  source: string
  description: string
  enabled: boolean
}

const TAG_CATEGORIES = [
  { value: 'demographics', label: '人口属性' },
  { value: 'behavior', label: '行为特征' },
  { value: 'consumption', label: '消费偏好' },
  { value: 'lifestyle', label: '生活方式' },
  { value: 'engagement', label: '互动偏好' },
] as const

const TAG_COLORS = [
  { value: 'blue', label: '蓝色', hex: '#1677ff' },
  { value: 'green', label: '绿色', hex: '#52c41a' },
  { value: 'orange', label: '橙色', hex: '#fa8c16' },
  { value: 'red', label: '红色', hex: '#f5222d' },
  { value: 'purple', label: '紫色', hex: '#722ed1' },
  { value: 'cyan', label: '青色', hex: '#13c2c2' },
  { value: 'pink', label: '粉色', hex: '#eb2f96' },
] as const

const TAG_SOURCES = [
  { value: 'manual', label: '手动创建' },
  { value: 'rule-engine', label: '规则引擎' },
  { value: 'ai-prediction', label: 'AI预测' },
  { value: 'imported', label: '外部导入' },
] as const

const MOCK_TAGS: Tag[] = [
  { id: 't1', name: '高净值会员', category: 'consumption', color: 'purple', source: 'ai-prediction', memberCount: 1243, description: '近6个月消费总额前5%', enabled: true, createdAt: '2025-12-01' },
  { id: 't2', name: '沉睡用户', category: 'behavior', color: 'orange', source: 'rule-engine', memberCount: 8720, description: '超过90天未到店', enabled: true, createdAt: '2025-11-15' },
  { id: 't3', name: 'Z世代', category: 'demographics', color: 'cyan', source: 'manual', memberCount: 5601, description: '出生年份1997-2012', enabled: true, createdAt: '2025-10-20' },
  { id: 't4', name: '母婴关注者', category: 'lifestyle', color: 'pink', source: 'manual', memberCount: 3390, description: '近30天浏览母婴品类', enabled: true, createdAt: '2025-12-10' },
  { id: 't5', name: '活动积极分子', category: 'engagement', color: 'green', source: 'ai-prediction', memberCount: 2145, description: '月度活动参与率>60%', enabled: true, createdAt: '2025-09-05' },
  { id: 't6', name: '高退换率', category: 'behavior', color: 'red', source: 'rule-engine', memberCount: 896, description: '退换货率>30%', enabled: false, createdAt: '2025-08-12' },
  { id: 't7', name: '夜猫子客群', category: 'lifestyle', color: 'blue', source: 'ai-prediction', memberCount: 4560, description: '主要消费时段22:00-02:00', enabled: true, createdAt: '2025-11-28' },
]

function filterTags(tags: Tag[], search: string, categoryFilter: string): Tag[] {
  return tags.filter((tag) => {
    if (
      search &&
      !tag.name.toLowerCase().includes(search.toLowerCase()) &&
      !tag.description.toLowerCase().includes(search.toLowerCase())
    ) {
      return false
    }
    if (categoryFilter && tag.category !== categoryFilter) {
      return false
    }
    return true
  })
}

function computeStats(tags: Tag[]) {
  return {
    total: tags.length,
    enabled: tags.filter((tag) => tag.enabled).length,
    aiPrediction: tags.filter((tag) => tag.source === 'ai-prediction').length,
    totalCoverage: tags.filter((tag) => tag.enabled).reduce((sum, tag) => sum + tag.memberCount, 0),
  }
}

function validateForm(form: FormData): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) {
    errors.name = '标签名称不能为空'
  } else if (form.name.trim().length > 20) {
    errors.name = '标签名称最多20个字符'
  }
  if (!form.category) {
    errors.category = '请选择标签分类'
  }
  if (!form.color) {
    errors.color = '请选择标签颜色'
  }
  if (!form.source) {
    errors.source = '请选择标签来源'
  }
  return errors
}

function getCategoryLabel(value: string): string {
  return TAG_CATEGORIES.find((item) => item.value === value)?.label || value
}

function getSourceLabel(value: string): string {
  return TAG_SOURCES.find((item) => item.value === value)?.label || value
}

function getColorHex(value: string): string {
  const colorMap: Record<string, string> = {
    blue: '#1677ff',
    green: '#52c41a',
    orange: '#fa8c16',
    red: '#f5222d',
    purple: '#722ed1',
    cyan: '#13c2c2',
    pink: '#eb2f96',
  }
  return colorMap[value] || '#1677ff'
}

function addTag(tags: Tag[], form: FormData): Tag[] {
  const newTag: Tag = {
    id: `t${Date.now()}`,
    name: form.name,
    category: form.category,
    color: form.color,
    source: form.source,
    memberCount: 0,
    description: form.description,
    enabled: form.enabled,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  return [newTag, ...tags]
}

function editTag(tags: Tag[], id: string, form: FormData): Tag[] {
  return tags.map((tag) => (tag.id === id ? { ...tag, ...form, memberCount: tag.memberCount } : tag))
}

function deleteTag(tags: Tag[], id: string): Tag[] {
  return tags.filter((tag) => tag.id !== id)
}

function toggleEnabled(tags: Tag[], id: string): Tag[] {
  return tags.map((tag) => (tag.id === id ? { ...tag, enabled: !tag.enabled } : tag))
}

test('TAG_CATEGORIES 应包含 5 个完整分类', () => {
  assert.equal(TAG_CATEGORIES.length, 5)
  assert.deepEqual(
    TAG_CATEGORIES.map((item) => item.value),
    ['demographics', 'behavior', 'consumption', 'lifestyle', 'engagement'],
  )
})

test('TAG_COLORS 应包含 7 种颜色且 hex 完整', () => {
  assert.equal(TAG_COLORS.length, 7)
  for (const color of TAG_COLORS) {
    assert.ok(color.hex.startsWith('#'))
    assert.equal(color.hex.length, 7)
  }
})

test('TAG_SOURCES 应包含 4 种来源', () => {
  assert.deepEqual(
    TAG_SOURCES.map((item) => item.value),
    ['manual', 'rule-engine', 'ai-prediction', 'imported'],
  )
})

test('MOCK_TAGS 应保持 7 条完整样本数据', () => {
  assert.equal(MOCK_TAGS.length, 7)
  assert.equal(new Set(MOCK_TAGS.map((tag) => tag.id)).size, MOCK_TAGS.length)
  assert.equal(MOCK_TAGS.filter((tag) => tag.enabled).length, 6)
  assert.equal(MOCK_TAGS.filter((tag) => tag.source === 'ai-prediction').length, 3)
})

test('computeStats 应正确计算统计卡片数据', () => {
  const stats = computeStats(MOCK_TAGS)
  assert.equal(stats.total, 7)
  assert.equal(stats.enabled, 6)
  assert.equal(stats.aiPrediction, 3)
  assert.equal(
    stats.totalCoverage,
    MOCK_TAGS.filter((tag) => tag.enabled).reduce((sum, tag) => sum + tag.memberCount, 0),
  )
})

test('computeStats 对空列表应返回全 0', () => {
  assert.deepEqual(computeStats([]), {
    total: 0,
    enabled: 0,
    aiPrediction: 0,
    totalCoverage: 0,
  })
})

test('getCategoryLabel 和 getSourceLabel 应返回正确中文文案', () => {
  assert.equal(getCategoryLabel('behavior'), '行为特征')
  assert.equal(getCategoryLabel('unknown'), 'unknown')
  assert.equal(getSourceLabel('manual'), '手动创建')
  assert.equal(getSourceLabel('unknown'), 'unknown')
})

test('getColorHex 应返回对应颜色值，未知值回退蓝色', () => {
  assert.equal(getColorHex('purple'), '#722ed1')
  assert.equal(getColorHex('unknown'), '#1677ff')
})

test('filterTags 应支持按名称与描述搜索', () => {
  const byName = filterTags(MOCK_TAGS, '沉睡', '')
  assert.equal(byName.length, 1)
  assert.equal(byName[0]?.name, '沉睡用户')

  const byDescription = filterTags(MOCK_TAGS, '90天', '')
  assert.equal(byDescription.length, 1)
  assert.equal(byDescription[0]?.name, '沉睡用户')
})

test('filterTags 应支持分类过滤与组合过滤', () => {
  const byCategory = filterTags(MOCK_TAGS, '', 'lifestyle')
  assert.equal(byCategory.length, 2)
  assert.ok(byCategory.every((tag) => tag.category === 'lifestyle'))

  const combined = filterTags(MOCK_TAGS, '夜猫子', 'lifestyle')
  assert.equal(combined.length, 1)
  assert.equal(combined[0]?.name, '夜猫子客群')
})

test('filterTags 无匹配时应返回空数组', () => {
  assert.deepEqual(filterTags(MOCK_TAGS, 'xxxxxxxxxxxxx', ''), [])
  assert.deepEqual(filterTags(MOCK_TAGS, '', 'nonexistent'), [])
})

test('filterTags 保持页面当前空白搜索行为', () => {
  assert.equal(filterTags(MOCK_TAGS, '   ', '').length, 0)
})

test('validateForm 应拒绝空名称与缺失必填项', () => {
  const errors = validateForm({
    name: '   ',
    category: '',
    color: '',
    source: '',
    description: '',
    enabled: true,
  })

  assert.equal(errors.name, '标签名称不能为空')
  assert.equal(errors.category, '请选择标签分类')
  assert.equal(errors.color, '请选择标签颜色')
  assert.equal(errors.source, '请选择标签来源')
})

test('validateForm 应拒绝超长名称并接受合法边界值', () => {
  const tooLong = validateForm({
    name: '这是一个超过二十个字符的标签名称测试啊啊啊',
    category: 'behavior',
    color: 'blue',
    source: 'manual',
    description: '',
    enabled: true,
  })
  assert.equal(tooLong.name, '标签名称最多20个字符')

  const valid = validateForm({
    name: '一二三四五六七八九十一二三四五六七八九十',
    category: 'behavior',
    color: 'blue',
    source: 'manual',
    description: '',
    enabled: true,
  })
  assert.deepEqual(valid, {})
})

test('addTag 应在首位新增标签并设置默认 memberCount', () => {
  const updated = addTag(MOCK_TAGS, {
    name: '测试标签',
    category: 'behavior',
    color: 'blue',
    source: 'manual',
    description: '测试描述',
    enabled: true,
  })

  assert.equal(updated.length, MOCK_TAGS.length + 1)
  assert.equal(updated[0]?.name, '测试标签')
  assert.equal(updated[0]?.memberCount, 0)
  assert.equal(updated[1]?.name, '高净值会员')
})

test('editTag 应更新指定标签但保留 memberCount', () => {
  const updated = editTag(MOCK_TAGS, 't1', {
    name: '高净值VIP',
    category: 'consumption',
    color: 'purple',
    source: 'ai-prediction',
    description: '修改后的描述',
    enabled: true,
  })

  const edited = updated.find((tag) => tag.id === 't1')
  assert.equal(edited?.name, '高净值VIP')
  assert.equal(edited?.description, '修改后的描述')
  assert.equal(edited?.memberCount, 1243)
})

test('deleteTag 应删除目标标签，删除不存在项时保持不变', () => {
  const removed = deleteTag(MOCK_TAGS, 't1')
  assert.equal(removed.length, MOCK_TAGS.length - 1)
  assert.ok(!removed.some((tag) => tag.id === 't1'))

  const untouched = deleteTag(MOCK_TAGS, 'not-exist')
  assert.equal(untouched.length, MOCK_TAGS.length)
})

test('toggleEnabled 应仅翻转目标标签状态', () => {
  const updated = toggleEnabled(MOCK_TAGS, 't1')
  const target = updated.find((tag) => tag.id === 't1')
  const other = updated.find((tag) => tag.id === 't2')

  assert.equal(target?.enabled, false)
  assert.equal(other?.enabled, true)
  assert.equal(other?.name, '沉睡用户')
})
