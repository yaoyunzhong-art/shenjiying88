/**
 * help-center/page.test.ts — 帮助中心公开页 E54 拍平固证
 * 公开 marketing 页不在 E54 拍平主线，保留源码级 E54 兼容性固证。
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'help-center-data.ts'), 'utf-8')

describe('help-center page — 公开页结构', () => {
  it('page 应导出 HelpCenterPage 默认组件', () => {
    assert.ok(PAGE_SRC.includes('export default'), '缺少 default 导出')
    assert.ok(PAGE_SRC.includes('HelpCenterPage'), '缺少 HelpCenterPage')
  })

  it('page 应保持 Suspense + ErrorBoundary 公开页壳层', () => {
    assert.ok(PAGE_SRC.includes('Suspense'))
    assert.ok(PAGE_SRC.includes('ErrorBoundary'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
  })

  it('page 应挂载 HelpCenterClient 客户端', () => {
    assert.ok(PAGE_SRC.includes('HelpCenterClient'))
  })

  it('page 不应受 E54 拍平影响 - 不含 sourceEvidence 模板', () => {
    assert.ok(!PAGE_SRC.includes('{sourceEvidence.deliveryMode}'), 'help-center 公开页不承载 sourceEvidence 模板')
  })
})

describe('help-center data — 快照合同', () => {
  it('data 暴露 loadHelpCenterSnapshot', () => {
    assert.ok(DATA_SRC.includes('loadHelpCenterSnapshot'))
  })

  it('data 应包含文章总数与分类配置', () => {
    assert.ok(DATA_SRC.includes('articles') || DATA_SRC.includes('articleCount'))
  })
})
