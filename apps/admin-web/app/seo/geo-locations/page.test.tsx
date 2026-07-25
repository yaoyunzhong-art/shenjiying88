import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8')

describe('GEO地域标签页', () => {
  it('正例: 包含页面标题', () => {
    assert.ok(SRC.includes('GEO 地域标签'))
  })
  it('正例: 包含城市样本', () => {
    assert.ok(SRC.includes('上海'))
    assert.ok(SRC.includes('成都'))
    assert.ok(SRC.includes('深圳'))
  })
  it('正例: 包含搜索过滤逻辑', () => {
    assert.ok(SRC.includes('搜索城市/商圈/地标...'))
    assert.ok(SRC.includes('.includes(q)'))
  })
  it('正例: 包含城市筛选', () => {
    assert.ok(SRC.includes('全部城市'))
    assert.ok(SRC.includes("cityFilter !== 'ALL'"))
  })
  it('边界: 经纬度格式化', () => {
    assert.ok(SRC.includes('.toFixed(4)'))
  })
  it('应接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'))
    assert.ok(SRC.includes("requiredPermission: 'dashboard:read'"))
  })
})
