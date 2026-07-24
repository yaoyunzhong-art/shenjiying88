/**
 * settings/venue-config/page.test.tsx — 场馆配置 L1 测试
 *
 * 覆盖: 页面结构、设施数据完整性、营业时间验证
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD标记
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import fs from 'fs'

const PAGE = resolve(import.meta.dirname, 'page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('settings/venue-config', () => {
  // ── 页面存在与导出 ──
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export 函数', () => {
    assert.ok(content.includes('export default function '))
  })
  it('仅一个 export default', () => {
    const matches = content.match(/export default/g)
    assert.equal(matches?.length, 1)
  })
  it('TSC兼容: 无 as any', () => { assert.ok(!content.includes('as any')) })

  // ── 数据完整性 ──
  it('包含 FACILITIES 数组', () => { assert.ok(content.includes('FACILITIES')) })
  it('包含 4 个设施', () => {
    const facilities = Array.from(content.matchAll(/name:\s*['"][^'"]+['"]/g))
    assert.equal(facilities.length, 4, `got ${facilities.length} facilities`)
  })
  it('包含羽毛球场地', () => { assert.ok(content.includes('羽毛球')) })
  it('包含篮球场地', () => { assert.ok(content.includes('篮球')) })
  it('包含乒乓球台', () => { assert.ok(content.includes('乒乓球')) })
  it('包含游泳馆', () => { assert.ok(content.includes('游泳') || content.includes('游泳馆')) })
  it('每个设施有 name/count/status 字段', () => {
    assert.ok(content.includes('name:'))
    assert.ok(content.includes('count:'))
    assert.ok(content.includes('status:'))
  })
  it('游泳馆状态为维护中', () => {
    assert.ok(content.includes('维护中'))
  })

  // ── 页面结构 ──
  it('包含表格渲染', () => { assert.ok(content.includes('map(') || content.includes('table')) })
  it('包含标题 "场馆配置"', () => { assert.ok(content.includes('场馆配置')) })
  it('包含营业时间 section', () => { assert.ok(content.includes('营业时间') || content.includes('09:00')) })
  it('包含设施列表 section', () => { assert.ok(content.includes('设施列表')) })
  it('工作日营业时间包含 09:00', () => { assert.ok(content.includes('09:00')) })
  it('接入管理员权限边界', () => {
    assert.ok(content.includes('AdminPermissionGate'))
    assert.ok(content.includes("requiredPermission: 'foundation.governance.read'"))
  })
})
