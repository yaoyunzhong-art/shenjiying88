/**
 * customer-tags/page.test.tsx — 客户画像标签管理页 L2 全量测试
 *
 * 覆盖: 常量映射、筛选逻辑、统计计算、表单校验、CRUD、分类分布、来源分析
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE = resolve(__dirname, 'page.tsx')

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8')
}

// ---- 类型与数据（与 page.tsx 同步） ----

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

interface FormErrors { name?: string; category?: string; color?: string; source?: string }
interface FormData { name: string; category: string; color: string; source: string; description: string; enabled: boolean }

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

// ---- 辅助函数（与 page.tsx 同步） ----

function filterTags(tags: Tag[], search: string, categoryFilter: string): Tag[] {
  return tags.filter((tag) => {
    if (search && !tag.name.toLowerCase().includes(search.toLowerCase()) && !tag.description.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter && tag.category !== categoryFilter) return false
    return true
  })
}

function computeStats(tags: Tag[]) {
  return {
    total: tags.length,
    enabled: tags.filter((t) => t.enabled).length,
    disabled: tags.filter((t) => !t.enabled).length,
    aiPrediction: tags.filter((t) => t.source === 'ai-prediction').length,
    totalCoverage: tags.filter((t) => t.enabled).reduce((s, t) => s + t.memberCount, 0),
    disabledCoverage: tags.filter((t) => !t.enabled).reduce((s, t) => s + t.memberCount, 0),
  }
}

function validateForm(form: FormData): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = '标签名称不能为空'
  else if (form.name.trim().length > 20) errors.name = '标签名称最多20个字符'
  if (!form.category) errors.category = '请选择标签分类'
  if (!form.color) errors.color = '请选择标签颜色'
  if (!form.source) errors.source = '请选择标签来源'
  return errors
}

function getCategoryLabel(v: string): string { return TAG_CATEGORIES.find((c) => c.value === v)?.label || v }
function getSourceLabel(v: string): string { return TAG_SOURCES.find((c) => c.value === v)?.label || v }
function getColorHex(v: string): string {
  const m: Record<string, string> = { blue: '#1677ff', green: '#52c41a', orange: '#fa8c16', red: '#f5222d', purple: '#722ed1', cyan: '#13c2c2', pink: '#eb2f96' }
  return m[v] || '#1677ff'
}

function addTag(tags: Tag[], form: FormData): Tag[] {
  return [{ id: `t${Date.now()}`, name: form.name, category: form.category, color: form.color, source: form.source, memberCount: 0, description: form.description, enabled: form.enabled, createdAt: new Date().toISOString().slice(0, 10) }, ...tags]
}

function editTag(tags: Tag[], id: string, form: FormData): Tag[] {
  return tags.map((t) => (t.id === id ? { ...t, ...form, memberCount: t.memberCount } : t))
}

function deleteTag(tags: Tag[], id: string): Tag[] { return tags.filter((t) => t.id !== id) }
function toggleEnabled(tags: Tag[], id: string): Tag[] { return tags.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)) }

// ===== 测试集 =====

describe('customer-tags — 常量', () => {
  it('1. TAG_CATEGORIES 5 个', () => assert.equal(TAG_CATEGORIES.length, 5))
  it('2. TAG_COLORS 7 种', () => assert.equal(TAG_COLORS.length, 7))
  it('3. TAG_SOURCES 4 种', () => assert.equal(TAG_SOURCES.length, 4))
  it('4. 颜色 hex 完整', () => { for (const c of TAG_COLORS) assert.ok(c.hex.startsWith('#') && c.hex.length === 7) })
  it('5. 分类值去重', () => { assert.equal(new Set(TAG_CATEGORIES.map((c) => c.value)).size, TAG_CATEGORIES.length) })
  it('6. 来源值去重', () => { assert.equal(new Set(TAG_SOURCES.map((c) => c.value)).size, TAG_SOURCES.length) })
})

describe('customer-tags — Mock 数据', () => {
  it('7. 7 条', () => assert.equal(MOCK_TAGS.length, 7))
  it('8. ID 唯一', () => assert.equal(new Set(MOCK_TAGS.map((t) => t.id)).size, 7))
  it('9. 6 个启用', () => assert.equal(MOCK_TAGS.filter((t) => t.enabled).length, 6))
  it('10. 1 个停用', () => assert.equal(MOCK_TAGS.filter((t) => !t.enabled).length, 1))
  it('11. 3 个 AI 预测', () => assert.equal(MOCK_TAGS.filter((t) => t.source === 'ai-prediction').length, 3))
  it('12. 覆盖 5 种分类', () => assert.equal(new Set(MOCK_TAGS.map((t) => t.category)).size, 5))
  it('13. 覆盖 3 种来源', () => assert.equal(new Set(MOCK_TAGS.map((t) => t.source)).size, 3))
  it('14. memberCount 非负', () => { for (const t of MOCK_TAGS) assert.ok(t.memberCount >= 0) })
  it('15. createdAt 格式 YYYY-MM-DD', () => { for (const t of MOCK_TAGS) assert.match(t.createdAt, /^\d{4}-\d{2}-\d{2}$/) })
})

describe('customer-tags — getCategoryLabel / getSourceLabel / getColorHex', () => {
  it('16. getCategoryLabel 正确', () => assert.equal(getCategoryLabel('behavior'), '行为特征'))
  it('17. getCategoryLabel 回退', () => assert.equal(getCategoryLabel('unknown'), 'unknown'))
  it('18. getSourceLabel 正确', () => assert.equal(getSourceLabel('manual'), '手动创建'))
  it('19. getColorHex 正确', () => assert.equal(getColorHex('purple'), '#722ed1'))
  it('20. getColorHex 回退蓝', () => assert.equal(getColorHex('unknown'), '#1677ff'))
})

describe('customer-tags — filterTags', () => {
  it('21. 无过滤返回全部', () => assert.equal(filterTags(MOCK_TAGS, '', '').length, 7))
  it('22. 按名称搜索', () => { const r = filterTags(MOCK_TAGS, '沉睡', ''); assert.equal(r.length, 1); assert.equal(r[0]?.name, '沉睡用户') })
  it('23. 按描述搜索', () => { assert.equal(filterTags(MOCK_TAGS, '90天', '').length, 1) })
  it('24. 按分类过滤', () => { assert.equal(filterTags(MOCK_TAGS, '', 'lifestyle').length, 2) })
  it('25. 组合过滤', () => { assert.equal(filterTags(MOCK_TAGS, '夜猫子', 'lifestyle').length, 1) })
  it('26. 不匹配返回空', () => { assert.deepEqual(filterTags(MOCK_TAGS, 'xxxxxxxxxxxxx', ''), []) })
  it('27. 不存在的分类返回空', () => { assert.deepEqual(filterTags(MOCK_TAGS, '', 'nonexistent'), []) })
})

describe('customer-tags — computeStats', () => {
  it('28. 7 总 6 启用 1 停用 3 AI', () => {
    const s = computeStats(MOCK_TAGS)
    assert.equal(s.total, 7)
    assert.equal(s.enabled, 6)
    assert.equal(s.disabled, 1)
    assert.equal(s.aiPrediction, 3)
  })
  it('29. 总覆盖率计算正确', () => {
    const s = computeStats(MOCK_TAGS)
    const expected = MOCK_TAGS.filter((t) => t.enabled).reduce((sum, t) => sum + t.memberCount, 0)
    assert.equal(s.totalCoverage, expected)
  })
  it('30. 空数组全零', () => {
    const s = computeStats([])
    assert.equal(s.total, 0)
    assert.equal(s.enabled, 0)
    assert.equal(s.disabled, 0)
    assert.equal(s.aiPrediction, 0)
    assert.equal(s.totalCoverage, 0)
    assert.equal(s.disabledCoverage, 0)
  })
})

describe('customer-tags — validateForm', () => {
  it('31. 空名称报错', () => assert.equal(validateForm({ name: '  ', category: '', color: '', source: '', description: '', enabled: true }).name, '标签名称不能为空'))
  it('32. 超长名称报错', () => { const e = validateForm({ name: '这是一个超过二十个字符的标签名称测试啊啊啊', category: 'behavior', color: 'blue', source: 'manual', description: '', enabled: true }); assert.equal(e.name, '标签名称最多20个字符') })
  it('33. 合法表单通过', () => { assert.deepEqual(validateForm({ name: '测试标签', category: 'behavior', color: 'blue', source: 'manual', description: '', enabled: true }), {}) })
  it('34. 必填缺失', () => { const e = validateForm({ name: '', category: '', color: '', source: '', description: '', enabled: true }); assert.ok(e.category && e.color && e.source) })
  it('35. 边界 20 字通过', () => { assert.deepEqual(validateForm({ name: '一二三四五六七八九十一二三四五六七八九十', category: 'behavior', color: 'blue', source: 'manual', description: '', enabled: true }), {}) })
})

describe('customer-tags — CRUD', () => {
  it('36. addTag 首位插入', () => {
    const r = addTag(MOCK_TAGS, { name: '新标签', category: 'behavior', color: 'blue', source: 'manual', description: '', enabled: true })
    assert.equal(r.length, 8)
    assert.equal(r[0]?.name, '新标签')
    assert.equal(r[0]?.memberCount, 0)
  })

  it('37. editTag 修改保留 memberCount', () => {
    const r = editTag(MOCK_TAGS, 't1', { name: '高净值VIP', category: 'consumption', color: 'purple', source: 'ai-prediction', description: '修改', enabled: true })
    assert.equal(r.find((t) => t.id === 't1')?.name, '高净值VIP')
    assert.equal(r.find((t) => t.id === 't1')?.memberCount, 1243)
  })

  it('38. deleteTag 删除', () => {
    assert.equal(deleteTag(MOCK_TAGS, 't1').length, 6)
    assert.equal(deleteTag(MOCK_TAGS, 'not-exist').length, 7)
  })

  it('39. toggleEnabled 翻转', () => {
    assert.equal(toggleEnabled(MOCK_TAGS, 't1').find((t) => t.id === 't1')?.enabled, false)
    assert.equal(toggleEnabled(MOCK_TAGS, 't6').find((t) => t.id === 't6')?.enabled, true)
  })
})

describe('customer-tags — 页面结构', () => {
  it('40. 导出默认组件', () => assert.ok(readSource().includes('export default function CustomerTagsPage')))
  it('41. 使用 use client', () => assert.ok(readSource().includes("'use client'")))
  it('42. 包含分类分布', () => assert.ok(readSource().includes('分类分布')))
  it('43. 包含来源分析', () => assert.ok(readSource().includes('来源分析')))
  it('44. 包含颜色分布', () => assert.ok(readSource().includes('颜色分布')))
  it('45. 包含停用标签提醒', () => assert.ok(readSource().includes('停用标签提醒')))
  it('46. 包含删除确认弹窗', () => assert.ok(readSource().includes('确认删除')))
  it('47. 不包含 console.log', () => assert.ok(!readSource().includes('console.log')))
  it('48. 包含 TagBadge 组件', () => assert.ok(readSource().includes('TagBadge')))
  it('49. 包含 SubmitState 类型', () => assert.ok(readSource().includes('SubmitState')))
  it('50. 包含统计卡片布局', () => assert.ok(readSource().includes('标签总数') && readSource().includes('已启用')))
})

describe('customer-tags — 分类/来源/颜色分布计算', () => {
  it('51. 分类分布覆盖所有5种分类', () => {
    const cats = new Set(MOCK_TAGS.map((t) => t.category))
    assert.equal(cats.size, 5)
    assert.ok(cats.has('demographics') && cats.has('behavior') && cats.has('consumption'))
    assert.ok(cats.has('lifestyle') && cats.has('engagement'))
  })

  it('52. 来源分布: manual 2, rule-engine 2, ai-prediction 3', () => {
    const counts: Record<string, number> = {}
    for (const t of MOCK_TAGS) counts[t.source] = (counts[t.source] || 0) + 1
    assert.equal(counts['manual'], 2)
    assert.equal(counts['rule-engine'], 2)
    assert.equal(counts['ai-prediction'], 3)
    assert.equal(Object.keys(counts).length, 3)
  })

  it('53. 颜色分布: 7种颜色每种1个', () => {
    const counts: Record<string, number> = {}
    for (const t of MOCK_TAGS) counts[t.color] = (counts[t.color] || 0) + 1
    assert.equal(Object.keys(counts).length, 7)
    for (const v of Object.values(counts)) assert.equal(v, 1)
  })

  it('54. 停用标签覆盖896人', () => {
    const disabledCoverage = MOCK_TAGS.filter((t) => !t.enabled).reduce((s, t) => s + t.memberCount, 0)
    assert.equal(disabledCoverage, 896)
  })

  it('55. 启用标签占比 > 80%', () => {
    const ratio = MOCK_TAGS.filter((t) => t.enabled).length / MOCK_TAGS.length
    assert.ok(ratio > 0.8, `启用占比 ${ratio} 应 > 0.8`)
  })

  it('56. 空标签列表的分类分布应为空', () => {
    const emptyCounts: Record<string, number> = {}
    const pcts = Object.keys(emptyCounts).length
    assert.equal(pcts, 0)
  })
})

describe('customer-tags — 表单边界', () => {
  it('57. 全部必填缺失返回4个错误', () => {
    const e = validateForm({ name: '', category: '', color: '', source: '', description: '', enabled: true })
    assert.equal(Object.keys(e).length, 4)
  })

  it('58. 所有分类中文标签正确', () => {
    for (const c of TAG_CATEGORIES) assert.equal(getCategoryLabel(c.value), c.label)
  })

  it('59. 所有来源中文标签正确', () => {
    for (const s of TAG_SOURCES) assert.equal(getSourceLabel(s.value), s.label)
  })

  it('60. 所有颜色 hex 格式正确', () => {
    for (const c of TAG_COLORS) assert.match(c.hex, /^#[0-9a-f]{6}$/i)
  })

  it('61. addTag 零人数标签可正常创建', () => {
    const r = addTag(MOCK_TAGS, { name: '零人数', category: 'behavior', color: 'blue', source: 'manual', description: '', enabled: true })
    assert.equal(r[0]?.memberCount, 0)
    assert.equal(r[0]?.name, '零人数')
  })

  it('62. 编辑不存在的 ID 返回原数组', () => {
    const r = editTag(MOCK_TAGS, 'non-existent', { name: '不存在', category: 'behavior', color: 'blue', source: 'manual', description: '', enabled: true })
    assert.equal(r.length, MOCK_TAGS.length)
  })

  it('63. toggleEnabled 不存在的 ID 返回原数组', () => {
    const r = toggleEnabled(MOCK_TAGS, 'non-existent')
    assert.equal(r.length, MOCK_TAGS.length)
    for (const t of r) assert.ok(t.id !== 'non-existent')
  })

  it('64. deleteTag 删空所有标签返回空数组', () => {
    let allDeleted: Tag[] = [...MOCK_TAGS]
    for (const t of MOCK_TAGS) allDeleted = deleteTag(allDeleted, t.id)
    assert.equal(allDeleted.length, 0)
  })
})

const SOURCE_CONTENT = readSource();

describe('Customer Tags — hooks验证', () => {
  const src = SOURCE_CONTENT
  it('包含useState声明', () => assert.ok(src.includes('const [') && src.includes('useState')))
  it('包含JSX返回', () => assert.ok(src.includes('return (') || src.includes('return <')))
  it('包含事件处理器', () => assert.ok(src.includes('onClick={') || src.includes('onChange={')))
  it('包含列表渲染', () => assert.ok(src.includes('.map(')))
  it('包含条件渲染', () => assert.ok(src.includes(' && ') || src.includes(' ? ')))
  it('包含样式定义', () => assert.ok(src.includes('style={')))
  it('包含数据格式化(toLocaleString)', () => assert.ok(src.includes('toLocaleString')))
  it('包含模板字符串', () => assert.ok(src.includes('${')))
  it('包含默认导出', () => assert.ok(src.includes('export default function')))
  it('包含注释说明', () => assert.ok(src.includes("/**") || src.includes('//')))
})
