/**
 * intelligence/page.test.tsx — 运营参谋入口测试
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'

describe('Intelligence入口', () => {
  it('入口页面组件已存在', () => {
    const fs = require('fs')
    const content = fs.readFileSync('apps/admin-web/app/intelligence/page.tsx', 'utf-8')
    assert.ok(content.includes('运营参谋'))
    assert.ok(content.includes('feasibility'))
    assert.ok(content.includes('operations'))
    assert.ok(content.includes('monitor'))
  })

  it('三个子页面入口文件存在', () => {
    const fs = require('fs')
    assert.ok(fs.existsSync('apps/admin-web/app/intelligence/feasibility/page.tsx'))
    assert.ok(fs.existsSync('apps/admin-web/app/intelligence/operations/page.tsx'))
    assert.ok(fs.existsSync('apps/admin-web/app/intelligence/monitor/page.tsx'))
  })

  it('页面包含三个入口链接', () => {
    const fs = require('fs')
    const content = fs.readFileSync('apps/admin-web/app/intelligence/page.tsx', 'utf-8')
    const links = content.match(/href="\/intelligence\/[^"]+"/g)
    assert.ok(links)
    assert.equal(links.length, 3)
  })

  it('链接指向正确路径', () => {
    const fs = require('fs')
    const content = fs.readFileSync('apps/admin-web/app/intelligence/page.tsx', 'utf-8')
    assert.ok(content.includes('/intelligence/feasibility'))
    assert.ok(content.includes('/intelligence/operations'))
    assert.ok(content.includes('/intelligence/monitor'))
  })
})
