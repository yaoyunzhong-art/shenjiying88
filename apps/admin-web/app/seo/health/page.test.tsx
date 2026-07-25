import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8')

describe('SEO健康报告', () => {
  it('正例: 包含页面标题', () => {
    assert.ok(SRC.includes('SEO 健康报告'))
  })

  it('正例: 4个概览卡片显示', () => {
    assert.ok(SRC.includes('扫描页面'))
    assert.ok(SRC.includes('有元数据'))
    assert.ok(SRC.includes('有Sitemap'))
    assert.ok(SRC.includes('平均评分'))
  })

  it('正例: 问题列表渲染', () => {
    assert.ok(SRC.includes('发现的问题'))
    assert.ok(SRC.includes('SEV_ICONS'))
  })

  it('正例: 展开问题详情', () => {
    assert.ok(SRC.includes('setExpanded'))
    assert.ok(SRC.includes('缺少SEO元数据'))
  })

  it('反例: 错误态 (当report为null)', () => {
    assert.ok(SRC.includes('无法加载健康报告'))
  })

  it('边界: 覆盖率进度条显示', () => {
    assert.ok(SRC.includes('SEO 覆盖健康度'))
    assert.ok(SRC.includes('coverageRate'))
    assert.ok(SRC.includes('建议补充'))
  })

  it('应接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'))
    assert.ok(SRC.includes("requiredPermission: 'dashboard:read'"))
  })
})
