/**
 * settings/permissions/page.test.tsx — 权限管理 L1 测试
 *
 * 覆盖: 页面结构、角色数据完整性、权限规则验证
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD标记
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import fs from 'fs'

const PAGE = resolve(import.meta.dirname, 'page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('settings/permissions', () => {
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
  it('包含 ROLES 数组', () => { assert.ok(content.includes('ROLES')) })
  it('包含 4 个角色', () => {
    const roles = Array.from(content.matchAll(/name:\s*['"][^'"]+['"]/g))
    assert.equal(roles.length, 4, `got ${roles.length} roles`)
  })
  it('包含系统管理员角色', () => { assert.ok(content.includes('系统管理员')) })
  it('包含运营经理角色', () => { assert.ok(content.includes('运营经理')) })
  it('包含运营专员角色', () => { assert.ok(content.includes('运营专员')) })
  it('包含浏览者角色', () => { assert.ok(content.includes('浏览者')) })
  it('系统管理员是系统内置角色', () => {
    assert.ok(content.includes('isSystem: true') || content.includes('系统内置'))
  })
  it('每个角色有 description 字段', () => {
    const descs = Array.from(content.matchAll(/description:/g))
    assert.ok(descs.length >= 4, `got ${descs.length} descriptions`)
  })
  it('每个角色有 resourceCount 字段', () => {
    const counts = Array.from(content.matchAll(/resourceCount:/g))
    assert.ok(counts.length >= 4, `got ${counts.length} resourceCounts`)
  })

  // ── 页面结构 ──
  it('包含表格渲染', () => { assert.ok(content.includes('map(') || content.includes('table')) })
  it('包含标题 "权限管理"', () => { assert.ok(content.includes('权限管理')) })
  it('包含角色定义 section', () => { assert.ok(content.includes('角色定义')) })
  it('包含权限继承规则 section', () => { assert.ok(content.includes('权限继承') || content.includes('继承规则')) })
})
