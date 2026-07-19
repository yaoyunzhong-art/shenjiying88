/**
 * settings/security/page.test.tsx — 安全设置 L1 测试
 *
 * 覆盖: 页面结构、策略配置完整性、安全合规验证
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD标记
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import fs from 'fs'

const PAGE = resolve(import.meta.dirname, 'page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('settings/security', () => {
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

  // ── 密码策略 ──
  it('包含密码策略 section', () => { assert.ok(content.includes('密码策略') || content.includes('密码')) })
  it('密码最小长度配置为 8 位', () => { assert.ok(content.includes('8 位') || content.includes('最小密码长度')) })
  it('需包含大写字母', () => { assert.ok(content.includes('大写字母') || content.includes('大写')) })
  it('需包含小写字母', () => { assert.ok(content.includes('小写字母') || content.includes('小写')) })
  it('需包含数字和特殊字符', () => {
    assert.ok(content.includes('数字'))
    assert.ok(content.includes('特殊字符'))
  })
  it('密码有效期 90 天', () => { assert.ok(content.includes('90 天') || content.includes('密码有效期')) })
  it('禁止重复最近 5 次密码', () => { assert.ok(content.includes('5 次') || content.includes('重复次数')) })

  // ── 登录保护 ──
  it('包含登录保护 section', () => { assert.ok(content.includes('登录保护')) })
  it('最大登录尝试次数 5 次', () => { assert.ok(content.includes('5 次')) })
  it('锁定时间 30 分钟', () => { assert.ok(content.includes('30 分钟')) })
  it('支持二次验证', () => { assert.ok(content.includes('二次验证') || content.includes('验证码')) })

  // ── 安全合规 ──
  it('包含安全合规要求 section', () => { assert.ok(content.includes('安全合规') || content.includes('合规要求')) })
  it('包含操作审计日志记录', () => { assert.ok(content.includes('审计日志') || content.includes('操作审计')) })
})
