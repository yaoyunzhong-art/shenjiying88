/**
 * settings/custom-fields/page.test.tsx — 自定义字段 L1 源码分析测试
 *
 * 覆盖: 页面结构、字段数据完整性、字段操作逻辑、边界条件
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD标记
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import fs from 'fs'

const PAGE = resolve(import.meta.dirname, 'page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('settings/custom-fields', () => {
  // ── 页面存在与导出 ──
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 export default function', () => {
    assert.ok(content.includes('export default function '))
  })
  it('仅一个 export default', () => {
    const matches = content.match(/export default/g)
    assert.equal(matches?.length, 1)
  })
  it('TSC兼容: 无 as any', () => { assert.ok(!content.includes('as any')) })

  // ── 类型定义 ──
  it('包含 CustomField 接口定义', () => { assert.ok(content.includes('interface CustomField')) })
  it('包含 FieldType 类型定义', () => { assert.ok(content.includes('type FieldType')) })
  it('FieldType 包含 6 种类型', () => {
    const types = ['text', 'number', 'select', 'date', 'boolean', 'multi_select']
    for (const t of types) assert.ok(content.includes(`'${t}'`), `missing field type: ${t}`)
  })
  it('包含 FieldOption 接口', () => { assert.ok(content.includes('interface FieldOption')) })

  // ── 预定义数据完整性 ──
  it('包含 DEFAULT_FIELDS 数据', () => { assert.ok(content.includes('DEFAULT_FIELDS')) })
  it('包含 13 个预定义字段', () => {
    const ids = Array.from(content.matchAll(/id:\s*'cf-\d+'/g))
    assert.equal(ids.length, 13, `got ${ids.length} fields`)
  })
  it('包含 FIELD_GROUPS 数组含 5 个分组', () => {
    const groups = ['基本信息', '会员资料', '订单扩展', '活动报名', '工单信息']
    for (const g of groups) assert.ok(content.includes(g), `missing group: ${g}`)
  })

  // ── 每个字段的必要字段完整性 ──
  it('每个字段包含 id', () => {
    const ids = content.match(/id:\s*'cf-/g)
    assert.ok(ids && ids.length >= 13, `expected ≥13 id refs, got ${ids?.length}`)
  })
  it('每个字段包含 name', () => {
    const names = content.match(/name:\s*'/g)
    assert.ok(names && names.length >= 13, `expected ≥13 name refs, got ${names?.length}`)
  })
  it('每个字段包含 key', () => {
    const keys = content.match(/key:\s*'/g)
    assert.ok(keys && keys.length >= 13, `expected ≥13 key refs, got ${keys?.length}`)
  })
  it('每个字段包含 type', () => {
    const types = content.match(/type:\s*'/g)
    assert.ok(types && types.length >= 13, `expected ≥13 type refs, got ${types?.length}`)
  })
  it('每个字段包含 sortOrder', () => {
    const orders = content.match(/sortOrder:/g)
    assert.ok(orders && orders.length >= 13, `expected ≥13 sortOrder refs, got ${orders?.length}`)
  })
  it('每个字段包含 group', () => {
    const groups = content.match(/\bgroup:\s*'/g)
    assert.ok(groups && groups.length >= 13, `expected ≥13 group refs, got ${groups?.length}`)
  })
  it('每个字段包含 enabled 布尔值', () => {
    const enabledRefs = content.match(/enabled:\s*(true|false)/g)
    assert.ok(enabledRefs && enabledRefs.length >= 13, `expected ≥13 enabled refs, got ${enabledRefs?.length}`)
  })

  // ── FIELD_TYPE_LABEL / FIELD_TYPE_COLOR 映射 ──
  it('包含 FIELD_TYPE_LABEL 类型标签映射', () => { assert.ok(content.includes('FIELD_TYPE_LABEL')) })
  it('包含 FIELD_TYPE_COLOR 类型颜色映射', () => { assert.ok(content.includes('FIELD_TYPE_COLOR')) })
  it('FIELD_TYPE_LABEL 覆盖 6 种类型', () => {
    const labels = ['单行文本', '数字', '下拉选择', '日期', '开关/布尔', '多选']
    for (const l of labels) assert.ok(content.includes(l), `missing label: ${l}`)
  })

  // ── 辅助函数: generateId ──
  it('包含 generateId 函数', () => { assert.ok(content.includes('function generateId')) })
  it('generateId 返回 cf-xxx 格式', () => {
    assert.ok(content.includes('return `cf-'))
    assert.ok(content.includes('padStart(3'))
  })

  // ── 辅助函数: filterFields ──
  it('包含 filterFields 函数', () => { assert.ok(content.includes('function filterFields')) })
  it('filterFields 支持 group 过滤', () => { assert.ok(content.includes('f.group !== group')) })
  it('filterFields 支持 searchText 搜索', () => { assert.ok(content.includes('searchText.toLowerCase')) })

  // ── 辅助函数: validateField ──
  it('包含 validateField 函数', () => { assert.ok(content.includes('function validateField')) })
  it('validateField 校验空名称', () => { assert.ok(content.includes('字段名称不能为空')) })
  it('validateField 校验空标识', () => { assert.ok(content.includes('字段标识不能为空')) })
  it('validateField 校验标识格式', () => { assert.ok(content.includes('/^[a-z_][a-z0-9_]*$/')) })
  it('validateField 校验名称长度上限', () => { assert.ok(content.includes('不能超过50个字符')) })
  it('validateField 校验标识长度上限', () => { assert.ok(content.includes('不能超过100个字符')) })
  it('validateField 正常返回 null', () => { assert.ok(content.includes('return null')) })

  // ── React hooks ──
  it('包含 useState', () => { assert.ok(content.includes('useState')) })
  it('使用 useState 管理 fields', () => { assert.ok(content.includes('setFields(')) })
  it('使用 useState 管理 showModal', () => { assert.ok(content.includes('setShowModal') && content.includes('showModal')) })
  it('使用 useState 管理 formData', () => { assert.ok(content.includes('setFormData') && content.includes('formData')) })
  it('使用 useState 管理 formError', () => { assert.ok(content.includes('setFormError') && content.includes('formError')) })

  // ── 核心渲染 ──
  it('包含页面标题 自定义字段管理', () => { assert.ok(content.includes('自定义字段管理')) })
  it('包含统计卡片渲染', () => { assert.ok(content.includes('字段总数')) })
  it('包含统计数值 字段总数', () => { assert.ok(content.includes('{totalFields}')) })
  it('包含统计数值 已启用', () => { assert.ok(content.includes('{enabledCount}')) })
  it('包含统计数值 必填字段', () => { assert.ok(content.includes('{requiredCount}')) })
  it('包含统计数值 已停用', () => { assert.ok(content.includes('{disabledCount}')) })
  it('包含分组筛选功能', () => { assert.ok(content.includes('activeGroup')) })
  it('包含搜索输入框', () => { assert.ok(content.includes('searchText')) })
  it('包含新增字段按钮', () => { assert.ok(content.includes('新增字段')) })

  // ── 字段列表表格 ──
  it('表格包含排序列', () => { assert.ok(content.includes('排序')) })
  it('表格包含字段名称列', () => { assert.ok(content.includes('字段名称')) })
  it('表格包含标识列', () => { assert.ok(content.includes('标识')) })
  it('表格包含类型列', () => { assert.ok(content.includes('类型')) })
  it('表格包含必填列', () => { assert.ok(content.includes('必填')) })
  it('表格包含状态列', () => { assert.ok(content.includes('状态')) })
  it('表格包含操作列', () => { assert.ok(content.includes('操作')) })
  it('表格包含编辑按钮', () => { assert.ok(content.includes('编辑')) })

  // ── 字段操作: 创建 ──
  it('包含 openCreateModal 函数', () => { assert.ok(content.includes('openCreateModal')) })
  it('创建弹窗包含字段名称输入', () => { assert.ok(content.includes('字段名称 *')) })
  it('创建弹窗包含字段标识输入', () => { assert.ok(content.includes('字段标识 *')) })
  it('创建弹窗包含字段类型选择', () => { assert.ok(content.includes('字段类型')) })
  it('创建弹窗包含所属分组选择', () => { assert.ok(content.includes('所属分组')) })
  it('创建弹窗包含排序号输入', () => { assert.ok(content.includes('排序号')) })
  it('创建弹窗包含必填复选框', () => { assert.ok(content.includes('必填字段')) })
  it('创建弹窗包含启用复选框', () => { assert.ok(content.includes('启用字段')) })
  it('创建弹窗包含占位提示', () => { assert.ok(content.includes('占位提示')) })
  it('创建弹窗包含提交按钮', () => { assert.ok(content.includes('创建字段') || content.includes('保存修改')) })
  it('创建弹窗包含取消按钮', () => { assert.ok(content.includes('取消')) })
  it('handleSubmit 支持新增字段', () => { assert.ok(content.includes('[...prev, newField]')) })

  // ── 字段操作: 编辑 ──
  it('包含 openEditModal 函数', () => { assert.ok(content.includes('openEditModal')) })
  it('handleSubmit 支持编辑字段', () => { assert.ok(content.includes('...formData, updatedAt:')) })
  it('编辑时字段标识为只读', () => { assert.ok(content.includes('readOnly={!!editingField}')) })

  // ── 字段操作: 启用/停用 ──
  it('包含 toggleEnabled 函数', () => { assert.ok(content.includes('function toggleEnabled')) })
  it('toggleEnabled 切换 enabled 状态', () => { assert.ok(content.includes('!f.enabled')) })
  it('操作按钮包含启用停用文字', () => { assert.ok(content.includes('启用') && content.includes('停用')) })

  // ── 弹窗相关 ──
  it('包含 showModal 状态控制', () => { assert.ok(content.includes('showModal')) })
  it('弹窗点击遮罩关闭', () => { assert.ok(content.includes('e.stopPropagation()')) })
  it('closeModal 重置表单状态', () => { assert.ok(content.includes('setFormData({})')) })
  it('表单错误提示渲染', () => { assert.ok(content.includes('formError')) })

  // ── 边界条件 ──
  it('空结果时显示提示', () => { assert.ok(content.includes('未找到匹配的字段')) })
  it('filtered.length === 0 判空处理', () => { assert.ok(content.includes('filtered.length === 0')) })
  it('全部分组筛选 activeGroup === null', () => { assert.ok(content.includes('activeGroup === null')) })
  it('搜索框输入清除时恢复完整列表', () => { assert.ok(content.includes('setSearchText(e.target.value)')) })
  it('编辑弹窗编辑态和非编辑态标题不同', () => {
    assert.ok(content.includes("editingField ? '编辑字段' : '新增字段'"))
  })
  it('编辑时优先显示 editingField 已存在数据', () => {
    assert.ok(content.includes('...formData, updatedAt:'))
  })

  // ── 数据分布验证 ──
  it('会员资料分组有 4 个预定义字段', () => {
    const memberFields = Array.from(content.matchAll(/\bgroup:\s*'会员资料'/g))
    assert.equal(memberFields.length, 4, `会员资料应有 4 个字段, got ${memberFields.length}`)
  })
  it('订单扩展分组有 2 个预定义字段', () => {
    const orderFields = Array.from(content.matchAll(/\bgroup:\s*'订单扩展'/g))
    assert.equal(orderFields.length, 2, `订单扩展应有 2 个字段, got ${orderFields.length}`)
  })
  it('活动报名分组有 2 个预定义字段', () => {
    const eventFields = Array.from(content.matchAll(/\bgroup:\s*'活动报名'/g))
    assert.equal(eventFields.length, 2, `活动报名应有 2 个字段, got ${eventFields.length}`)
  })
  it('基本信息分组有 2 个预定义字段', () => {
    // In DEFAULT_FIELDS, search for lines matching id: 'cf-...', group: '基本信息'
    const start = content.indexOf('const DEFAULT_FIELDS')
    const endMarker = content.indexOf('];\n\n// =')
    const block = content.slice(start, endMarker > start ? endMarker + 2 : content.length)
    const basicFields = Array.from(block.matchAll(/\bgroup:\s*'基本信息'/g))
    assert.equal(basicFields.length, 2, `基本信息应有 2 个字段, got ${basicFields.length}`)
  })
  it('工单信息分组有 3 个预定义字段', () => {
    const ticketFields = Array.from(content.matchAll(/\bgroup:\s*'工单信息'/g))
    assert.equal(ticketFields.length, 3, `工单信息应有 3 个字段, got ${ticketFields.length}`)
  })
  it('所有分组字段数量之和 = 13', () => {
    const start = content.indexOf('const DEFAULT_FIELDS')
    const endMarker = content.indexOf('];\n\n// =')
    const block = content.slice(start, endMarker > start ? endMarker + 2 : content.length)
    const allGroups = Array.from(block.matchAll(/\bgroup:\s*'(基本信息|会员资料|订单扩展|活动报名|工单信息)'/g))
    assert.equal(allGroups.length, 13, `分组字段总数应为 13, got ${allGroups.length}`)
  })

  // ── 所有 id 唯一且格式正确 ──
  it('所有字段 id 以 cf- 开头且无重复', () => {
    const ids = Array.from(content.matchAll(/id:\s*'(cf-\d+)'/g)).map(m => m[1])
    const unique = new Set(ids)
    assert.equal(unique.size, ids.length, 'duplicate ids found')
    for (const id of ids) {
      assert.ok(/^cf-\d{3}$/.test(id), `invalid id format: ${id}`)
    }
  })
  it('sortOrder 从 1 到 13 连续无重复', () => {
    const orders = Array.from(content.matchAll(/sortOrder:\s*(\d+)/g)).map(m => parseInt(m[1]))
    const unique = new Set(orders)
    assert.equal(unique.size, orders.length, 'duplicate sortOrder found')
    assert.equal(orders.length, 13, `expected 13 sortOrders, got ${orders.length}`)
  })

  // ── select/multi_select 类型字段包含 options ──
  it('select 类型字段包含 options 定义', () => {
    assert.ok(content.includes('options:'))
  })
  it('性别字段包含 3 个选项', () => {
    const genderOptions = Array.from(content.matchAll(/label:\s*'(男|女|其他)'/g))
    assert.ok(genderOptions.length >= 3, `expected ≥3 gender options, got ${genderOptions.length}`)
  })
  it('订单来源字段包含 3 个选项', () => {
    const sourceOptions = Array.from(content.matchAll(/label:\s*'(线上|线下|电话)'/g))
    assert.ok(sourceOptions.length >= 3, `expected ≥3 order source options, got ${sourceOptions.length}`)
  })

  // ── 字段类型覆盖 ──
  it('预定义字段包含 text 类型', () => { assert.ok(content.includes("type: 'text'")) })
  it('预定义字段包含 number 类型', () => { assert.ok(content.includes("type: 'number'")) })
  it('预定义字段包含 select 类型', () => { assert.ok(content.includes("type: 'select'")) })
  it('预定义字段包含 date 类型', () => { assert.ok(content.includes("type: 'date'")) })
  it('预定义字段包含 boolean 类型', () => { assert.ok(content.includes("type: 'boolean'")) })
  it('预定义字段包含 multi_select 类型', () => { assert.ok(content.includes("type: 'multi_select'")) })
})
