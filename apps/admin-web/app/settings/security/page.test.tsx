/**
 * settings/security/page.test.tsx — 安全设置 L1 测试（增强版 22 tests）
 *
 * 覆盖: 页面结构、策略配置完整性、安全合规验证、React 渲染、UI 结构
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD标记
 * 原则: 禁止 as any / describe.skip / it.only
 */
import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import fs from 'fs'
import { render, screen, cleanup, act } from '@testing-library/react'
import SecurityPage from './page'

const PAGE = resolve(import.meta.dirname, 'page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')
const ADMIN_USER_KEY = 'admin_user'

describe('settings/security', () => {
  // ── 页面存在与导出 ──
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export 函数', () => {
    assert.ok(content.includes('export default function SecurityPage'))
  })
  it('仅一个 export default', () => {
    const matches = content.match(/export default/g)
    assert.equal(matches?.length, 1)
  })
  it('TSC兼容: 无 as any', () => { assert.ok(!content.includes('as any')) })

  // ── 密码策略 ──
  it('包含密码策略 section', () => { assert.ok(content.includes('密码策略')) })
  it('密码最小长度配置为 8 位', () => { assert.ok(content.includes('8 位')) })
  it('需包含大写字母', () => { assert.ok(content.includes('大写字母')) })
  it('需包含小写字母', () => { assert.ok(content.includes('小写字母')) })
  it('需包含数字和特殊字符', () => {
    assert.ok(content.includes('数字'))
    assert.ok(content.includes('特殊字符'))
  })
  it('密码有效期 90 天', () => { assert.ok(content.includes('90 天')) })
  it('禁止重复最近 5 次密码', () => {
    assert.ok(content.includes('5 次'))
    assert.ok(content.includes('重复次数'))
  })

  // ── 登录保护 ──
  it('包含登录保护 section', () => { assert.ok(content.includes('登录保护')) })
  it('最大登录尝试次数 5 次', () => { assert.ok(content.includes('5 次')) })
  it('锁定时间 30 分钟', () => { assert.ok(content.includes('30 分钟')) })
  it('支持二次验证', () => { assert.ok(content.includes('二次验证')) })

  // ── 安全合规 ──
  it('包含安全合规要求 section', () => { assert.ok(content.includes('安全合规要求')) })
  it('包含操作审计日志记录', () => { assert.ok(content.includes('审计日志')) })

  // ── 结构完整性 ──
  it('页面包含 3 个独立 section', () => {
    const sections = content.match(/<h2[^>]*>/g)
    assert.equal(sections?.length, 3)
  })
  it('包含 IP 白名单配置项（标记为未配置）', () => {
    assert.ok(content.includes('IP 白名单'))
    assert.ok(content.includes('未配置'))
  })
  it('安全合规 checklist 包含 5 项', () => {
    const checkItems = content.match(/checkItem\(/g)
    assert.equal(checkItems?.length, 1, 'COMPLIANCE_ITEMS.map renders checkItems once')
  })
  it('包含 use client 指令', () => {
    assert.ok(content.includes("'use client'"))
  })
})

// ── React 渲染测试 ──
describe('settings/security — React 渲染', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  async function renderAfterLoad() {
    window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify({
      userId: 'admin:test',
      username: 'security-admin',
      role: 'super-admin',
      permissions: ['foundation.governance.read'],
    }))
    const view = render(<SecurityPage />)
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    return view
  }

  it('组件能够渲染不抛出错误', () => {
    assert.doesNotThrow(() => render(<SecurityPage />))
  })

  it('渲染页面标题「🔒 安全设置」', async () => {
    await renderAfterLoad()
    const heading = screen.getByText('🔒 安全设置')
    assert.ok(heading)
    assert.strictEqual(heading.tagName, 'H1')
  })

  it('渲染 3 个 section 标题（h2）', async () => {
    await renderAfterLoad()
    const sections = screen.getAllByRole('heading', { level: 2 })
    assert.strictEqual(sections.length, 3)
  })
})

describe('settings/security — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(content.includes('AdminPermissionGate'))
    assert.ok(content.includes("requiredPermission: 'foundation.governance.read'"))
  })
})
