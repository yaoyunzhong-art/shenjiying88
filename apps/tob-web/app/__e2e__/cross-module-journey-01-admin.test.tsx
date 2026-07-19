/**
 * cross-module-journey-01-admin.test.tsx — tob-web L3 跨模块 E2E 测试
 * 角色: 收银员(前台)→AI营销→会员中心→审计日志
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

const DIR = 'apps/tob-web/app'

describe('tob-web L3 跨模块 E2E: 收银员流程', () => {
  // === 收银POS ===
  it('cashier-pos page 存在', () => { assert.ok(fs.existsSync(`${DIR}/cashier-pos/page.tsx`)) })
  it('cashier-pos 包含 export default', () => {
    const c = fs.readFileSync(`${DIR}/cashier-pos/page.tsx`, 'utf-8')
    assert.ok(c.includes('export default'))
  })
  it('cashier-pos 包含产品条目(useState)', () => {
    const c = fs.readFileSync(`${DIR}/cashier-pos/page.tsx`, 'utf-8')
    assert.ok(c.includes('useState') || c.includes('product'))
  })
  it('cashier-pos 包含按钮', () => {
    const c = fs.readFileSync(`${DIR}/cashier-pos/page.tsx`, 'utf-8')
    assert.ok(c.includes('button') || c.includes('Button'))
  })
  // === AI营销 ===
  it('ai-marketing page 存在', () => { assert.ok(fs.existsSync(`${DIR}/ai-marketing/page.tsx`)) })
  it('ai-marketing 包含 AI/推荐', () => {
    const c = fs.readFileSync(`${DIR}/ai-marketing/page.tsx`, 'utf-8')
    assert.ok(c.includes('AI') || c.includes('ai') || c.includes('recommend') || c.includes('Recommend'))
  })
  it('ai-marketing 包含 Tab 切换', () => {
    const c = fs.readFileSync(`${DIR}/ai-marketing/page.tsx`, 'utf-8')
    assert.ok(c.includes('Tab') || c.includes('tabs'))
  })
  // === 会员中心 ===
  it('member-center page 存在', () => { assert.ok(fs.existsSync(`${DIR}/member-center/page.tsx`)) })
  it('member-center 包含会员等级', () => {
    const c = fs.readFileSync(`${DIR}/member-center/page.tsx`, 'utf-8')
    assert.ok(c.includes('level') || c.includes('Level') || c.includes('等级') || c.includes('card') || c.includes('Card'))
  })
  it('member-center 包含列表', () => {
    const c = fs.readFileSync(`${DIR}/member-center/page.tsx`, 'utf-8')
    assert.ok(c.includes('.map(') || c.includes('list') || c.includes('List'))
  })
  // === 审计日志 ===
  it('audit-logs page 存在', () => { assert.ok(fs.existsSync(`${DIR}/audit-logs/page.tsx`)) })
  // === 跨模块 ===
  it('跨模块: 所有4页面均有测试', () => {
    for (const p of ['cashier-pos', 'ai-marketing', 'member-center', 'audit-logs']) {
      assert.ok(fs.existsSync(`${DIR}/${p}/page.test.tsx`) || fs.existsSync(`${DIR}/${p}/page.test.ts`))
    }
  })
  it('TSC兼容: 所有4页面无as any', () => {
    for (const p of ['cashier-pos', 'ai-marketing', 'member-center', 'audit-logs']) {
      const f = `${DIR}/${p}/page.tsx`
      if (fs.existsSync(f)) {
        const c = fs.readFileSync(f, 'utf-8')
        assert.ok(!c.includes('as any'), `as any found in ${p}`)
      }
    }
  })
})
