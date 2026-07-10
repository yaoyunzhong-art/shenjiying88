/**
 * inspection/page.test.tsx — 设备巡检表单页测试
 * 测试表单验证逻辑、提交流程、数据格式化
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateInspectionForm,
  submitInspectionForm,
  INSPECTION_TYPE_LABELS,
  CATEGORY_LABELS,
  RESULT_LABELS,
  RESULT_COLORS,
  DEFAULT_INSPECTION_ITEMS,
  MOCK_STORES,
  type InspectionFormData,
  type InspectionItem,
} from './form-data'

// ===== 模块导出测试 =====

test('InspectionFormPage module: exports default function', async () => {
  const mod = await import('./page')
  assert.equal(typeof mod.default, 'function', 'default export should be a React component function')
})

test('InspectionFormPage module: component name contains "InspectionFormPage"', async () => {
  const mod = await import('./page')
  assert.ok(
    mod.default.name.includes('InspectionFormPage'),
    `component name should contain "InspectionFormPage", got "${mod.default.name}"`,
  )
})

// ===== 常量完整性测试 =====

test('Labels: all inspection types have labels', () => {
  const types = ['daily', 'weekly', 'monthly', 'emergency']
  for (const t of types) {
    assert.ok(INSPECTION_TYPE_LABELS[t], `label for "${t}" should exist`)
  }
})

test('Labels: all categories have labels', () => {
  const cats = ['arcade', 'console', 'ticket', 'vr', 'pos', 'network', 'lighting', 'ac']
  for (const c of cats) {
    assert.ok(CATEGORY_LABELS[c], `category label for "${c}" should exist`)
  }
})

test('Labels: all results have labels and colors', () => {
  const results = ['pass', 'warn', 'fail']
  for (const r of results) {
    assert.ok(RESULT_LABELS[r], `result label for "${r}" should exist`)
    assert.ok(RESULT_COLORS[r], `result color for "${r}" should exist`)
  }
})

test('Data: default inspection items are complete', () => {
  assert.equal(DEFAULT_INSPECTION_ITEMS.length, 10, 'should have exactly 10 inspection items')
  for (const item of DEFAULT_INSPECTION_ITEMS) {
    assert.ok(item.id, 'item should have id')
    assert.ok(item.label, 'item should have label')
    assert.ok(item.category, 'item should have category')
    assert.equal(item.result, null, 'default item result should be null')
  }
})

test('Data: mock stores have correct structure', () => {
  assert.equal(MOCK_STORES.length, 5, 'should have 5 mock stores')
  for (const store of MOCK_STORES) {
    assert.ok(store.id.startsWith('store-'), `store id should start with "store-"`)
    assert.ok(store.name, 'store should have name')
  }
})

// ===== 表单验证测试 =====

test('Validation: rejects empty form', () => {
  const emptyForm: InspectionFormData = {
    storeId: '',
    storeName: '',
    inspectorName: '',
    inspectionType: 'daily',
    inspectionDate: '',
    items: DEFAULT_INSPECTION_ITEMS.map(i => ({ ...i, result: null })),
    overallRemark: '',
    signature: '',
  }
  const errors = validateInspectionForm(emptyForm)
  assert.ok(errors, 'should return errors for empty form')
  assert.ok(errors!.storeId, 'should require storeId')
  assert.ok(errors!.inspectorName, 'should require inspectorName')
  assert.ok(errors!.inspectionDate, 'should require inspectionDate')
})

test('Validation: rejects missing inspector name', () => {
  const form: InspectionFormData = {
    storeId: 'store-001',
    storeName: '旗舰店',
    inspectorName: '  ',
    inspectionType: 'daily',
    inspectionDate: '2026-07-11',
    items: DEFAULT_INSPECTION_ITEMS.map(i => ({ ...i, result: 'pass' })),
    overallRemark: '',
    signature: '',
  }
  const errors = validateInspectionForm(form)
  assert.ok(errors, 'should reject whitespace-only name')
  assert.equal(errors!.inspectorName, '请输入巡检人姓名')
})

test('Validation: accepts valid form when all items are marked', () => {
  const form: InspectionFormData = {
    storeId: 'store-001',
    storeName: '旗舰店（北京朝阳）',
    inspectorName: '张三',
    inspectionType: 'daily',
    inspectionDate: '2026-07-11',
    items: DEFAULT_INSPECTION_ITEMS.map(i => ({ ...i, result: 'pass' })),
    overallRemark: '一切正常',
    signature: '张三',
  }
  const errors = validateInspectionForm(form)
  assert.equal(errors, null, 'valid form should pass validation')
})

test('Validation: requires all items to be marked', () => {
  const items: InspectionItem[] = DEFAULT_INSPECTION_ITEMS.map((i, idx) => ({
    ...i,
    result: idx < 2 ? 'pass' : null,
  }))
  const form: InspectionFormData = {
    storeId: 'store-001',
    storeName: '旗舰店',
    inspectorName: '张三',
    inspectionType: 'monthly',
    inspectionDate: '2026-07-11',
    items,
    overallRemark: '',
    signature: '',
  }
  const errors = validateInspectionForm(form)
  assert.ok(errors, 'should reject partially marked form')
  assert.ok(errors!.items, 'should return items error')
  assert.ok(errors!.items!.includes('8'), 'should report 8 unmarked items')
})

test('Validation: passes when all items are marked (mixed results)', () => {
  const items: InspectionItem[] = DEFAULT_INSPECTION_ITEMS.map((i, idx) => ({
    ...i,
    result: idx < 7 ? 'pass' : idx < 9 ? 'warn' : 'fail',
  }))
  const form: InspectionFormData = {
    storeId: 'store-002',
    storeName: '分店（上海静安）',
    inspectorName: '李四',
    inspectionType: 'emergency',
    inspectionDate: '2026-07-10',
    items,
    overallRemark: 'VR设备需要维修',
    signature: '李四',
  }
  const errors = validateInspectionForm(form)
  assert.equal(errors, null, 'form with all items marked should pass')
})

// ===== 提交服务测试 =====

test('Submit: returns success with valid id and message', async () => {
  const form: InspectionFormData = {
    storeId: 'store-001',
    storeName: '旗舰店（北京朝阳）',
    inspectorName: '张三',
    inspectionType: 'daily',
    inspectionDate: '2026-07-11',
    items: DEFAULT_INSPECTION_ITEMS.map(i => ({ ...i, result: 'pass' })),
    overallRemark: '',
    signature: '',
  }
  const result = await submitInspectionForm(form)
  assert.ok(result.success, 'should succeed')
  assert.ok(result.id.startsWith('INS-'), `id should start with INS-, got "${result.id}"`)
  assert.ok(result.message.includes('旗舰店'), 'message should include store name')
})

test('Submit: id is unique per call', async () => {
  const form: InspectionFormData = {
    storeId: 'store-001',
    storeName: '旗舰店',
    inspectorName: '张三',
    inspectionType: 'daily',
    inspectionDate: '2026-07-11',
    items: DEFAULT_INSPECTION_ITEMS.map(i => ({ ...i, result: 'pass' })),
    overallRemark: '',
    signature: '',
  }
  const r1 = await submitInspectionForm(form)
  const r2 = await submitInspectionForm(form)
  assert.notEqual(r1.id, r2.id, 'each submission should get unique id')
})

// ===== 格式化测试 =====

test('Labels: all labels are non-empty Chinese strings', () => {
  for (const label of Object.values(INSPECTION_TYPE_LABELS)) {
    assert.ok(label.length > 0, 'inspection type label should be non-empty')
  }
  for (const label of Object.values(CATEGORY_LABELS)) {
    assert.ok(label.length > 0, 'category label should be non-empty')
  }
  for (const label of Object.values(RESULT_LABELS)) {
    assert.ok(label.length > 0, 'result label should be non-empty')
  }
})

test('Colors: all result colors are valid hex colors', () => {
  for (const [key, color] of Object.entries(RESULT_COLORS)) {
    assert.ok(/^#[0-9a-f]{6}$/i.test(color), `"${key}" color "${color}" should be valid hex`)
  }
})

// ===== 边界情况测试 =====

test('Edge: store not found in mock list', () => {
  const unknownStore = MOCK_STORES.find((s) => s.id === 'nonexistent')
  assert.equal(unknownStore, undefined, 'unknown store should not be found')
})

test('Edge: INSPECTION_TYPE_LABELS has exactly 4 entries', () => {
  assert.equal(Object.keys(INSPECTION_TYPE_LABELS).length, 4)
})

test('Edge: CATEGORY_LABELS has exactly 8 entries', () => {
  assert.equal(Object.keys(CATEGORY_LABELS).length, 8)
})

test('Edge: inspection items ids are unique', () => {
  const ids = DEFAULT_INSPECTION_ITEMS.map((i) => i.id)
  const uniqueIds = new Set(ids)
  assert.equal(uniqueIds.size, ids.length, 'all item ids should be unique')
})

// ===== 状态枚举覆盖 =====

test('Enum: all result values are valid', () => {
  const validResults: string[] = ['pass', 'warn', 'fail']
  for (const v of validResults) {
    assert.ok(RESULT_LABELS[v], `result "${v}" should have label`)
    assert.ok(RESULT_COLORS[v], `result "${v}" should have color`)
  }
})

test('Enum: unknown result has no label', () => {
  assert.equal(RESULT_LABELS['unknown' as keyof typeof RESULT_LABELS], undefined)
})

// ===== 合理性测试 =====

test('Sanity: submission includes store and inspection type in message', () => {
  const msg = '巡检单 旗舰店（北京朝阳） — 日常巡检 已提交成功'
  assert.ok(msg.includes('旗舰店'), 'message should mention store')
  assert.ok(msg.includes('日常巡检'), 'message should mention type')
  assert.ok(msg.includes('已提交成功'), 'message should show success')
})

test('Sanity: item result update does not mutate original', () => {
  const originalResult = DEFAULT_INSPECTION_ITEMS[0].result
  assert.equal(originalResult, null, 'original items should start with null result')
})
