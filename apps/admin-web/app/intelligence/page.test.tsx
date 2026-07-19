/**
 * intelligence/page.test.tsx — Dashboard KPI测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

describe('Intelligence Dashboard', () => {
  it('页面文件存在', () => {
    assert.ok(fs.existsSync('apps/admin-web/app/intelligence/page.tsx'))
  })

  it('Dashboard有KPI卡片', () => {
    const content = fs.readFileSync('apps/admin-web/app/intelligence/page.tsx', 'utf-8')
    assert.ok(content.includes('KpiCard'))
    assert.ok(content.includes('监控城市'))
    assert.ok(content.includes('高优先级'))
  })

  it('Dashboard有功能入口', () => {
    const content = fs.readFileSync('apps/admin-web/app/intelligence/page.tsx', 'utf-8')
    assert.ok(content.includes('/intelligence/feasibility'))
    assert.ok(content.includes('/intelligence/operations'))
    assert.ok(content.includes('/intelligence/monitor'))
  })

  it('Dashboard有快速操作区', () => {
    const content = fs.readFileSync('apps/admin-web/app/intelligence/page.tsx', 'utf-8')
    assert.ok(content.includes('快速操作'))
    assert.ok(content.includes('评估新店'))
    assert.ok(content.includes('获取AI建议'))
  })

  it('Dashboard支持刷新', () => {
    const content = fs.readFileSync('apps/admin-web/app/intelligence/page.tsx', 'utf-8')
    assert.ok(content.includes('刷新'))
  })

  it('Dashboard支持加载状态', () => {
    const content = fs.readFileSync('apps/admin-web/app/intelligence/page.tsx', 'utf-8')
    assert.ok(content.includes('加载') || content.includes('loading'))
  })
})
